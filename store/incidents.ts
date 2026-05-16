import { create } from "zustand";

import type { Role } from "@/constants/roles";
import type { AlertSeverity } from "@/core/alerts/types";
import {
    createDomainEvent,
    type IncidentCreatedEvent,
    type IncidentNotedEvent,
    type IncidentResolvedEvent,
} from "@/core/events/contracts";
import type {
    Incident,
    IncidentEvent,
    IncidentStatus,
} from "@/core/incidents/types";
import { publishDomainEvent } from "@/lib/events/bus";
import { localIncidentsRepository } from "@/lib/incidents/localRepository";

function now() {
  return Date.now();
}

type IncidentsState = {
  hydrated: boolean;
  incidents: Incident[];
  hydrate: () => Promise<void>;
  upsertFromAlert: (params: {
    alertId: string;
    title: string;
    body: string;
    severity?: AlertSeverity;
    vehicleId?: string;
    createdAt: number;
    createdByRole: Role;
  }) => void;
  addNote: (id: string, params: { message: string; byRole: Role }) => void;
  resolve: (id: string, params: { message?: string; byRole: Role }) => void;
  clearAll: () => void;
};

function shouldCreateIncident(
  sev: AlertSeverity | undefined,
): sev is AlertSeverity {
  if (!sev) return false;
  return sev === "red" || sev === "orange";
}

export const useIncidentsStore = create<IncidentsState>((set, get) => ({
  hydrated: false,
  incidents: [],
  hydrate: async () => {
    const incidents = await localIncidentsRepository.load();
    set({ incidents, hydrated: true });
  },
  upsertFromAlert: ({
    alertId,
    title,
    body,
    severity,
    vehicleId,
    createdAt,
    createdByRole,
  }) => {
    if (!shouldCreateIncident(severity)) return;

    const existing = get().incidents.find((i) => i.alertId === alertId);
    if (existing) return;

    const id = `inc-${alertId}`;
    const ts = now();

    const created: Incident = {
      id,
      alertId,
      title,
      description: body,
      severity,
      status: "open",
      createdAt: createdAt || ts,
      updatedAt: ts,
      vehicleId,
      createdByRole,
      events: [
        {
          id: `evt-${ts}`,
          at: ts,
          byRole: createdByRole,
          type: "created",
          message: `Incident created from alert (${severity.toUpperCase()}).`,
        },
      ],
    };

    set((s) => {
      const incidents = [created, ...s.incidents].slice(0, 200);
      localIncidentsRepository.save(incidents).catch(() => {});
      return { incidents };
    });

    const event: IncidentCreatedEvent = createDomainEvent("incident.created", {
      incidentId: created.id,
      alertId: created.alertId,
      title: created.title,
      severity: created.severity,
      vehicleId: created.vehicleId,
      createdAt: created.createdAt,
      createdByRole: created.createdByRole,
    });
    publishDomainEvent(event);
  },
  addNote: (id, { message, byRole }) => {
    const ts = now();
    let updated = false;
    set((s) => {
      const incidents = s.incidents.map((i) => {
        if (i.id !== id) return i;
        updated = true;
        const next: Incident = {
          ...i,
          updatedAt: ts,
          events: [
            ...i.events,
            {
              id: `evt-${ts}-${Math.random().toString(16).slice(2)}`,
              at: ts,
              byRole,
              type: "note",
              message,
            },
          ],
        };
        return next;
      });
      localIncidentsRepository.save(incidents).catch(() => {});
      return { incidents };
    });

    if (!updated) return;

    const event: IncidentNotedEvent = createDomainEvent("incident.noted", {
      incidentId: id,
      message,
      byRole,
      notedAt: ts,
    });
    publishDomainEvent(event);
  },
  resolve: (id, { message, byRole }) => {
    const ts = now();
    let resolvedMessage: string | undefined;
    set((s) => {
      const incidents = s.incidents.map((i) => {
        if (i.id !== id) return i;
        if (i.status === "resolved") return i;
        const note = message?.trim() ? message.trim() : "Resolved.";
        resolvedMessage = note;
        const next: Incident = {
          ...i,
          status: "resolved",
          updatedAt: ts,
          events: [
            ...i.events,
            {
              id: `evt-${ts}-${Math.random().toString(16).slice(2)}`,
              at: ts,
              byRole,
              type: "resolved",
              message: note,
            },
          ],
        };
        return next;
      });
      localIncidentsRepository.save(incidents).catch(() => {});
      return { incidents };
    });

    if (!resolvedMessage) return;

    const event: IncidentResolvedEvent = createDomainEvent(
      "incident.resolved",
      {
        incidentId: id,
        message: resolvedMessage,
        byRole,
        resolvedAt: ts,
      },
    );
    publishDomainEvent(event);
  },
  clearAll: () => {
    set({ incidents: [] });
    localIncidentsRepository.clear().catch(() => {});
  },
}));

export type { Incident, IncidentEvent, IncidentStatus };

