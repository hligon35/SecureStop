import type { LatLng } from '@/store/location';

export function computeEtaMinutes(params: {
  vehicle: LatLng;
  stop: LatLng;
  averageSpeedKph?: number;
}): number {
  const speed = Math.max(5, params.averageSpeedKph ?? 25);

  const dLat = params.vehicle.latitude - params.stop.latitude;
  const dLng = params.vehicle.longitude - params.stop.longitude;

  // Rough distance estimate (not geodesic). Good enough for placeholder ETA.
  const distanceKm = Math.sqrt(dLat * dLat + dLng * dLng) * 111;
  const hours = distanceKm / speed;
  return Math.max(1, Math.round(hours * 60));
}
