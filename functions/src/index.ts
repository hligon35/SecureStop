/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { createHmac } from "node:crypto";

import { setGlobalOptions } from "firebase-functions";
import { onRequest } from "firebase-functions/https";
import * as logger from "firebase-functions/logger";

function setCorsHeaders(response: {
  set: (name: string, value: string) => void;
}) {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.set("Access-Control-Allow-Headers", "content-type, authorization");
}

function getCloudflareIngressConfig() {
  const url = process.env.SECURESTOP_CLOUDFLARE_EVENTS_URL?.trim();
  const sharedSecret =
    process.env.SECURESTOP_CLOUDFLARE_INGRESS_SHARED_SECRET?.trim();
  const signingSecret =
    process.env.SECURESTOP_CLOUDFLARE_SIGNING_SECRET?.trim();

  return { url, sharedSecret, signingSecret };
}

function createIngressSignature(params: {
  secret: string;
  timestamp: string;
  body: string;
}) {
  return createHmac("sha256", params.secret)
    .update(`${params.timestamp}.${params.body}`)
    .digest("hex");
}

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

export const domainEventRelay = onRequest(async (request, response) => {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { url, sharedSecret, signingSecret } = getCloudflareIngressConfig();
  if (!url) {
    logger.error("Missing SECURESTOP_CLOUDFLARE_EVENTS_URL");
    response.status(500).json({ error: "Missing relay configuration" });
    return;
  }

  try {
    const body = JSON.stringify(request.body ?? {});
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(sharedSecret
          ? { "x-securestop-ingress-secret": sharedSecret }
          : {}),
        ...(signingSecret
          ? {
              "x-securestop-ingress-timestamp": timestamp,
              "x-securestop-ingress-signature": createIngressSignature({
                secret: signingSecret,
                timestamp,
                body,
              }),
            }
          : {}),
      },
      body,
    });

    const text = await upstream.text();
    response.status(upstream.status);
    response.set(
      "content-type",
      upstream.headers.get("content-type") ?? "application/json",
    );
    response.send(text);
  } catch (error) {
    logger.error("domainEventRelay failed", error);
    response.status(502).json({ error: "Failed to reach Cloudflare ingress" });
  }
});
