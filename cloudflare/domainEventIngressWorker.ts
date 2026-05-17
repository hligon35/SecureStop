import type { DomainEvent } from "@/core/events/contracts";
import type {
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
};

type SupabaseTableName = "alert_inbox" | "incident_read_models";

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
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
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse(
      { error: "Missing Supabase worker configuration" },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isDomainEventIngressRequest(body)) {
    return jsonResponse({ error: "Invalid ingress payload" }, { status: 400 });
  }

  const projected: DomainEventProjectionOperation[] = [];
  for (const event of body.events) {
    const operations = await projectEvent(env, event);
    for (const operation of operations) {
      await applyProjectionOperation(env, operation);
      projected.push(operation);
    }
  }

  const response: DomainEventIngressResponse = {
    accepted: body.events.length,
    projected,
  };
  return jsonResponse(response, { status: 202 });
}

export default {
  fetch(request: Request, env: CloudflareDomainEventIngressEnv) {
    return handleDomainEventIngress(request, env);
  },
};
