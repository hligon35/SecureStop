import { create } from 'zustand';

import type { Role } from '@/constants/roles';
import { getJson, setJson } from '@/lib/storage/kv';
import type { AlertSeverity } from '@/store/notifications';

export type IncidentStatus = 'open' | 'resolved';

export type IncidentEvent = {
  id: string;
  at: number;
  byRole: Role;
  type: 'created' | 'note' | 'resolved';
  message: string;
};

export type Incident = {
  id: string;
  alertId?: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: IncidentStatus;
  createdAt: number;
  updatedAt: number;
  vehicleId?: string;
  createdByRole: Role;
  events: IncidentEvent[];
};

const KEY = 'securestop.incidents.v1';

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

function shouldCreateIncident(sev: AlertSeverity | undefined): sev is AlertSeverity {
  if (!sev) return false;
  return sev === 'red' || sev === 'orange';
}

function persist(incidents: Incident[]) {
  setJson(KEY, { incidents }).catch(() => {});
}

export const useIncidentsStore = create<IncidentsState>((set, get) => ({
  hydrated: false,
  incidents: [],
  hydrate: async () => {
    const data = await getJson<{ incidents?: Incident[] }>(KEY);
    const incidents = Array.isArray(data?.incidents) ? data!.incidents! : [];
    set({ incidents, hydrated: true });
  },
  upsertFromAlert: ({ alertId, title, body, severity, vehicleId, createdAt, createdByRole }) => {
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
      status: 'open',
      createdAt: createdAt || ts,
      updatedAt: ts,
      vehicleId,
      createdByRole,
      events: [
        {
          id: `evt-${ts}`,
          at: ts,
          byRole: createdByRole,
          type: 'created',
          message: `Incident created from alert (${severity.toUpperCase()}).`,
        },
      ],
    };

    set((s) => {
      const incidents = [created, ...s.incidents].slice(0, 200);
      persist(incidents);
      return { incidents };
    });
  },
  addNote: (id, { message, byRole }) => {
    const ts = now();
    set((s) => {
      const incidents = s.incidents.map((i) => {
        if (i.id !== id) return i;
        const next: Incident = {
          ...i,
          updatedAt: ts,
          events: [...i.events, { id: `evt-${ts}-${Math.random().toString(16).slice(2)}`, at: ts, byRole, type: 'note', message }],
        };
        return next;
      });
      persist(incidents);
      return { incidents };
    });
  },
  resolve: (id, { message, byRole }) => {
    const ts = now();
    set((s) => {
      const incidents = s.incidents.map((i) => {
        if (i.id !== id) return i;
        if (i.status === 'resolved') return i;
        const note = message?.trim() ? message.trim() : 'Resolved.';
        const next: Incident = {
          ...i,
          status: 'resolved',
          updatedAt: ts,
          events: [...i.events, { id: `evt-${ts}-${Math.random().toString(16).slice(2)}`, at: ts, byRole, type: 'resolved', message: note }],
        };
        return next;
      });
      persist(incidents);
      return { incidents };
    });
  },
  clearAll: () => {
    set({ incidents: [] });
    setJson(KEY, undefined).catch(() => {});
  },
}));
