import type { DomainEvent } from "@/core/events/contracts";
import type {
    DomainEventIngressFailure,
    DomainEventIngressRequest,
    DomainEventIngressResponse,
    DomainEventProjectionOperation,
} from "@/core/events/ingress";
import {
    projectDomainEventToReadModels,
    type IncidentReadModelRecord,
} from "@/lib/events/readModelProjection";

type CloudflareDomainEventIngressEnv = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_SCHEMA?: string;
  INGRESS_SHARED_SECRET?: string;
  INGRESS_SIGNING_SECRET?: string;
};

const SIGNATURE_TTL_SECONDS = 5 * 60;

type SupabaseTableName =
  | "alert_inbox"
  | "incident_read_models"
  | "domain_event_receipts";

type DomainEventReceiptRecord = {
  event_id: string;
  event_name: DomainEvent["name"];
  tenant_id: string | null;
  source: DomainEventIngressRequest["source"];
  occurred_at: number;
};

type IngressMetrics = {
  projectedCount: number;
  duplicateCount: number;
  unauthorizedCount: number;
  invalidCount: number;
  failedCount: number;
};

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      ...(init?.headers ?? {}),
    },
  });
}

function createEmptyMetrics(): IngressMetrics {
  return {
    projectedCount: 0,
    duplicateCount: 0,
    unauthorizedCount: 0,
    invalidCount: 0,
    failedCount: 0,
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unknown worker error";
}

function createFailure(
  event: DomainEvent,
  stage: DomainEventIngressFailure["stage"],
  error: unknown,
): DomainEventIngressFailure {
  return {
    eventId: event.id,
    eventName: event.name,
    stage,
    message: errorMessage(error),
  };
}

function isAuthorizedRequest(
  request: Request,
  env: CloudflareDomainEventIngressEnv,
  body: string,
): Promise<boolean> {
  const expectedSecret = env.INGRESS_SHARED_SECRET?.trim();
  const signingSecret = env.INGRESS_SIGNING_SECRET?.trim();

  if (signingSecret) {
    return verifySignedRequest(request, signingSecret, body);
  }

  if (!expectedSecret) return Promise.resolve(true);

  const providedSecret = request.headers
    .get("x-securestop-ingress-secret")
    ?.trim();
  return Promise.resolve(!!providedSecret && providedSecret === expectedSecret);
}

function hexToBytes(value: string): Uint8Array | undefined {
  if (value.length % 2 !== 0) return undefined;

  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < value.length; index += 2) {
    const byte = Number.parseInt(value.slice(index, index + 2), 16);
    if (Number.isNaN(byte)) return undefined;
    bytes[index / 2] = byte;
  }

  return bytes;
}

function timingSafeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left[index] ^ right[index];
  }

  return mismatch === 0;
}

