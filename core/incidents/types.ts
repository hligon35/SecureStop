import type { Role } from "@/constants/roles";
import type { AlertSeverity } from "@/core/alerts/types";

export type IncidentStatus = "open" | "resolved";

export type IncidentEvent = {
  id: string;
  at: number;
  byRole: Role;
  type: "created" | "note" | "resolved";
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
