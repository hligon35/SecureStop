import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, View } from 'react-native';
import { Button, Card, Chip, ProgressBar, Text, useTheme } from 'react-native-paper';

import { MapPanelLayout } from '@/components/MapPanelLayout';
import { VehicleMap } from '@/components/VehicleMap';
import { startMockVehicleFeed } from '@/lib/mock/locationFeed';
import { useLocationStore } from '@/store/location';
import { useNotificationStore } from '@/store/notifications';
import { useTripStore } from '@/store/trip';

export default function DriverMapScreen() {
  const theme = useTheme();
  const vehicle = useLocationStore((s) => s.vehicleLocation.coordinate);
  const route = useLocationStore((s) => s.routePolyline);
  const stops = useLocationStore((s) => s.stops);
  const setVehicleLocation = useLocationStore((s) => s.setVehicleLocation);

  const routeId = useTripStore((s) => s.routeId);
  const vehicleId = useTripStore((s) => s.vehicleId);
  const driverName = useTripStore((s) => s.driverName);
  const status = useTripStore((s) => s.status);
  const startTrip = useTripStore((s) => s.startTrip);
  const pauseTrip = useTripStore((s) => s.pauseTrip);
  const endTrip = useTripStore((s) => s.endTrip);
  const currentStopIndex = useTripStore((s) => s.currentStopIndex);
  const setCurrentStopIndex = useTripStore((s) => s.setCurrentStopIndex);

  const inbox = useNotificationStore((s) => s.inbox);
  
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
  const progress = stops.length > 1 ? currentStopIndex / (stops.length - 1) : 0;

  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (status !== 'On Route') {
      pulse.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 550,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 550,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [pulse, status]);

  const titleCentered = useMemo(() => ({ textAlign: 'center' as const }), []);
  const cardWidth = Math.max(0, panelWidth - 32);

  const roadConditionUpdates = useMemo(() => {
    const roadTemplateIds = new Set([
      'minor_delay_traffic',
      'weather_delay',
      'mechanical_issue',
      'route_change',
      'substitute_bus',
      'emergency',
      'unsafe_situation',
    ]);

    const noteRegex = /(road|traffic|weather|accident|crash|closed|closure|detour)/i;

    const items = inbox
      .filter((m) => m.createdByRole === 'driver')
      .filter((m) => {
        if (m.templateId && roadTemplateIds.has(m.templateId)) return true;
        return noteRegex.test(m.title) || noteRegex.test(m.body);
      })
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 3);

    return items;
  }, [inbox]);

  const latestRoadUpdate = roadConditionUpdates[0];
  const roadChipColor = useMemo(() => {
    switch (latestRoadUpdate?.severity) {
      case 'red':
        return theme.colors.errorContainer;
      case 'orange':
        return theme.colors.secondaryContainer;
      case 'yellow':
        return theme.colors.tertiaryContainer;
      default:
        return theme.colors.surfaceVariant;
    }
  }, [latestRoadUpdate?.severity, theme.colors.errorContainer, theme.colors.secondaryContainer, theme.colors.surfaceVariant, theme.colors.tertiaryContainer]);

  return (
    <MapPanelLayout
      map={
        <View style={{ flex: 1 }}>
          <VehicleMap vehicle={vehicle} route={route} stops={stops} userStopId={nextStop?.id} />

          <View
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              right: 12,
              bottom: 12,
              flexDirection: 'row',
              gap: 10,
            }}
          >
            <Animated.View style={{ transform: [{ scale: pulse }] }}>
              <Button
                mode="contained"
                buttonColor={status === 'On Route' ? theme.colors.tertiary : undefined}
                textColor={status === 'On Route' ? theme.colors.onTertiary : undefined}
                disabled={status === 'On Route' || status === 'Completed'}
                onPress={startTrip}
              >
                {status === 'On Route' ? 'In Progress' : 'Start'}
              </Button>
            </Animated.View>

            <Button
              mode="contained"
              buttonColor={status === 'Paused' ? theme.colors.secondary : undefined}
              textColor={status === 'Paused' ? theme.colors.onSecondary : undefined}
              disabled={status === 'Completed'}
              onPress={pauseTrip}
            >
              {status === 'Paused' ? 'Idle' : 'Pause'}
            </Button>

            <Button
              mode="contained"
              buttonColor={status === 'Completed' ? theme.colors.tertiary : theme.colors.error}
              textColor={status === 'Completed' ? theme.colors.onTertiary : theme.colors.onError}
              disabled={status === 'Completed'}
              onPress={endTrip}
            >
              {status === 'Completed' ? 'Complete' : 'End'}
            </Button>
          </View>
        </View>
      }
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
                        Stop
                      </Text>
                      <Text style={{ textAlign: 'center' }}>{stops.length ? String(currentStopIndex + 1) : '—'}</Text>
                    </Card.Content>
                  </Card>
                </View>

                <View style={{ marginTop: 12 }}>
                  <Text variant="labelSmall">Progress</Text>
                  <ProgressBar progress={progress} />
                </View>

                <Card mode="outlined" style={{ marginTop: 12 }}>
                  <Card.Content style={{ gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <Text variant="labelSmall">Road Conditions</Text>
                      <Chip compact style={{ backgroundColor: roadChipColor }}>
                        {latestRoadUpdate?.severity ? latestRoadUpdate.severity.toUpperCase() : 'OK'}
                      </Chip>
                    </View>
                    <Text numberOfLines={1}>{latestRoadUpdate?.title ?? 'No updates'}</Text>
                    <Text variant="bodySmall" numberOfLines={2} style={{ color: theme.colors.onSurfaceVariant }}>
                      {latestRoadUpdate?.body ?? 'No live road condition alerts yet.'}
                    </Text>
                  </Card.Content>
                </Card>
              </Card.Content>
            </Card>
          </ScrollView>
        </View>
      }
    />
  );
}
