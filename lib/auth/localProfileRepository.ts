import type { IdentityProfileRepository } from "@/core/identity/repository";
import type { IdentityProfile } from "@/core/identity/types";
import { getJson, setJson } from "@/lib/storage/kv";

const KEY = "securestop.authProfile.v1";

export const localIdentityProfileRepository: IdentityProfileRepository = {
  async load(): Promise<IdentityProfile | undefined> {
    return getJson<IdentityProfile>(KEY);
  },
  async save(profile: IdentityProfile): Promise<void> {
    await setJson(KEY, profile);
  },
  async clear(): Promise<void> {
    await setJson(KEY, undefined);
  },
};
