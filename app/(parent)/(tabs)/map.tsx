import { useEffect, useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { AlertInbox } from '@/components/AlertInbox';
import { MapPanelLayout } from '@/components/MapPanelLayout';
import { VehicleMap } from '@/components/VehicleMap';
import { computeEtaMinutes } from '@/lib/eta';
import { startMockVehicleFeed } from '@/lib/mock/locationFeed';
import { useLocationStore } from '@/store/location';
import { alertVisibleToViewer, useNotificationStore } from '@/store/notifications';

function milesBetween(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 3958.7613; // miles
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export default function ParentMapScreen() {
  const vehicle = useLocationStore((s) => s.vehicleLocation.coordinate);
  const route = useLocationStore((s) => s.routePolyline);
  const stops = useLocationStore((s) => s.stops);
  const userStopId = useLocationStore((s) => s.userStopId);
  const setVehicleLocation = useLocationStore((s) => s.setVehicleLocation);

  const inbox = useNotificationStore((s) => s.inbox);
  const prefs = useNotificationStore((s) => s.prefs);

  useEffect(() => {
    const stop = startMockVehicleFeed({
      route,
      onUpdate: setVehicleLocation,
    });
    return stop;
  }, [route, setVehicleLocation]);

  const userStop = useMemo(() => stops.find((s) => s.id === userStopId), [stops, userStopId]);
  const eta = useMemo(() => {
    if (!userStop) return undefined;
    return computeEtaMinutes({ vehicle, stop: userStop.coordinate });
  }, [userStop, vehicle]);

  const userStopIndex = useMemo(() => stops.findIndex((s) => s.id === userStopId), [stops, userStopId]);
  const vehicleNearestStopIndex = useMemo(() => {
    if (stops.length === 0) return -1;
    let bestIndex = 0;
    let bestScore = Number.POSITIVE_INFINITY;
    for (let i = 0; i < stops.length; i++) {
      const s = stops[i];
      const dLat = vehicle.latitude - s.coordinate.latitude;
      const dLng = vehicle.longitude - s.coordinate.longitude;
      const score = dLat * dLat + dLng * dLng;
      if (score < bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
    return bestIndex;
  }, [stops, vehicle.latitude, vehicle.longitude]);

  const stopsTilArrival = useMemo(() => {
    if (userStopIndex < 0 || vehicleNearestStopIndex < 0) return undefined;
    return Math.max(0, userStopIndex - vehicleNearestStopIndex);
  }, [userStopIndex, vehicleNearestStopIndex]);

  const etaMilesText = useMemo(() => {
    if (!userStop) return '—';
    const mi = milesBetween(vehicle, userStop.coordinate);
    const miText = Number.isFinite(mi) ? `${mi.toFixed(1)} mi` : '—';
    const etaText = eta ? `${eta} min` : '—';
    return `${etaText} / ${miText}`;
  }, [eta, userStop, vehicle]);

  const visibleInbox = useMemo(
    () => inbox.filter((msg) => alertVisibleToViewer({ msg, viewerRole: 'parent', prefs })),
    [inbox, prefs]
  );

  return (
    <MapPanelLayout
      map={<VehicleMap vehicle={vehicle} route={route} stops={stops} userStopId={userStopId} />}
      panel={
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Card mode="outlined" style={{ flex: 1 }}>
              <Card.Content>
                <Text variant="labelSmall" style={{ textAlign: 'center' }}>
                  Stops til arrival
                </Text>
                <Text variant="titleMedium" style={{ textAlign: 'center' }}>
                  {typeof stopsTilArrival === 'number' ? String(stopsTilArrival) : '—'}
                </Text>
              </Card.Content>
            </Card>

            <Card mode="outlined" style={{ flex: 1 }}>
              <Card.Content>
                <Text variant="labelSmall" style={{ textAlign: 'center' }}>
                  ETA (min/mi)
                </Text>
                <Text variant="titleMedium" style={{ textAlign: 'center' }}>
                  {etaMilesText}
                </Text>
              </Card.Content>
            </Card>
          </View>

          <View style={{ gap: 12 }}>
            <AlertInbox inbox={visibleInbox} />
          </View>
        </ScrollView>
      }
    />
  );
}
