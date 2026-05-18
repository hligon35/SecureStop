const relayUrl = process.env.SECURESTOP_RELAY_URL?.trim();
const tenantId =
  process.env.SECURESTOP_FIXTURE_TENANT_ID?.trim() || "mock-school";

if (!relayUrl) {
  console.error("Set SECURESTOP_RELAY_URL before running this fixture.");
  process.exit(1);
}

const now = Date.now();
const fixture = {
  version: 1,
  source: "securestop-client",
  events: [
    {
      id: `alert.received-fixture-${now}`,
      name: "alert.received",
      occurredAt: now,
      payload: {
        tenantId,
        alertId: `fixture-alert-${now}`,
        title: "Fixture Alert",
        body: "Relay fixture event",
        severity: "orange",
        recipients: "school",
        vehicleId: "fixture-vehicle",
        createdAt: now,
        createdByRole: "admin",
        templateId: "fixture_template",
      },
    },
  ],
};

const response = await fetch(relayUrl, {
  method: "POST",
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify(fixture),
});

const text = await response.text();
console.log(`status=${response.status}`);
console.log(text);

if (!response.ok) {
  process.exit(1);
}
