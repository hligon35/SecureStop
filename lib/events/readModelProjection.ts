import type { DomainEvent } from "@/core/events/contracts";
import type { DomainEventProjectionOperation } from "@/core/events/ingress";
import type { IncidentEvent, IncidentStatus } from "@/core/incidents/types";

export type IncidentReadModelRecord = {
  id: string;
  tenant_id: string;
  alert_id: string | null;
  title: string;
  description: string;
  severity: "green" | "yellow" | "orange" | "red";
  status: IncidentStatus;
  created_at: number;
  updated_at: number;
  vehicle_id: string | null;
  created_by_role: "parent" | "driver" | "admin";
  events: IncidentEvent[];
};

function createIncidentEventEntry(params: {
  id: string;
  at: number;
  byRole: IncidentEvent["byRole"];
  type: IncidentEvent["type"];
  message: string;
}): IncidentEvent {
  return {
    id: params.id,
    at: params.at,
    byRole: params.byRole,
    type: params.type,
    message: params.message,
  };
}

function projectAlertReceived(
  event: Extract<DomainEvent, { name: "alert.received" }>,
): DomainEventProjectionOperation[] {
  const tenantId = event.payload.tenantId?.trim();
  if (!tenantId) return [];

  return [
    {
      type: "upsert",
      table: "alert_inbox",
      key: event.payload.alertId,
      record: {
        id: event.payload.alertId,
        tenant_id: tenantId,
        title: event.payload.title,
        body: event.payload.body,
        recipients: event.payload.recipients,
        severity: event.payload.severity ?? null,
        template_id: event.payload.templateId ?? null,
        vehicle_id: event.payload.vehicleId ?? null,
        created_at: event.payload.createdAt,
        created_by_role: event.payload.createdByRole,
      },
    },
  ];
}

function projectAlertRemoved(
  event: Extract<DomainEvent, { name: "alert.removed" }>,
): DomainEventProjectionOperation[] {
  return [
    {
      type: "delete",
      table: "alert_inbox",
      key: event.payload.alertId,
    },
  ];
}

function projectIncidentCreated(
  event: Extract<DomainEvent, { name: "incident.created" }>,
): DomainEventProjectionOperation[] {
  const tenantId = event.payload.tenantId?.trim();
  if (!tenantId) return [];

  return [
    {
      type: "upsert",
      table: "incident_read_models",
      key: event.payload.incidentId,
      record: {
        id: event.payload.incidentId,
        tenant_id: tenantId,
        alert_id: event.payload.alertId ?? null,
        title: event.payload.title,
        description: event.payload.description,
        severity: event.payload.severity,
        status: "open",
        created_at: event.payload.createdAt,
        updated_at: event.occurredAt,
        vehicle_id: event.payload.vehicleId ?? null,
        created_by_role: event.payload.createdByRole,
        events: [
          createIncidentEventEntry({
            id: `${event.id}-created`,
            at: event.occurredAt,
            byRole: event.payload.createdByRole,
            type: "created",
            message: `Incident created from alert (${event.payload.severity.toUpperCase()}).`,
          }),
        ],
      },
    },
  ];
}

function projectIncidentNoted(
  event: Extract<DomainEvent, { name: "incident.noted" }>,
  current: IncidentReadModelRecord | null | undefined,
): DomainEventProjectionOperation[] {
  const tenantId = event.payload.tenantId?.trim() ?? current?.tenant_id?.trim();
  if (!tenantId || !current) return [];

  return [
    {
      type: "upsert",
      table: "incident_read_models",
      key: event.payload.incidentId,
      record: {
        ...current,
        tenant_id: tenantId,
        updated_at: event.payload.notedAt,
        events: [
          ...current.events,
          createIncidentEventEntry({
            id: `${event.id}-note`,
            at: event.payload.notedAt,
            byRole: event.payload.byRole,
            type: "note",
            message: event.payload.message,
          }),
        ],
      },
    },
  ];
}

function projectIncidentResolved(
  event: Extract<DomainEvent, { name: "incident.resolved" }>,
  current: IncidentReadModelRecord | null | undefined,
): DomainEventProjectionOperation[] {
  const tenantId = event.payload.tenantId?.trim() ?? current?.tenant_id?.trim();
  if (!tenantId || !current) return [];

  return [
    {
      type: "upsert",
      table: "incident_read_models",
      key: event.payload.incidentId,
      record: {
        ...current,
        tenant_id: tenantId,
        status: "resolved",
        updated_at: event.payload.resolvedAt,
        events: [
          ...current.events,
          createIncidentEventEntry({
            id: `${event.id}-resolved`,
            at: event.payload.resolvedAt,
            byRole: event.payload.byRole,
            type: "resolved",
            message: event.payload.message,
          }),
        ],
      },
    },
  ];
}

export function projectDomainEventToReadModels(
  event: DomainEvent,
  options?: {
    incidentReadModel?: IncidentReadModelRecord | null;
  },
): DomainEventProjectionOperation[] {
  switch (event.name) {
    case "alert.received":
      return projectAlertReceived(event);
    case "alert.removed":
      return projectAlertRemoved(event);
    case "incident.created":
      return projectIncidentCreated(event);
    case "incident.noted":
      return projectIncidentNoted(event, options?.incidentReadModel);
    case "incident.resolved":
      return projectIncidentResolved(event, options?.incidentReadModel);
    default:
      return [];
  }
}
