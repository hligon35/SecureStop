import { create } from 'zustand';

import type { Role } from '@/constants/roles';
import { scheduleLocalAlertNotification } from '@/lib/notifications';
import { getJson, setJson } from '@/lib/storage/kv';
import { useIncidentsStore } from '@/store/incidents';

type RecipientGroup = 'parents' | 'school' | 'driver' | 'both';

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
  if (viewerRole === 'admin') return true;
  if (viewerRole === 'parent') return recipients === 'parents';
  if (viewerRole === 'driver') return recipients === 'driver' || recipients === 'school';

  // Fallback: be conservative.
  return false;
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
  sendAdminBroadcast: (params: { title: string; body: string; recipients: RecipientGroup; vehicleId?: string }) => Promise<void>;
};

const PREFS_KEY = 'securestop.notificationPrefs.v1';

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

  // Driver report submission
  driver_report_submitted: {
    title: 'Driver Report Submitted',
    body: 'A driver report was submitted. Review details in notes.',
    severity: 'red',
  },

  // Driver emergency / safety alerts
  medical_emergency_onboard: {
    title: 'Medical Emergency Onboard',
    body: 'Medical emergency reported onboard the vehicle. Emergency response may be required.',
    severity: 'red',
  },
  passenger_injury: {
    title: 'Passenger Injury',
    body: 'Passenger injury reported. Please stand by for updates and instructions.',
    severity: 'red',
  },
  vehicle_accident_collision: {
    title: 'Vehicle Accident / Collision',
    body: 'Accident/collision reported involving the vehicle. Emergency response may be required.',
    severity: 'red',
  },
  bus_disabled_in_roadway: {
    title: 'Bus Disabled in Roadway',
    body: 'Vehicle is disabled in the roadway. Expect delays and possible reroute.',
    severity: 'red',
  },
  fire_smoke_detected: {
    title: 'Fire / Smoke Detected',
    body: 'Fire or smoke detected. Emergency response may be required.',
    severity: 'red',
  },
  active_threat_security_concern: {
    title: 'Active Threat / Security Concern',
    body: 'Active threat or security concern reported. Follow safety protocols immediately.',
    severity: 'red',
  },
  child_left_on_bus_post_trip_check_failed: {
    title: 'Child Left on Bus',
    body: 'Post-trip check failed; a child may have been left on the bus. Immediate action required.',
    severity: 'red',
  },
  evacuation_in_progress: {
    title: 'Evacuation in Progress',
    body: 'Evacuation is in progress. Follow emergency procedures.',
    severity: 'red',
  },
  severe_mechanical_failure_unsafe_to_drive: {
    title: 'Severe Mechanical Failure',
    body: 'Severe mechanical failure reported. Vehicle may be unsafe to drive.',
    severity: 'red',
  },
  lost_child_missing_passenger_at_stop: {
    title: 'Lost Child / Missing Passenger at Stop',
    body: 'A child/passenger is reported missing at a stop. Immediate action required.',
    severity: 'red',
  },
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
  hydrated: false,
  hydrate: async () => {
    const data = await getJson<{ prefs?: NotificationPrefs }>(PREFS_KEY);
    const prefs = data?.prefs;
    if (prefs) {
      set({ prefs, hydrated: true });
    } else {
      set({ hydrated: true });
    }
  },
  setExpoPushToken: (token) => set({ expoPushToken: token }),
  setPrefs: (next) => {
    const merged = { ...get().prefs, ...next };
    set({ prefs: merged });
    setJson(PREFS_KEY, { prefs: merged }).catch(() => {});
  },
  setDriverRecipientSelection: (recipients) => set({ driverRecipientSelection: recipients }),
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

    set({ inbox: [msg, ...get().inbox.filter((m) => m.id !== msg.id)].slice(0, 50) });
  },
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

