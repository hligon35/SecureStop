import { MapPanelLayout } from '@/components/MapPanelLayout';
import { VehicleMap } from '@/components/VehicleMap';
import { computeEtaMinutes } from '@/lib/eta';
import { startMockVehicleFeed } from '@/lib/mock/locationFeed';
import { useLocationStore } from '@/store/location';
import { alertVisibleToViewer, useNotificationStore } from '@/store/notifications';
import { useTripStore } from '@/store/trip';
import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { Avatar, Card, Text, useTheme } from 'react-native-paper';

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
  const theme = useTheme();
  const vehicle = useLocationStore((s) => s.vehicleLocation.coordinate);
  const route = useLocationStore((s) => s.routePolyline);
  const stops = useLocationStore((s) => s.stops);
  const userStopId = useLocationStore((s) => s.userStopId);
  const setVehicleLocation = useLocationStore((s) => s.setVehicleLocation);

  const driverName = useTripStore((s) => s.driverName);

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

  const startOfTodayTs = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const visibleInboxToday = useMemo(
    () => visibleInbox.filter((m) => (m.createdAt ?? 0) >= startOfTodayTs),
    [startOfTodayTs, visibleInbox]
  );

  const busStatus = useMemo(() => {
    const hasAlerts = visibleInboxToday.length > 0;
    if (!hasAlerts) return { label: 'On schedule', kind: 'ok' as const };

    if (typeof eta === 'number') return { label: `Delayed: ${eta} min`, kind: 'warn' as const };
    return { label: 'Delayed', kind: 'warn' as const };
  }, [eta, visibleInboxToday.length]);

  const statusColors = useMemo(() => {
    if (busStatus.kind === 'ok') {
      return {
        background: theme.dark ? '#14532d' : '#bbf7d0',
        text: theme.dark ? '#dcfce7' : '#14532d',
      };
    }

    return {
      background: theme.dark ? '#713f12' : '#fef08a',
      text: theme.dark ? '#fef9c3' : '#713f12',
    };
  }, [busStatus.kind, theme.dark]);

  return (
    <MapPanelLayout
      map={<VehicleMap vehicle={vehicle} route={route} stops={stops} userStopId={userStopId} />}
      panel={
        <View style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 0, gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Details
            </Text>
          </View>

          <Card>
            <Card.Content style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
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

              <View
                style={{
                  position: 'relative',
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: theme.colors.surfaceVariant,
                }}
              >
                <View
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: -2,
                    paddingHorizontal: 10,
                    paddingVertical: 2,
                    borderRadius: 999,
                    backgroundColor: statusColors.background,
                  }}
                >
                  <Text variant="labelSmall" style={{ color: statusColors.text }}>
                    {busStatus.label}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Avatar.Text
                    size={44}
                    label={(driverName || 'D')
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part: string) => part[0]?.toUpperCase())
                      .join('')}
                    style={{ backgroundColor: theme.colors.primaryContainer }}
                    color={theme.colors.onPrimaryContainer}
                  />
                  <View style={{ flex: 1, minWidth: 0, paddingRight: 64 }}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Driver
                    </Text>
                    <Text variant="titleMedium" numberOfLines={1}>
                      {driverName || '—'}
                    </Text>
                  </View>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>
      }
    />
  );
}
