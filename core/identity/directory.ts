import type { IdentityProfile } from "@/core/identity/types";

export interface IdentityDirectoryRepository {
  findByUserId(userId: string): Promise<IdentityProfile | undefined>;
  upsert(profile: IdentityProfile): Promise<void>;
}
