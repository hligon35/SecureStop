import { create } from 'zustand';

import type { Role } from '@/constants/roles';
import { scheduleLocalAlertNotification } from '@/lib/notifications';

type RecipientGroup = 'parents' | 'school' | 'both';

export type AlertSeverity = 'green' | 'yellow' | 'orange' | 'red';

export type AlertMessage = {
  id: string;
  title: string;
  body: string;
  recipients: RecipientGroup;
  severity?: AlertSeverity;
  templateId?: string;
  vehicleId?: string;
  createdAt: number;
  createdByRole: Role;
};

type NotificationPrefs = {
  enabled: boolean;
  receiveDriverAlerts: boolean;
  receiveAdminBroadcasts: boolean;
};

function recipientsIncludeViewer(params: { recipients: RecipientGroup; viewerRole: Role }): boolean {
  const { recipients, viewerRole } = params;

  if (recipients === 'both') return true;
  if (viewerRole === 'admin') return recipients === 'school';
  if (viewerRole === 'parent') return recipients === 'parents';

  // Driver screens are operational; show all in-app alerts by default.
  return true;
}

function prefsAllowMessage(params: { msg: AlertMessage; prefs: NotificationPrefs }): boolean {
  const { msg, prefs } = params;
  if (!prefs.enabled) return false;
  if (msg.createdByRole === 'driver') return prefs.receiveDriverAlerts;
  if (msg.createdByRole === 'admin') return prefs.receiveAdminBroadcasts;
  return true;
}

export function alertVisibleToViewer(params: {
  msg: AlertMessage;
  viewerRole: Role;
  prefs: NotificationPrefs;
}): boolean {
  const { msg, viewerRole, prefs } = params;
  return recipientsIncludeViewer({ recipients: msg.recipients, viewerRole }) && prefsAllowMessage({ msg, prefs });
}

type NotificationState = {
  expoPushToken?: string;
  prefs: NotificationPrefs;
  inbox: AlertMessage[];
  driverRecipientSelection: RecipientGroup;
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
  sendAdminBroadcast: (params: { title: string; body: string; recipients: RecipientGroup; vehicleId?: string }) => Promise<void>;
};

const alertTemplates: Record<string, { title: string; body: string; severity: AlertSeverity }> = {
  // Green
  departed_depot: { title: 'Departed Depot', body: 'The vehicle has departed the depot.', severity: 'green' },
  departed_school: { title: 'Departed School', body: 'The vehicle has departed the school/terminal.', severity: 'green' },
  route_started: { title: 'Route Started', body: 'The route has started.', severity: 'green' },

  // Yellow
  minor_delay_traffic: { title: 'Minor Delay', body: 'Minor delay due to traffic.', severity: 'yellow' },
  running_early: { title: 'Running Early', body: 'The vehicle is running early.', severity: 'yellow' },
  weather_delay: { title: 'Weather Delay', body: 'Delay due to weather conditions.', severity: 'yellow' },

  // Orange
  mechanical_issue: { title: 'Mechanical Issue', body: 'Mechanical issue reported. Updates to follow.', severity: 'orange' },
  route_change: { title: 'Route Change', body: 'Route has changed. Please check updates.', severity: 'orange' },
  substitute_bus: { title: 'Substitute Vehicle', body: 'A substitute vehicle is in service.', severity: 'orange' },

  // Red
  emergency: { title: 'Emergency', body: 'Emergency reported. Follow instructions.', severity: 'red' },
  unsafe_situation: { title: 'Unsafe Situation', body: 'Unsafe situation reported. Updates to follow.', severity: 'red' },
  contact_admin: { title: 'Contact Admin', body: 'Please contact administration for details.', severity: 'red' },
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  expoPushToken: undefined,
  prefs: {
    enabled: true,
    receiveDriverAlerts: true,
    receiveAdminBroadcasts: true,
  },
  inbox: [],
  driverRecipientSelection: 'parents',
  setExpoPushToken: (token) => set({ expoPushToken: token }),
  setPrefs: (next) => set({ prefs: { ...get().prefs, ...next } }),
  setDriverRecipientSelection: (recipients) => set({ driverRecipientSelection: recipients }),
  receiveAlert: (msg) => set({ inbox: [msg, ...get().inbox.filter((m) => m.id !== msg.id)].slice(0, 50) }),
  removeAlertById: (id) => set({ inbox: get().inbox.filter((m) => m.id !== id) }),
  sendDriverAlert: async ({ templateId, recipients, notes, vehicleId }) => {
    const template = alertTemplates[templateId] ?? {
      title: 'Driver Alert',
      body: 'A driver alert was sent.',
      severity: 'yellow' as AlertSeverity,
    };

    const noteSuffix = notes && notes.length > 0 ? `\n\nNotes: ${notes.join(', ')}` : '';

    const msg: AlertMessage = {
      id: `alert-${Date.now()}`,
      title: template.title,
      body: `${template.body}${noteSuffix}`,
      recipients,
      severity: template.severity,
      templateId,
      vehicleId,
      createdAt: Date.now(),
      createdByRole: 'driver',
    };

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
      severity: 'orange',
      templateId: 'admin_broadcast',
      vehicleId,
      createdAt: Date.now(),
      createdByRole: 'admin',
    };

    await scheduleLocalAlertNotification({ title: msg.title, body: msg.body });
    get().receiveAlert(msg);
  },
}));

export type { NotificationPrefs, RecipientGroup };

