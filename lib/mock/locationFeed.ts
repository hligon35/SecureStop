import type { LatLng, VehicleLocation } from '@/store/location';

export function startMockVehicleFeed(params: {
  route: LatLng[];
  onUpdate: (next: VehicleLocation) => void;
  intervalMs?: number;
}) {
  let index = 0;
  let forward = true;

  const interval = setInterval(() => {
    if (params.route.length === 0) return;

    const nextCoord = params.route[index];
    params.onUpdate({
      coordinate: nextCoord,
      updatedAt: Date.now(),
      heading: forward ? 90 : 270,
    });

    if (forward) {
      index += 1;
      if (index >= params.route.length - 1) forward = false;
    } else {
      index -= 1;
      if (index <= 0) forward = true;
    }
  }, params.intervalMs ?? 1500);

  return () => clearInterval(interval);
}
