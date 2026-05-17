import type { Role } from "@/constants/roles";
import { localIdentityProfileRepository } from "@/lib/auth/localProfileRepository";
import { normalizeTenantId } from "@/lib/tenancy/context";
import { localTenantMembershipRepository } from "@/lib/tenancy/localMembershipRepository";

export type PersistedViewerContext = {
  tenantId: string;
  userId?: string;
  role?: Role;
};

export async function loadPersistedViewerContext(): Promise<
  PersistedViewerContext | undefined
> {
  const [profile, membershipContext] = await Promise.all([
    localIdentityProfileRepository.load(),
    localTenantMembershipRepository.load(),
  ]);

  const tenantId = normalizeTenantId(
    membershipContext?.activeTenantId ?? profile?.tenantId ?? profile?.schoolId,
  );
  if (!tenantId) return undefined;

  return {
    tenantId,
    userId: profile?.userId,
    role: profile?.role,
  };
}
