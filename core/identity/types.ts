import type { Role } from "@/constants/roles";

export type IdentityProfile = {
  role: Role;
  userId: string;
  tenantId?: string;
  schoolId?: string;
  email: string;
  homeAddress: string;
};
