import * as Location from 'expo-location';

import { api } from '@/lib/api/client';
import { enqueueLocation, flushLocationQueue } from '@/lib/location/uploadQueue';
import { useLocationStore } from '@/store/location';

export type DriverLocationTrackingHandle = {
  stop: () => void;
};

export async function startDriverForegroundTracking(params?: {
  postToBackend?: boolean;
}): Promise<DriverLocationTrackingHandle> {
  const postToBackend = params?.postToBackend ?? true;

  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') {
    throw new Error('Location permission not granted');
  }

  const sub = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 4000,
      distanceInterval: 10,
    },
    async (pos) => {
      const next = {
        coordinate: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
        heading: pos.coords.heading ?? undefined,
        updatedAt: Date.now(),
      };

      // Update local (drives the map marker in driver mode today).
      useLocationStore.getState().setVehicleLocation(next);

      if (!postToBackend) return;

      const payload = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        heading: pos.coords.heading ?? undefined,
        speed: pos.coords.speed ?? undefined,
        accuracy: pos.coords.accuracy ?? undefined,
        timestamp: pos.timestamp,
      };

      try {
        await api.post('/location/driver', payload);
        // Best-effort flush of any previously queued points.
        flushLocationQueue().catch(() => {});
      } catch {
        // Queue locally for later retry.
        enqueueLocation(payload).catch(() => {});
      }
    }
  );

  const flushTimer = setInterval(() => {
    if (!postToBackend) return;
    flushLocationQueue().catch(() => {});
  }, 20000);

  return {
    stop: () => {
      clearInterval(flushTimer);
      sub.remove();
    },
  };
}
