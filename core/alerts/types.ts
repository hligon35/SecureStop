import type { Role } from "@/constants/roles";

export type RecipientGroup = "parents" | "school" | "driver" | "both";

export type AlertSeverity = "green" | "yellow" | "orange" | "red";

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

export type NotificationPrefs = {
  enabled: boolean;
  receiveDriverAlerts: boolean;
  receiveAdminBroadcasts: boolean;
};

export type AlertTemplate = {
  title: string;
  body: string;
  severity: AlertSeverity;
};
