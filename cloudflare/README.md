# Cloudflare Domain Event Ingress

This folder contains the Cloudflare Worker that receives SecureStop domain-event batches and projects them into Supabase read models.

## Files

- `domainEventIngressWorker.ts`: Worker entrypoint for `/events/domain`
- `wrangler.toml`: Worker runtime configuration

## Required Supabase migrations

Apply these in order before deploying the worker:

1. `supabase/migrations/0001_identity_directory.sql`
2. `supabase/migrations/0002_operational_read_models.sql`
3. `supabase/migrations/0003_domain_event_receipts.sql`

## Required secrets

Configure these with Wrangler secrets:

```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

Optional hardening secret:

```bash
wrangler secret put INGRESS_SHARED_SECRET
```

Optional relay-signing secret:

```bash
wrangler secret put INGRESS_SIGNING_SECRET
```

If `INGRESS_SHARED_SECRET` is set, requests must include the `x-securestop-ingress-secret` header with the same value.
If `INGRESS_SIGNING_SECRET` is set, requests must also include `x-securestop-ingress-timestamp` and `x-securestop-ingress-signature`. The Firebase relay in this repo can generate those headers.

## Local development

From the repo root:

```bash
npm run cloudflare:dev
```

Or directly:

```bash
npx wrangler dev --config cloudflare/wrangler.toml
```

## Deploy

From the repo root:

```bash
npm run cloudflare:deploy
```

Or directly:

```bash
npx wrangler deploy --config cloudflare/wrangler.toml
```

## Relay fixture

To post a sample event batch through the trusted relay during local development:

```bash
SECURESTOP_RELAY_URL="http://127.0.0.1:5001/<project-id>/us-central1/domainEventRelay" npm run cloudflare:test:relay
```

Optional tenant override:

```bash
SECURESTOP_RELAY_URL="http://127.0.0.1:5001/<project-id>/us-central1/domainEventRelay" SECURESTOP_FIXTURE_TENANT_ID="demo-school" npm run cloudflare:test:relay
```

## Direct worker fixture

To post a sample batch directly to the worker:

```bash
SECURESTOP_WORKER_URL="http://127.0.0.1:8787/events/domain" npm run cloudflare:test:worker
```

If the worker is using shared-secret or signing enforcement, set one or both:

```bash
SECURESTOP_WORKER_URL="http://127.0.0.1:8787/events/domain" \
SECURESTOP_WORKER_SHARED_SECRET="<shared-secret>" \
SECURESTOP_WORKER_SIGNING_SECRET="<signing-secret>" \
npm run cloudflare:test:worker
```

The worker response includes `metrics` so you can see projected operations, duplicate skips, unauthorized attempts, and invalid payload counts during local testing.

When projection, Supabase write, or receipt persistence fails, the worker now returns a `failures` array that identifies the event id, event name, and failing stage (`projection`, `apply`, or `receipt`).

You can also force specific ingress branches with `SECURESTOP_WORKER_SCENARIO`:

```bash
SECURESTOP_WORKER_URL="http://127.0.0.1:8787/events/domain" \
SECURESTOP_WORKER_SCENARIO="duplicate" \
npm run cloudflare:test:worker
```

Supported scenarios:

- `happy`: one valid request
- `duplicate`: sends the same batch twice so the second request should increment duplicate metrics
- `expired-signature`: sends a stale signed request when `SECURESTOP_WORKER_SIGNING_SECRET` is set
- `invalid-signature`: sends a tampered signed request when `SECURESTOP_WORKER_SIGNING_SECRET` is set

## Security note

Do not put the shared secret into Expo public env vars. Those values are shipped to the client. Enable `INGRESS_SHARED_SECRET` only when event ingress is routed through a trusted backend or edge caller that can safely attach the header.

## Trusted relay option

This repo includes a Firebase Functions relay at `functions/src/index.ts` exposed as `domainEventRelay`.

Configure the relay with backend-only environment variables:

```bash
firebase functions:config:set \
  securestop.cloudflare_events_url="https://<worker-subdomain>/events/domain" \
  securestop.cloudflare_ingress_shared_secret="<shared-secret>" \
  securestop.cloudflare_signing_secret="<signing-secret>"
```

Or set the equivalent process env vars used by the function runtime:

- `SECURESTOP_CLOUDFLARE_EVENTS_URL`
- `SECURESTOP_CLOUDFLARE_INGRESS_SHARED_SECRET`
- `SECURESTOP_CLOUDFLARE_SIGNING_SECRET`

To send the mobile app through the relay instead of directly to Cloudflare:

1. Set `EXPO_PUBLIC_API_BASE_URL` to the trusted backend base URL.
2. Set `EXPO_PUBLIC_CLOUDFLARE_EVENTS_PATH` to `/domainEventRelay`.
3. Do not set `EXPO_PUBLIC_CLOUDFLARE_EVENTS_BASE_URL` in the client.

That keeps the shared secret on the backend while preserving the existing client sink contract.
If `INGRESS_SIGNING_SECRET` is configured in Cloudflare, set the same value in `SECURESTOP_CLOUDFLARE_SIGNING_SECRET` on the relay.