async function createExpectedSignature(params: {
  secret: string;
  timestamp: string;
  body: string;
}): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(params.secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${params.timestamp}.${params.body}`),
  );
  return new Uint8Array(signature);
}

async function verifySignedRequest(
  request: Request,
  secret: string,
  body: string,
): Promise<boolean> {
  const timestamp = request.headers
    .get("x-securestop-ingress-timestamp")
    ?.trim();
  const signature = request.headers
    .get("x-securestop-ingress-signature")
    ?.trim()
    .toLowerCase();

  if (!timestamp || !signature) return false;

  const issuedAt = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(issuedAt)) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - issuedAt) > SIGNATURE_TTL_SECONDS) return false;

  const providedSignature = hexToBytes(signature);
  if (!providedSignature) return false;

  const expectedSignature = await createExpectedSignature({
    secret,
    timestamp,
    body,
  });
  return timingSafeEqual(providedSignature, expectedSignature);
}

function isDomainEventIngressRequest(
  value: unknown,
): value is DomainEventIngressRequest {
  if (!value || typeof value !== "object") return false;
  const next = value as Partial<DomainEventIngressRequest>;
  return next.version === 1 && Array.isArray(next.events);
}

function schemaHeaders(env: CloudflareDomainEventIngressEnv) {
  const schema = env.SUPABASE_SCHEMA?.trim() || "public";
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    Accept: "application/json",
    "Accept-Profile": schema,
    "Content-Profile": schema,
  };
}

function restUrl(
  env: CloudflareDomainEventIngressEnv,
  table: SupabaseTableName,
  query?: string,
) {
  const base = env.SUPABASE_URL.replace(/\/+$/, "");
  const suffix = query ? `?${query}` : "";
  return `${base}/rest/v1/${table}${suffix}`;
}

async function loadIncidentReadModel(
  env: CloudflareDomainEventIngressEnv,
  incidentId: string,
): Promise<IncidentReadModelRecord | undefined> {
  const response = await fetch(
    restUrl(
      env,
      "incident_read_models",
      `id=eq.${encodeURIComponent(incidentId)}&select=*`,
    ),
    {
      method: "GET",
      headers: schemaHeaders(env),
    },
  );

  if (!response.ok) {
    throw new Error(`Supabase incident lookup failed: ${response.status}`);
  }

  const rows = (await response.json()) as IncidentReadModelRecord[];
  return Array.isArray(rows) ? rows[0] : undefined;
}

async function hasProcessedEvent(
  env: CloudflareDomainEventIngressEnv,
  eventId: string,
): Promise<boolean> {
  const response = await fetch(
    restUrl(
      env,
      "domain_event_receipts",
      `event_id=eq.${encodeURIComponent(eventId)}&select=event_id`,
    ),
    {
      method: "GET",
      headers: schemaHeaders(env),
    },
  );

  if (!response.ok) {
    throw new Error(`Supabase receipt lookup failed: ${response.status}`);
  }

  const rows = (await response.json()) as Array<{ event_id: string }>;
  return Array.isArray(rows) && rows.length > 0;
}

async function writeEventReceipt(
  env: CloudflareDomainEventIngressEnv,
  params: {
    event: DomainEvent;
    source: DomainEventIngressRequest["source"];
  },
): Promise<void> {
  const record: DomainEventReceiptRecord = {
    event_id: params.event.id,
    event_name: params.event.name,
    tenant_id:
      "tenantId" in params.event.payload &&
      typeof params.event.payload.tenantId === "string"
        ? params.event.payload.tenantId
        : null,
    source: params.source,
    occurred_at: params.event.occurredAt,
  };

  const response = await fetch(restUrl(env, "domain_event_receipts"), {
    method: "POST",
    headers: {
      ...schemaHeaders(env),
      "content-type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify([record]),
  });

  if (!response.ok) {
    throw new Error(`Supabase receipt write failed: ${response.status}`);
  }
}

async function applyProjectionOperation(
  env: CloudflareDomainEventIngressEnv,
  operation: DomainEventProjectionOperation,
): Promise<void> {
  if (operation.type === "delete") {
    const response = await fetch(
      restUrl(
        env,
        operation.table,
        `id=eq.${encodeURIComponent(operation.key)}`,
      ),
      {
        method: "DELETE",
        headers: {
          ...schemaHeaders(env),
          Prefer: "return=minimal",
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Supabase delete failed for ${operation.table}: ${response.status}`,
      );
    }
    return;
  }

  const response = await fetch(restUrl(env, operation.table), {
    method: "POST",
    headers: {
      ...schemaHeaders(env),
      "content-type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify([operation.record]),
  });

  if (!response.ok) {
    throw new Error(
      `Supabase upsert failed for ${operation.table}: ${response.status}`,
    );
  }
}

async function projectEvent(
  env: CloudflareDomainEventIngressEnv,
  event: DomainEvent,
): Promise<DomainEventProjectionOperation[]> {
  if (event.name === "incident.noted" || event.name === "incident.resolved") {
    const current = await loadIncidentReadModel(env, event.payload.incidentId);
    return projectDomainEventToReadModels(event, {
      incidentReadModel: current ?? null,
    });
  }

  return projectDomainEventToReadModels(event);
}

