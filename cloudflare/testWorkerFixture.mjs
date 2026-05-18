import crypto from "node:crypto";

const workerUrl = process.env.SECURESTOP_WORKER_URL?.trim();
const tenantId =
  process.env.SECURESTOP_FIXTURE_TENANT_ID?.trim() || "mock-school";
const sharedSecret = process.env.SECURESTOP_WORKER_SHARED_SECRET?.trim();
const signingSecret = process.env.SECURESTOP_WORKER_SIGNING_SECRET?.trim();
const scenario = process.env.SECURESTOP_WORKER_SCENARIO?.trim() || "happy";

if (!workerUrl) {
  console.error("Set SECURESTOP_WORKER_URL before running this fixture.");
  process.exit(1);
}

const supportedScenarios = new Set([
  "happy",
  "duplicate",
  "expired-signature",
  "invalid-signature",
]);

if (!supportedScenarios.has(scenario)) {
  console.error(
    `Unsupported SECURESTOP_WORKER_SCENARIO: ${scenario}. Expected one of: ${Array.from(supportedScenarios).join(", ")}.`,
  );
  process.exit(1);
}

const now = Date.now();
const fixture = {
  version: 1,
  source: "securestop-worker",
  events: [
    {
      id: `incident.created-fixture-${now}`,
      name: "incident.created",
      occurredAt: now,
      payload: {
        tenantId,
        incidentId: `fixture-incident-${now}`,
        alertId: `fixture-alert-${now}`,
        title: "Fixture Incident",
        description: "Direct worker fixture event",
        severity: "orange",
        vehicleId: "fixture-vehicle",
        createdAt: now,
        createdByRole: "admin",
      },
    },
  ],
};

const body = JSON.stringify(fixture);

function createSignedHeaders(payloadBody, currentScenario) {
  const nextHeaders = {
    "content-type": "application/json",
  };

  if (sharedSecret) {
    nextHeaders["x-securestop-ingress-secret"] = sharedSecret;
  }

  if (!signingSecret) {
    return nextHeaders;
  }

  const issuedAtSeconds =
    currentScenario === "expired-signature"
      ? Math.floor(Date.now() / 1000) - 10 * 60
      : Math.floor(Date.now() / 1000);
  const timestamp = issuedAtSeconds.toString();
  const signature = crypto
    .createHmac("sha256", signingSecret)
    .update(`${timestamp}.${payloadBody}`)
    .digest("hex");

  nextHeaders["x-securestop-ingress-timestamp"] = timestamp;
  nextHeaders["x-securestop-ingress-signature"] =
    currentScenario === "invalid-signature"
      ? `${signature.slice(0, -2)}00`
      : signature;

  return nextHeaders;
}

async function postFixtureAttempt(label) {
  const response = await fetch(workerUrl, {
    method: "POST",
    headers: createSignedHeaders(body, scenario),
    body,
  });

  const text = await response.text();
  console.log(`${label} status=${response.status}`);
  console.log(text);
  return response;
}

const attempts = scenario === "duplicate" ? ["first", "second"] : ["single"];
let hasFailure = false;

for (const attempt of attempts) {
  const response = await postFixtureAttempt(attempt);
  if (!response.ok) {
    hasFailure = true;
  }
}

if (hasFailure) {
  process.exit(1);
}
