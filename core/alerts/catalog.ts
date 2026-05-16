import type {
    AlertMessage,
    AlertSeverity,
    AlertTemplate,
    RecipientGroup,
} from "@/core/alerts/types";

export const alertTemplates: Record<string, AlertTemplate> = {
  departed_depot: {
    title: "Departed Depot",
    body: "The vehicle has departed the depot.",
    severity: "green",
  },
  departed_school: {
    title: "Departed School",
    body: "The vehicle has departed the school/terminal.",
    severity: "green",
  },
  route_started: {
    title: "Route Started",
    body: "The route has started.",
    severity: "green",
  },
  minor_delay_traffic: {
    title: "Minor Delay",
    body: "Minor delay due to traffic.",
    severity: "yellow",
  },
  running_early: {
    title: "Running Early",
    body: "The vehicle is running early.",
    severity: "yellow",
  },
  weather_delay: {
    title: "Weather Delay",
    body: "Delay due to weather conditions.",
    severity: "yellow",
  },
  mechanical_issue: {
    title: "Mechanical Issue",
    body: "Mechanical issue reported. Updates to follow.",
    severity: "orange",
  },
  route_change: {
    title: "Route Change",
    body: "Route has changed. Please check updates.",
    severity: "orange",
  },
  substitute_bus: {
    title: "Substitute Vehicle",
    body: "A substitute vehicle is in service.",
    severity: "orange",
  },
  emergency: {
    title: "Emergency",
    body: "Emergency reported. Follow instructions.",
    severity: "red",
  },
  unsafe_situation: {
    title: "Unsafe Situation",
    body: "Unsafe situation reported. Updates to follow.",
    severity: "red",
  },
  contact_admin: {
    title: "Contact Admin",
    body: "Please contact administration for details.",
    severity: "red",
  },
  driver_report_submitted: {
    title: "Driver Report Submitted",
    body: "A driver report was submitted. Review details in notes.",
    severity: "red",
  },
  medical_emergency_onboard: {
    title: "Medical Emergency Onboard",
    body: "Medical emergency reported onboard the vehicle. Emergency response may be required.",
    severity: "red",
  },
  passenger_injury: {
    title: "Passenger Injury",
    body: "Passenger injury reported. Please stand by for updates and instructions.",
    severity: "red",
  },
  vehicle_accident_collision: {
    title: "Vehicle Accident / Collision",
    body: "Accident/collision reported involving the vehicle. Emergency response may be required.",
    severity: "red",
  },
  bus_disabled_in_roadway: {
    title: "Bus Disabled in Roadway",
    body: "Vehicle is disabled in the roadway. Expect delays and possible reroute.",
    severity: "red",
  },
  fire_smoke_detected: {
    title: "Fire / Smoke Detected",
    body: "Fire or smoke detected. Emergency response may be required.",
    severity: "red",
  },
  active_threat_security_concern: {
    title: "Active Threat / Security Concern",
    body: "Active threat or security concern reported. Follow safety protocols immediately.",
    severity: "red",
  },
  child_left_on_bus_post_trip_check_failed: {
    title: "Child Left on Bus",
    body: "Post-trip check failed; a child may have been left on the bus. Immediate action required.",
    severity: "red",
  },
  evacuation_in_progress: {
    title: "Evacuation in Progress",
    body: "Evacuation is in progress. Follow emergency procedures.",
    severity: "red",
  },
  severe_mechanical_failure_unsafe_to_drive: {
    title: "Severe Mechanical Failure",
    body: "Severe mechanical failure reported. Vehicle may be unsafe to drive.",
    severity: "red",
  },
  lost_child_missing_passenger_at_stop: {
    title: "Lost Child / Missing Passenger at Stop",
    body: "A child/passenger is reported missing at a stop. Immediate action required.",
    severity: "red",
  },
};

export function resolveAlertTemplate(templateId: string): AlertTemplate {
  return (
    alertTemplates[templateId] ?? {
      title: "Driver Alert",
      body: "A driver alert was sent.",
      severity: "yellow" as AlertSeverity,
    }
  );
}

export function createAlertMessage(params: {
  templateId: string;
  recipients: RecipientGroup;
  createdByRole: AlertMessage["createdByRole"];
  vehicleId?: string;
  notes?: string[];
  createdAt?: number;
}): AlertMessage {
  const template = resolveAlertTemplate(params.templateId);
  const noteSuffix =
    params.notes && params.notes.length > 0
      ? `\n\nNotes: ${params.notes.join(", ")}`
      : "";
  const createdAt = params.createdAt ?? Date.now();

  return {
    id: `alert-${createdAt}`,
    title: template.title,
    body: `${template.body}${noteSuffix}`,
    recipients: params.recipients,
    severity: template.severity,
    templateId: params.templateId,
    vehicleId: params.vehicleId,
    createdAt,
    createdByRole: params.createdByRole,
  };
}
