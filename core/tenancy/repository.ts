import type { TenantMembershipContext } from "@/core/tenancy/types";

export interface TenantMembershipRepository {
  load(): Promise<TenantMembershipContext | undefined>;
  save(context: TenantMembershipContext): Promise<void>;
  clear(): Promise<void>;
}
