import { create } from "zustand";

import type { Role } from "@/constants/roles";
import { createAlertMessage } from "@/core/alerts/catalog";
import type {
    AlertInboxRepository,
    AlertPreferencesRepository,
} from "@/core/alerts/repository";
import type {
    AlertMessage,
    AlertSeverity,
    NotificationPrefs,
    RecipientGroup,
} from "@/core/alerts/types";
import {
    createDomainEvent,
    type AlertReceivedEvent,
    type AlertRemovedEvent,
} from "@/core/events/contracts";
import { localAlertInboxRepository } from "@/lib/alerts/localInboxRepository";
import { localAlertPreferencesRepository } from "@/lib/alerts/localPreferencesRepository";
import { supabaseAlertInboxReadRepository } from "@/lib/alerts/supabaseInboxReadRepository";
import { publishDomainEvent } from "@/lib/events/bus";
import { scheduleLocalAlertNotification } from "@/lib/notifications";
import { normalizeTenantId } from "@/lib/tenancy/context";
import { loadPersistedViewerContext } from "@/lib/tenancy/persistedViewerContext";
import { useIncidentsStore } from "@/store/incidents";
import { useTenantMembershipStore } from "@/store/tenantMembership";

const alertPreferencesRepository: AlertPreferencesRepository =
  localAlertPreferencesRepository;
const alertInboxRepository: AlertInboxRepository = localAlertInboxRepository;

function persistInbox(inbox: AlertMessage[]) {
  alertInboxRepository.save(inbox).catch(() => {});
}

function mergeInboxMessages(
  localInbox: AlertMessage[],
  remoteInbox: AlertMessage[],
): AlertMessage[] {
  const byId = new Map<string, AlertMessage>();

  for (const message of [...localInbox, ...remoteInbox]) {
    const current = byId.get(message.id);
    if (!current || message.createdAt >= current.createdAt) {
      byId.set(message.id, message);
    }
  }

  return [...byId.values()]
    .sort((left, right) => right.createdAt - left.createdAt)
    .slice(0, 50);
}

function getRuntimeTenantId() {
  return normalizeTenantId(useTenantMembershipStore.getState().activeTenantId);
}

function recipientsIncludeViewer(params: {
  recipients: RecipientGroup;
  viewerRole: Role;
}): boolean {
  const { recipients, viewerRole } = params;

  if (recipients === "both") return true;
  if (viewerRole === "admin") return true;
  if (viewerRole === "parent") return recipients === "parents";
  if (viewerRole === "driver")
    return recipients === "driver" || recipients === "school";

  // Fallback: be conservative.
  return false;
}

function prefsAllowMessage(params: {
  msg: AlertMessage;
  prefs: NotificationPrefs;
}): boolean {
  const { msg, prefs } = params;
  if (!prefs.enabled) return false;
  if (msg.createdByRole === "driver") return prefs.receiveDriverAlerts;
  if (msg.createdByRole === "admin") return prefs.receiveAdminBroadcasts;
  return true;
}

export function alertVisibleToViewer(params: {
  msg: AlertMessage;
  viewerRole: Role;
  prefs: NotificationPrefs;
}): boolean {
  const { msg, viewerRole, prefs } = params;
  return (
    recipientsIncludeViewer({ recipients: msg.recipients, viewerRole }) &&
    prefsAllowMessage({ msg, prefs })
  );
}

