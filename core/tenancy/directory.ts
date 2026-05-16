import type { TenantMembershipContext } from "@/core/tenancy/types";

export interface TenantMembershipDirectoryRepository {
  findByUserId(userId: string): Promise<TenantMembershipContext | undefined>;
  upsert(params: {
    userId: string;
    context: TenantMembershipContext;
  }): Promise<void>;
}
