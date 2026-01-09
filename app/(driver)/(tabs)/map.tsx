import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Card, Chip, ProgressBar, Text } from 'react-native-paper';

import { MapPanelLayout } from '@/components/MapPanelLayout';
import { VehicleMap } from '@/components/VehicleMap';
import { computeEtaMinutes } from '@/lib/eta';
import { startMockVehicleFeed } from '@/lib/mock/locationFeed';
import { useLocationStore } from '@/store/location';
import { useTripStore } from '@/store/trip';

export default function DriverMapScreen() {
  const vehicle = useLocationStore((s) => s.vehicleLocation.coordinate);
  const route = useLocationStore((s) => s.routePolyline);
  const stops = useLocationStore((s) => s.stops);
  const setVehicleLocation = useLocationStore((s) => s.setVehicleLocation);

  const routeId = useTripStore((s) => s.routeId);
  const vehicleId = useTripStore((s) => s.vehicleId);
  const driverName = useTripStore((s) => s.driverName);
  const status = useTripStore((s) => s.status);
  const currentStopIndex = useTripStore((s) => s.currentStopIndex);
  const setCurrentStopIndex = useTripStore((s) => s.setCurrentStopIndex);
  
  const [panelWidth, setPanelWidth] = useState(0);

  useEffect(() => {
    const stop = startMockVehicleFeed({ route, onUpdate: setVehicleLocation });
    return stop;
  }, [route, setVehicleLocation]);

  useEffect(() => {
    if (stops.length === 0) return;
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
    setCurrentStopIndex(bestIndex);
  }, [setCurrentStopIndex, stops, vehicle.latitude, vehicle.longitude]);

  const nextStop = stops[Math.min(stops.length - 1, currentStopIndex + 1)];
  const etaToNext = nextStop ? computeEtaMinutes({ vehicle, stop: nextStop.coordinate }) : undefined;
  const progress = stops.length > 1 ? currentStopIndex / (stops.length - 1) : 0;

  const titleCentered = useMemo(() => ({ textAlign: 'center' as const }), []);
  const cardWidth = Math.max(0, panelWidth - 32);

  return (
    <MapPanelLayout
      map={<VehicleMap vehicle={vehicle} route={route} stops={stops} userStopId={nextStop?.id} />}
      panel={
        <View style={{ flex: 1 }} onLayout={(e) => setPanelWidth(e.nativeEvent.layout.width)}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, gap: 12 }}
          >
            <Card style={{ width: cardWidth }}>
              <Card.Content>
                <View style={{ alignItems: 'center', marginBottom: 12 }}>
                  <Text variant="titleMedium" style={titleCentered}>
                    Route Summary
                  </Text>
                </View>

                <View style={{ position: 'absolute', top: 12, right: 12 }}>
                  <Chip compact>{status}</Chip>
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Card mode="outlined" style={{ flex: 1 }}>
                    <Card.Content>
                      <Text variant="labelSmall" style={{ textAlign: 'center' }}>
                        Route
                      </Text>
                      <Text style={{ textAlign: 'center' }}>{routeId}</Text>
                    </Card.Content>
                  </Card>
                  <Card mode="outlined" style={{ flex: 1 }}>
                    <Card.Content>
                      <Text variant="labelSmall" style={{ textAlign: 'center' }}>
                        Vehicle
                      </Text>
                      <Text style={{ textAlign: 'center' }}>{vehicleId}</Text>
                    </Card.Content>
                  </Card>
                  <Card mode="outlined" style={{ flex: 1 }}>
                    <Card.Content>
                      <Text variant="labelSmall" style={{ textAlign: 'center' }}>
                        Driver
                      </Text>
                      <Text style={{ textAlign: 'center' }}>{driverName}</Text>
                    </Card.Content>
                  </Card>
                </View>

                <View style={{ marginTop: 12 }}>
                  <Text variant="labelSmall">Progress</Text>
                  <ProgressBar progress={progress} />
                </View>
              </Card.Content>
            </Card>

            <Card style={{ width: cardWidth }}>
              <Card.Content>
                <View style={{ alignItems: 'center', marginBottom: 12 }}>
                  <Text variant="titleMedium" style={titleCentered}>
                    Next
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Card mode="outlined" style={{ flex: 1 }}>
                    <Card.Content>
                      <Text variant="labelSmall" style={{ textAlign: 'center' }}>
                        Stop
                      </Text>
                      <Text style={{ textAlign: 'center' }}>{nextStop?.name ?? '—'}</Text>
                    </Card.Content>
                  </Card>
                  <Card mode="outlined" style={{ flex: 1 }}>
                    <Card.Content>
                      <Text variant="labelSmall" style={{ textAlign: 'center' }}>
                        ETA
                      </Text>
                      <Text style={{ textAlign: 'center' }}>{etaToNext ? `${etaToNext} min` : '—'}</Text>
                    </Card.Content>
                  </Card>
                </View>
              </Card.Content>
            </Card>
          </ScrollView>
        </View>
      }
    />
  );
}
