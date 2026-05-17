import type { Role } from "@/constants/roles";

export type DomainAlertSeverity = "green" | "yellow" | "orange" | "red";

export type DomainEventName =
  | "alert.received"
  | "alert.removed"
  | "incident.created"
  | "incident.noted"
  | "incident.resolved";

export const DOMAIN_EVENT_NAMES: DomainEventName[] = [
  "alert.received",
  "alert.removed",
  "incident.created",
  "incident.noted",
  "incident.resolved",
];

type DomainEventBase<TName extends DomainEventName, TPayload> = {
  id: string;
  name: TName;
  occurredAt: number;
  payload: TPayload;
};

export type AlertReceivedEvent = DomainEventBase<
  "alert.received",
  {
    tenantId?: string;
    alertId: string;
    title: string;
    body: string;
    severity?: DomainAlertSeverity;
    recipients: "parents" | "school" | "driver" | "both";
    vehicleId?: string;
    createdAt: number;
    createdByRole: Role;
    templateId?: string;
  }
>;

export type AlertRemovedEvent = DomainEventBase<
  "alert.removed",
  {
    tenantId?: string;
    alertId: string;
  }
>;

export type IncidentCreatedEvent = DomainEventBase<
  "incident.created",
  {
    tenantId?: string;
    incidentId: string;
    alertId?: string;
    title: string;
    description: string;
    severity: DomainAlertSeverity;
    vehicleId?: string;
    createdAt: number;
    createdByRole: Role;
  }
>;

export type IncidentNotedEvent = DomainEventBase<
  "incident.noted",
  {
    tenantId?: string;
    incidentId: string;
    message: string;
    byRole: Role;
    notedAt: number;
  }
>;

export type IncidentResolvedEvent = DomainEventBase<
  "incident.resolved",
  {
    tenantId?: string;
    incidentId: string;
    message: string;
    byRole: Role;
    resolvedAt: number;
  }
>;

export type DomainEvent =
  | AlertReceivedEvent
  | AlertRemovedEvent
  | IncidentCreatedEvent
  | IncidentNotedEvent
  | IncidentResolvedEvent;

export function createDomainEvent<TEvent extends DomainEvent>(
  name: TEvent["name"],
  payload: TEvent["payload"],
): TEvent {
  return {
    id: `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    occurredAt: Date.now(),
    payload,
  } as TEvent;
}
