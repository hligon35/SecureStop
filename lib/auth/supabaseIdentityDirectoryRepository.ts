import type { IdentityDirectoryRepository } from "@/core/identity/directory";
import type { IdentityProfile } from "@/core/identity/types";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { normalizeTenantId } from "@/lib/tenancy/context";

type UserProfileRow = {
  user_id: string;
  role: IdentityProfile["role"];
  tenant_id: string | null;
  school_id: string | null;
  email: string;
  home_address: string;
};

function toIdentityProfile(row: UserProfileRow): IdentityProfile {
  const tenantId = normalizeTenantId(row.tenant_id ?? row.school_id);
  return {
    role: row.role,
    userId: row.user_id,
    tenantId: tenantId || undefined,
    schoolId: tenantId || undefined,
    email: row.email,
    homeAddress: row.home_address,
  };
}

function toUserProfileRow(profile: IdentityProfile): UserProfileRow {
  const tenantId = normalizeTenantId(profile.tenantId ?? profile.schoolId);
  return {
    user_id: profile.userId,
    role: profile.role,
    tenant_id: tenantId || null,
    school_id: tenantId || null,
    email: profile.email,
    home_address: profile.homeAddress,
  };
}

export const supabaseIdentityDirectoryRepository: IdentityDirectoryRepository =
  {
    async findByUserId(userId: string): Promise<IdentityProfile | undefined> {
      if (!isSupabaseConfigured()) return undefined;

      const client = getSupabaseClient();
      const { data, error } = await client
        .from("user_profiles")
        .select("user_id, role, tenant_id, school_id, email, home_address")
        .eq("user_id", userId)
        .maybeSingle<UserProfileRow>();

      if (error) throw error;
      return data ? toIdentityProfile(data) : undefined;
    },
    async upsert(profile: IdentityProfile): Promise<void> {
      if (!isSupabaseConfigured()) return;

      const client = getSupabaseClient();
      const { error } = await client
        .from("user_profiles")
        .upsert(toUserProfileRow(profile), { onConflict: "user_id" });

      if (error) throw error;
    },
  };
