import type { Role } from "@/constants/roles";
import type { AlertInboxReadRepository } from "@/core/alerts/repository";
import type {
    AlertMessage,
    AlertSeverity,
    RecipientGroup,
} from "@/core/alerts/types";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { normalizeTenantId } from "@/lib/tenancy/context";

type AlertInboxRow = {
  id: string;
  tenant_id: string;
  title: string;
  body: string;
  recipients: RecipientGroup | string;
  severity: AlertSeverity | null;
  template_id: string | null;
  vehicle_id: string | null;
  created_at: number;
  created_by_role: Role | string;
};

function normalizeRecipients(value: unknown): RecipientGroup {
  if (
    value === "parents" ||
    value === "school" ||
    value === "driver" ||
    value === "both"
  ) {
    return value;
  }

  return "both";
}

function normalizeSeverity(value: unknown): AlertSeverity | undefined {
  if (
    value === "green" ||
    value === "yellow" ||
    value === "orange" ||
    value === "red"
  ) {
    return value;
  }

  return undefined;
}

function normalizeRole(value: unknown): Role {
  if (value === "admin" || value === "driver" || value === "parent") {
    return value;
  }

  return "admin";
}

function toAlertMessage(row: AlertInboxRow): AlertMessage | undefined {
  const tenantId = normalizeTenantId(row.tenant_id);
  if (!tenantId || !row.id || !row.title) return undefined;

  return {
    id: row.id,
    title: row.title,
    body: row.body,
    recipients: normalizeRecipients(row.recipients),
    severity: normalizeSeverity(row.severity),
    templateId: row.template_id ?? undefined,
    vehicleId: row.vehicle_id ?? undefined,
    createdAt: row.created_at,
    createdByRole: normalizeRole(row.created_by_role),
  };
}

export const supabaseAlertInboxReadRepository: AlertInboxReadRepository = {
  async loadRecent(params: {
    tenantId: string;
    limit?: number;
  }): Promise<AlertMessage[]> {
    const tenantId = normalizeTenantId(params.tenantId);
    if (!tenantId || !isSupabaseConfigured()) return [];

    const client = getSupabaseClient();
    const { data, error } = await client
      .from("alert_inbox")
      .select(
        "id, tenant_id, title, body, recipients, severity, template_id, vehicle_id, created_at, created_by_role",
      )
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(params.limit ?? 50);

    if (error) throw error;

    return (Array.isArray(data) ? (data as AlertInboxRow[]) : [])
      .map(toAlertMessage)
      .filter((message): message is AlertMessage => !!message);
  },
};
