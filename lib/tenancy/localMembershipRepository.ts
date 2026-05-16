import type { TenantMembershipRepository } from "@/core/tenancy/repository";
import type { TenantMembershipContext } from "@/core/tenancy/types";
import { getJson, setJson } from "@/lib/storage/kv";

const KEY = "securestop.tenantMembership.v1";

export const localTenantMembershipRepository: TenantMembershipRepository = {
  async load(): Promise<TenantMembershipContext | undefined> {
    return getJson<TenantMembershipContext>(KEY);
  },
  async save(context: TenantMembershipContext): Promise<void> {
    await setJson(KEY, context);
  },
  async clear(): Promise<void> {
    await setJson(KEY, undefined);
  },
};