type NotificationState = {
  expoPushToken?: string;
  prefs: NotificationPrefs;
  inbox: AlertMessage[];
  driverRecipientSelection: RecipientGroup;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setExpoPushToken: (token?: string) => void;
  setPrefs: (next: Partial<NotificationPrefs>) => void;
  setDriverRecipientSelection: (recipients: RecipientGroup) => void;
  receiveAlert: (msg: AlertMessage) => void;
  removeAlertById: (id: string) => void;
  sendDriverAlert: (params: {
    templateId: string;
    recipients: RecipientGroup;
    notes?: string[];
    vehicleId?: string;
  }) => Promise<void>;
  sendAdminBroadcast: (params: {
    title: string;
    body: string;
    recipients: RecipientGroup;
    vehicleId?: string;
  }) => Promise<void>;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  expoPushToken: undefined,
  prefs: {
    enabled: true,
    receiveDriverAlerts: true,
    receiveAdminBroadcasts: true,
  },
  inbox: [],
  driverRecipientSelection: "parents",
  hydrated: false,
  hydrate: async () => {
    const [prefs, localInbox, viewerContext] = await Promise.all([
      alertPreferencesRepository.load(),
      alertInboxRepository.load(),
      loadPersistedViewerContext(),
    ]);

    const remoteInbox = viewerContext?.tenantId
      ? await supabaseAlertInboxReadRepository
          .loadRecent({ tenantId: viewerContext.tenantId, limit: 50 })
          .catch(() => [])
      : [];
    const inbox = mergeInboxMessages(localInbox, remoteInbox);
    if (JSON.stringify(inbox) !== JSON.stringify(localInbox)) {
      persistInbox(inbox);
    }

    if (prefs) {
      set({ prefs, inbox, hydrated: true });
    } else {
      set({ inbox, hydrated: true });
    }
  },
  setExpoPushToken: (token) => set({ expoPushToken: token }),
  setPrefs: (next) => {
    const merged = { ...get().prefs, ...next };
    set({ prefs: merged });
    alertPreferencesRepository.save(merged).catch(() => {});
  },
  setDriverRecipientSelection: (recipients) =>
    set({ driverRecipientSelection: recipients }),
  receiveAlert: (msg) => {
    // Create an incident record for high-severity alerts.
    useIncidentsStore.getState().upsertFromAlert({
      alertId: msg.id,
      title: msg.title,
      body: msg.body,
      severity: msg.severity,
      vehicleId: msg.vehicleId,
      createdAt: msg.createdAt,
      createdByRole: msg.createdByRole,
    });

    const inbox = [msg, ...get().inbox.filter((m) => m.id !== msg.id)].slice(
      0,
      50,
    );
    set({ inbox });
    persistInbox(inbox);

    const event: AlertReceivedEvent = createDomainEvent("alert.received", {
      tenantId: getRuntimeTenantId() || undefined,
      alertId: msg.id,
      title: msg.title,
      body: msg.body,
      severity: msg.severity,
      recipients: msg.recipients,
      vehicleId: msg.vehicleId,
      createdAt: msg.createdAt,
      createdByRole: msg.createdByRole,
      templateId: msg.templateId,
    });
    publishDomainEvent(event);
  },
  removeAlertById: (id) => {
    const existingAlert = get().inbox.find((m) => m.id === id);
    if (!existingAlert) return;

    const inbox = get().inbox.filter((m) => m.id !== id);
    set({ inbox });
    if (inbox.length === 0) {
      alertInboxRepository.clear().catch(() => {});
    } else {
      persistInbox(inbox);
    }

    const event: AlertRemovedEvent = createDomainEvent("alert.removed", {
      tenantId: getRuntimeTenantId() || undefined,
      alertId: id,
    });
    publishDomainEvent(event);
  },
  sendDriverAlert: async ({ templateId, recipients, notes, vehicleId }) => {
    const msg: AlertMessage = createAlertMessage({
      templateId,
      recipients,
      notes,
      vehicleId,
      createdByRole: "driver",
    });

    // Placeholder: local notification so the flow works without a backend.
    await scheduleLocalAlertNotification({ title: msg.title, body: msg.body });

    // Placeholder: also add to in-app inbox.
    get().receiveAlert(msg);
  },
  sendAdminBroadcast: async ({ title, body, recipients, vehicleId }) => {
    const msg: AlertMessage = {
      id: `broadcast-${Date.now()}`,
      title,
      body,
      recipients,
      severity: "orange",
      templateId: "admin_broadcast",
      vehicleId,
      createdAt: Date.now(),
      createdByRole: "admin",
    };

    await scheduleLocalAlertNotification({ title: msg.title, body: msg.body });
    get().receiveAlert(msg);
  },
}));

export type { AlertMessage, AlertSeverity, NotificationPrefs, RecipientGroup };

