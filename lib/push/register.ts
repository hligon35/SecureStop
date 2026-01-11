import { api } from '@/lib/api/client';

export async function registerExpoPushToken(params: {
  token: string;
  platform?: string;
  deviceName?: string;
}): Promise<void> {
  // Backend endpoint is expected to exist in production; in scaffold this may 404.
  await api.post('/push/register', {
    token: params.token,
    platform: params.platform,
    deviceName: params.deviceName,
  });
}
