import { create } from "zustand";

import type { Role } from "@/constants/roles";
import type {
  TenantMembership,
  TenantMembershipContext,
} from "@/core/tenancy/types";
import { localTenantMembershipRepository } from "@/lib/tenancy/localMembershipRepository";
import { normalizeTenantId } from "@/lib/tenancy/context";

type TenantMembershipState = {
  hydrated: boolean;
  activeTenantId: string;
  memberships: TenantMembership[];
  hydrate: () => Promise<void>;
  replaceContext: (context: TenantMembershipContext) => void;
  setActiveTenantId: (tenantId: string) => void;
  syncFromAuthProfile: (params: {
    tenantId?: string;
    role: Role;
    label?: string;
  }) => void;
  clear: () => void;
};

function persist(context: TenantMembershipContext) {
  localTenantMembershipRepository.save(context).catch(() => {});
}

function ensureMembership(
  memberships: TenantMembership[],
  params: { tenantId: string; role: Role; label?: string },
): TenantMembership[] {
  const nextMembership: TenantMembership = {
    tenantId: params.tenantId,
    role: params.role,
    label: params.label,
    status: "active",
  };

  return [
    nextMembership,
    ...memberships.filter(
      (membership) => membership.tenantId !== params.tenantId,
    ),
  ];
}

export const useTenantMembershipStore = create<TenantMembershipState>(
  (set) => ({
    hydrated: false,
    activeTenantId: "",
    memberships: [],
    hydrate: async () => {
      const context = await localTenantMembershipRepository.load();
      set({
        hydrated: true,
        activeTenantId: normalizeTenantId(context?.activeTenantId),
        memberships: context?.memberships ?? [],
      });
    },
    replaceContext: (context) =>
      set(() => {
        const next = {
          activeTenantId: normalizeTenantId(context.activeTenantId),
          memberships: context.memberships ?? [],
        };
        persist(next);
        return { ...next, hydrated: true };
      }),
    setActiveTenantId: (tenantId) =>
      set((state) => {
        const normalizedTenantId = normalizeTenantId(tenantId);
        const next = {
          activeTenantId: normalizedTenantId,
          memberships: state.memberships,
        };
        persist(next);
        return next;
      }),
    syncFromAuthProfile: ({ tenantId, role, label }) =>
      set((state) => {
        const normalizedTenantId = normalizeTenantId(tenantId);
        if (!normalizedTenantId) return state;

        const memberships = ensureMembership(state.memberships, {
          tenantId: normalizedTenantId,
          role,
          label,
        });
        const next = {
          activeTenantId: normalizedTenantId,
          memberships,
        };
        persist(next);
        return next;
      }),
    clear: () => {
      localTenantMembershipRepository.clear().catch(() => {});
      set({ activeTenantId: "", memberships: [] });
    },
  }),
);