async function handleDomainEventIngress(
  request: Request,
  env: CloudflareDomainEventIngressEnv,
): Promise<Response> {
  const metrics = createEmptyMetrics();

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "POST, OPTIONS",
        "access-control-allow-headers":
          "content-type, x-securestop-ingress-secret, x-securestop-ingress-timestamp, x-securestop-ingress-signature",
      },
    });
  }

  if (request.method !== "POST") {
    metrics.invalidCount += 1;
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    metrics.invalidCount += 1;
    console.error("domainEventIngress missing worker configuration");
    return jsonResponse(
      { error: "Missing Supabase worker configuration" },
      { status: 500 },
    );
  }

  let bodyText = "";
  try {
    bodyText = await request.text();
  } catch {
    metrics.invalidCount += 1;
    console.warn("domainEventIngress invalid body read");
    return jsonResponse({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!(await isAuthorizedRequest(request, env, bodyText))) {
    metrics.unauthorizedCount += 1;
    console.warn("domainEventIngress unauthorized request");
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    metrics.invalidCount += 1;
    console.warn("domainEventIngress invalid JSON payload");
    return jsonResponse({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isDomainEventIngressRequest(body)) {
    metrics.invalidCount += 1;
    console.warn("domainEventIngress invalid ingress payload");
    return jsonResponse({ error: "Invalid ingress payload" }, { status: 400 });
  }

  const projected: DomainEventProjectionOperation[] = [];
  for (const event of body.events) {
    if (await hasProcessedEvent(env, event.id)) {
      metrics.duplicateCount += 1;
      console.info(`domainEventIngress duplicate event skipped: ${event.id}`);
      continue;
    }

    let operations: DomainEventProjectionOperation[];
    try {
      operations = await projectEvent(env, event);
    } catch (error) {
      metrics.failedCount += 1;
      const failure = createFailure(event, "projection", error);
      console.error("domainEventIngress projection failed", failure);
      return jsonResponse(
        {
          error: "Failed to project event",
          accepted: body.events.length,
          projected,
          failures: [failure],
          metrics,
        } satisfies DomainEventIngressResponse & { error: string },
        { status: 500 },
      );
    }

    for (const operation of operations) {
      try {
        await applyProjectionOperation(env, operation);
      } catch (error) {
        metrics.failedCount += 1;
        const failure = createFailure(event, "apply", error);
        console.error("domainEventIngress projection apply failed", {
          ...failure,
          table: operation.table,
          operationType: operation.type,
          key: operation.key,
        });
        return jsonResponse(
          {
            error: "Failed to apply projected operation",
            accepted: body.events.length,
            projected,
            failures: [failure],
            metrics,
          } satisfies DomainEventIngressResponse & { error: string },
          { status: 500 },
        );
      }

      projected.push(operation);
      metrics.projectedCount += 1;
    }

    try {
      await writeEventReceipt(env, { event, source: body.source });
    } catch (error) {
      metrics.failedCount += 1;
      const failure = createFailure(event, "receipt", error);
      console.error("domainEventIngress receipt write failed", failure);
      return jsonResponse(
        {
          error: "Failed to write event receipt",
          accepted: body.events.length,
          projected,
          failures: [failure],
          metrics,
        } satisfies DomainEventIngressResponse & { error: string },
        { status: 500 },
      );
    }
  }

  const response: DomainEventIngressResponse = {
    accepted: body.events.length,
    projected,
    metrics,
  };
  console.info(
    `domainEventIngress accepted=${body.events.length} projected=${metrics.projectedCount} duplicates=${metrics.duplicateCount}`,
  );
  return jsonResponse(response, {
    status: 202,
  });
}

export default {
  fetch(request: Request, env: CloudflareDomainEventIngressEnv) {
    return handleDomainEventIngress(request, env);
  },
};
