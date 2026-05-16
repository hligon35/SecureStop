import type { IdentityProfile } from "@/core/identity/types";

export interface IdentityProfileRepository {
  load(): Promise<IdentityProfile | undefined>;
  save(profile: IdentityProfile): Promise<void>;
  clear(): Promise<void>;
}
