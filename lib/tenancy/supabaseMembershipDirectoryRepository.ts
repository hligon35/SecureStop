import type { TenantMembershipDirectoryRepository } from "@/core/tenancy/directory";
import type {
  TenantMembership,
  TenantMembershipContext,
} from "@/core/tenancy/types";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { normalizeTenantId } from "@/lib/tenancy/context";

type MembershipContextRow = {
  user_id: string;
  active_tenant_id: string | null;
  memberships: TenantMembership[] | null;
};

function normalizeMemberships(
  memberships: TenantMembership[] | null | undefined,
): TenantMembership[] {
  if (!Array.isArray(memberships)) return [];

  return memberships.reduce<TenantMembership[]>((acc, membership) => {
    const tenantId = normalizeTenantId(membership?.tenantId);
    if (!tenantId) return acc;

    acc.push({
      tenantId,
      role: membership.role,
      label: membership.label,
      status: membership.status ?? "active",
    });
    return acc;
  }, []);
}

function toContext(row: MembershipContextRow): TenantMembershipContext {
  return {
    activeTenantId: normalizeTenantId(row.active_tenant_id),
    memberships: normalizeMemberships(row.memberships),
  };
}

export const supabaseTenantMembershipDirectoryRepository: TenantMembershipDirectoryRepository =
  {
    async findByUserId(
      userId: string,
    ): Promise<TenantMembershipContext | undefined> {
      if (!isSupabaseConfigured()) return undefined;

      const client = getSupabaseClient();
      const { data, error } = await client
        .from("user_membership_contexts")
        .select("user_id, active_tenant_id, memberships")
        .eq("user_id", userId)
        .maybeSingle<MembershipContextRow>();

      if (error) throw error;
      return data ? toContext(data) : undefined;
    },
    async upsert(params: {
      userId: string;
      context: TenantMembershipContext;
    }): Promise<void> {
      if (!isSupabaseConfigured()) return;

      const client = getSupabaseClient();
      const memberships = normalizeMemberships(params.context.memberships);
      const { error } = await client.from("user_membership_contexts").upsert(
        {
          user_id: params.userId,
          active_tenant_id:
            normalizeTenantId(params.context.activeTenantId) || null,
          memberships,
        },
        { onConflict: "user_id" },
      );

      if (error) throw error;
    },
  };
