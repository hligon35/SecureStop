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
import { supabaseIncidentReadRepository } from "@/lib/incidents/supabaseReadRepository";
import { normalizeTenantId } from "@/lib/tenancy/context";
import { loadPersistedViewerContext } from "@/lib/tenancy/persistedViewerContext";
import { useTenantMembershipStore } from "@/store/tenantMembership";

function now() {
  return Date.now();
}

function getRuntimeTenantId() {
  return normalizeTenantId(useTenantMembershipStore.getState().activeTenantId);
}

function mergeIncidents(
  localIncidents: Incident[],
  remoteIncidents: Incident[],
) {
  const byId = new Map<string, Incident>();

  for (const incident of [...localIncidents, ...remoteIncidents]) {
    const current = byId.get(incident.id);
    if (!current || incident.updatedAt >= current.updatedAt) {
      byId.set(incident.id, incident);
    }
  }

  return [...byId.values()]
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .slice(0, 200);
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
    const [localIncidents, viewerContext] = await Promise.all([
      localIncidentsRepository.load(),
      loadPersistedViewerContext(),
    ]);
    const remoteIncidents = viewerContext?.tenantId
      ? await supabaseIncidentReadRepository
          .loadRecent({ tenantId: viewerContext.tenantId, limit: 200 })
          .catch(() => [])
      : [];
    const incidents = mergeIncidents(localIncidents, remoteIncidents);
    if (JSON.stringify(incidents) !== JSON.stringify(localIncidents)) {
      localIncidentsRepository.save(incidents).catch(() => {});
    }
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
      tenantId: getRuntimeTenantId() || undefined,
      incidentId: created.id,
      alertId: created.alertId,
      title: created.title,
      description: created.description,
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
      tenantId: getRuntimeTenantId() || undefined,
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
        tenantId: getRuntimeTenantId() || undefined,
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

