import type { DomainEvent } from "@/core/events/contracts";

export type DomainEventIngressRequest = {
  version: 1;
  source: "securestop-client" | "securestop-worker";
  events: DomainEvent[];
};

export type DomainEventProjectionOperation =
  | {
      type: "upsert";
      table: "alert_inbox" | "incident_read_models";
      key: string;
      record: Record<string, unknown>;
    }
  | {
      type: "delete";
      table: "alert_inbox" | "incident_read_models";
      key: string;
    };

export type DomainEventIngressResponse = {
  accepted: number;
  projected: DomainEventProjectionOperation[];
};

export function createDomainEventIngressRequest(
  events: DomainEvent[],
): DomainEventIngressRequest {
  return {
    version: 1,
    source: "securestop-client",
    events,
  };
}
