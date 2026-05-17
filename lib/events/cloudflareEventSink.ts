import type { DomainEvent } from "@/core/events/contracts";
import { createDomainEventIngressRequest } from "@/core/events/ingress";
import type { DomainEventSink } from "@/core/events/sink";
import { api } from "@/lib/api/client";
import { getConfig } from "@/lib/config";

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function getDomainEventIngressEndpoint(): string | undefined {
  const config = getConfig();
  const path = config.cloudflare?.domainEventIngressPath || "/events/domain";
  const explicitBaseUrl = config.cloudflare?.domainEventIngressBaseUrl?.trim();

  if (explicitBaseUrl) {
    return joinUrl(explicitBaseUrl, path);
  }

  const apiBaseUrl = config.apiBaseUrl.trim();
  if (!apiBaseUrl || apiBaseUrl.includes("example.invalid")) return undefined;
  return path;
}

export const cloudflareEventSink: DomainEventSink = {
  async publish(event: DomainEvent): Promise<void> {
    const endpoint = getDomainEventIngressEndpoint();
    if (!endpoint) return;

    await api.post(endpoint, createDomainEventIngressRequest([event]));
  },
};
