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

  const visibleInbox = useMemo(
    () => inbox.filter((msg) => alertVisibleToViewer({ msg, viewerRole: 'parent', prefs })),
    [inbox, prefs]
  );

  return (
    <MapPanelLayout
      map={<VehicleMap vehicle={vehicle} route={route} stops={stops} userStopId={userStopId} />}
      panel={
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          <Card>
            <Card.Title title="Next Stop" subtitle={userStop?.name ?? 'Not set'} />
            <Card.Content>
              <Text variant="titleMedium">ETA: {eta ? `${eta} min` : '—'}</Text>
              <Text variant="labelSmall">Vehicle: Bus 12 (mock)</Text>
            </Card.Content>
          </Card>

          <View style={{ gap: 12 }}>
            <AlertInbox inbox={visibleInbox} />
          </View>
        </ScrollView>
      }
    />
  );
}
