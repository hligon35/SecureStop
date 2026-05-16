import type { PushTokenRegistrationRequest } from "@/core/api/contracts";
import { api } from "@/lib/api/client";

export async function registerExpoPushToken(
  params: PushTokenRegistrationRequest,
): Promise<void> {
  // Backend endpoint is expected to exist in production; in scaffold this may 404.
  await api.post("/push/register", {
    token: params.token,
    platform: params.platform,
    deviceName: params.deviceName,
  });
}
