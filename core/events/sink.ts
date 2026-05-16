import type { DomainEvent } from "@/core/events/contracts";

export interface DomainEventSink {
  publish(event: DomainEvent): Promise<void>;
}
