import type { IdentityProfile } from "@/core/identity/types";
import type {
  TenantMembership,
  TenantMembershipContext,
} from "@/core/tenancy/types";
import { localIdentityProfileRepository } from "@/lib/auth/localProfileRepository";
import type { StoredSession } from "@/lib/auth/sessionStorage";
import { supabaseIdentityDirectoryRepository } from "@/lib/auth/supabaseIdentityDirectoryRepository";
import { normalizeTenantId } from "@/lib/tenancy/context";
import { supabaseTenantMembershipDirectoryRepository } from "@/lib/tenancy/supabaseMembershipDirectoryRepository";
import { useTenantMembershipStore } from "@/store/tenantMembership";

function toMemberships(profile: IdentityProfile): TenantMembership[] {
  const tenantId = normalizeTenantId(profile.tenantId ?? profile.schoolId);
  if (!tenantId) return [];

  return [
    {
      tenantId,
      role: profile.role,
      status: "active",
    },
  ];
}

function toMembershipContext(
  profile: IdentityProfile,
): TenantMembershipContext {
  const memberships = toMemberships(profile);
  return {
    activeTenantId: memberships[0]?.tenantId ?? "",
    memberships,
  };
}

export async function persistIdentityProfile(profile: IdentityProfile) {
  await localIdentityProfileRepository.save(profile);

  useTenantMembershipStore.getState().syncFromAuthProfile({
    tenantId: profile.tenantId ?? profile.schoolId,
    role: profile.role,
  });

  const membershipContext = toMembershipContext(profile);
  await Promise.allSettled([
    supabaseIdentityDirectoryRepository.upsert(profile),
    supabaseTenantMembershipDirectoryRepository.upsert({
      userId: profile.userId,
      context: membershipContext,
    }),
  ]);
}

export async function hydrateIdentityProfile(params: {
  session?: StoredSession;
  storedProfile?: IdentityProfile;
}) {
  const userId = params.storedProfile?.userId ?? params.session?.userId;
  if (!userId) {
    return {
      profile: params.storedProfile,
      membershipContext: undefined,
    };
  }

  const [profileResult, membershipResult] = await Promise.allSettled([
    supabaseIdentityDirectoryRepository.findByUserId(userId),
    supabaseTenantMembershipDirectoryRepository.findByUserId(userId),
  ]);

  const profile =
    profileResult.status === "fulfilled" && profileResult.value
      ? profileResult.value
      : params.storedProfile;
  const membershipContext =
    membershipResult.status === "fulfilled"
      ? membershipResult.value
      : undefined;

  if (
    profile &&
    JSON.stringify(profile) !== JSON.stringify(params.storedProfile)
  ) {
    await localIdentityProfileRepository.save(profile);
  }

  if (membershipContext) {
    useTenantMembershipStore.getState().replaceContext(membershipContext);
  }

  return { profile, membershipContext };
}
