import type { Role } from "@/constants/roles";

export type TenantMembership = {
  tenantId: string;
  role: Role;
  label?: string;
  status?: "active" | "inactive";
};

export type TenantMembershipContext = {
  activeTenantId: string;
  memberships: TenantMembership[];
};
