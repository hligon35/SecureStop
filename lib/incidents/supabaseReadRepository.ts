import type { Role } from "@/constants/roles";
import type { IncidentReadRepository } from "@/core/incidents/repository";
import type {
    Incident,
    IncidentEvent,
    IncidentStatus,
} from "@/core/incidents/types";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { normalizeTenantId } from "@/lib/tenancy/context";

type IncidentRow = {
  id: string;
  tenant_id: string;
  alert_id: string | null;
  title: string;
  description: string;
  severity: Incident["severity"];
  status: IncidentStatus | string;
  created_at: number;
  updated_at: number;
  vehicle_id: string | null;
  created_by_role: Role | string;
  events: IncidentEvent[] | null;
};

function normalizeRole(value: unknown): Role {
  if (value === "admin" || value === "driver" || value === "parent") {
    return value;
  }

  return "admin";
}

function normalizeStatus(value: unknown): IncidentStatus {
  return value === "resolved" ? "resolved" : "open";
}

function normalizeSeverity(value: unknown): Incident["severity"] {
  if (
    value === "green" ||
    value === "yellow" ||
    value === "orange" ||
    value === "red"
  ) {
    return value;
  }

  return "yellow";
}

function normalizeEvents(value: unknown): IncidentEvent[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((event) => {
      if (!event || typeof event !== "object") return undefined;
      const next = event as Partial<IncidentEvent>;
      if (!next.id || typeof next.message !== "string") return undefined;
      if (
        next.type !== "created" &&
        next.type !== "note" &&
        next.type !== "resolved"
      ) {
        return undefined;
      }

      return {
        id: next.id,
        at: typeof next.at === "number" ? next.at : Date.now(),
        byRole: normalizeRole(next.byRole),
        type: next.type,
        message: next.message,
      } satisfies IncidentEvent;
    })
    .filter((event): event is IncidentEvent => !!event);
}

function toIncident(row: IncidentRow): Incident | undefined {
  const tenantId = normalizeTenantId(row.tenant_id);
  if (!tenantId || !row.id || !row.title) return undefined;

  return {
    id: row.id,
    alertId: row.alert_id ?? undefined,
    title: row.title,
    description: row.description,
    severity: normalizeSeverity(row.severity),
    status: normalizeStatus(row.status),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    vehicleId: row.vehicle_id ?? undefined,
    createdByRole: normalizeRole(row.created_by_role),
    events: normalizeEvents(row.events),
  };
}

export const supabaseIncidentReadRepository: IncidentReadRepository = {
  async loadRecent(params: {
    tenantId: string;
    limit?: number;
  }): Promise<Incident[]> {
    const tenantId = normalizeTenantId(params.tenantId);
    if (!tenantId || !isSupabaseConfigured()) return [];

    const client = getSupabaseClient();
    const { data, error } = await client
      .from("incident_read_models")
      .select(
        "id, tenant_id, alert_id, title, description, severity, status, created_at, updated_at, vehicle_id, created_by_role, events",
      )
      .eq("tenant_id", tenantId)
      .order("updated_at", { ascending: false })
      .limit(params.limit ?? 200);

    if (error) throw error;

    return (Array.isArray(data) ? (data as IncidentRow[]) : [])
      .map(toIncident)
      .filter((incident): incident is Incident => !!incident);
  },
};
