import type { DomainEvent } from "@/core/events/contracts";
import type { DomainEventSink } from "@/core/events/sink";
import { api } from "@/lib/api/client";
import { getConfig } from "@/lib/config";

export const cloudflareEventSink: DomainEventSink = {
  async publish(event: DomainEvent): Promise<void> {
    const apiBaseUrl = getConfig().apiBaseUrl.trim();
    if (!apiBaseUrl || apiBaseUrl.includes("example.invalid")) return;

    await api.post("/events/domain", event);
  },
};
