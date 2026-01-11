import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Button, Card, ProgressBar, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapPanelLayout } from '@/components/MapPanelLayout';
import { VehicleMap } from '@/components/VehicleMap';
import { startMockVehicleFeed } from '@/lib/mock/locationFeed';
import { useLocationStore } from '@/store/location';
import { useNotificationStore } from '@/store/notifications';
import { useTripStore } from '@/store/trip';

export default function DriverMapScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const trueGreen = '#16A34A';
  const trueYellow = '#F59E0B';
  const trueRed = '#DC2626';
  const onTrueGreen = '#FFFFFF';
  const onTrueYellow = '#111827';
  const onTrueRed = '#FFFFFF';
  const SPEED_LIMIT_MPH = 25;
  const vehicle = useLocationStore((s) => s.vehicleLocation.coordinate);
  const route = useLocationStore((s) => s.routePolyline);
  const stops = useLocationStore((s) => s.stops);
  const setVehicleLocation = useLocationStore((s) => s.setVehicleLocation);

  const routeId = useTripStore((s) => s.routeId);
  const vehicleId = useTripStore((s) => s.vehicleId);
  const status = useTripStore((s) => s.status);
  const startTrip = useTripStore((s) => s.startTrip);
  const pauseTrip = useTripStore((s) => s.pauseTrip);
  const endTrip = useTripStore((s) => s.endTrip);
  const currentStopIndex = useTripStore((s) => s.currentStopIndex);
  const setCurrentStopIndex = useTripStore((s) => s.setCurrentStopIndex);

  const inbox = useNotificationStore((s) => s.inbox);

  const [panelWidth, setPanelWidth] = useState(0);
  const [tickerContainerWidth, setTickerContainerWidth] = useState(0);
  const [tickerContentWidth, setTickerContentWidth] = useState(0);

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

  const distanceMeters = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
    const R = 6371000;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(b.latitude - a.latitude);
    const dLng = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  };

  const wasNearStartRef = useRef<boolean | null>(null);
  const hasAutoStartedRef = useRef(false);
  const hasAutoEndedRef = useRef(false);

  useEffect(() => {
    if (stops.length < 2) return;

    const startStop = stops[0];
    const endStop = stops[stops.length - 1];

    const START_RADIUS_M = 90;
    const END_RADIUS_M = 90;

    const nearStart = distanceMeters(vehicle, startStop.coordinate) <= START_RADIUS_M;
    const nearEnd = distanceMeters(vehicle, endStop.coordinate) <= END_RADIUS_M;

    if (wasNearStartRef.current === null) wasNearStartRef.current = nearStart;

    // Auto-start when the bus *leaves* the start terminal.
    if (!hasAutoStartedRef.current && status === 'In Depot' && wasNearStartRef.current && !nearStart) {
      hasAutoStartedRef.current = true;
      startTrip();
    }

    // Auto-end when the bus *arrives* at the end terminal.
    if (!hasAutoEndedRef.current && status !== 'Completed' && nearEnd) {
      hasAutoEndedRef.current = true;
      endTrip();
    }

    wasNearStartRef.current = nearStart;

    // Allow auto-end again if they leave the end terminal (useful for testing).
    if (hasAutoEndedRef.current && !nearEnd && status !== 'Completed') {
      hasAutoEndedRef.current = false;
    }
  }, [endTrip, startTrip, status, stops, vehicle]);

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

  const tickerX = useRef(new Animated.Value(0)).current;

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

  const roadTickerText = useMemo(() => {
    if (!roadConditionUpdates.length) return 'No live road condition updates.';
    return roadConditionUpdates
      .map((m) => {
        const sev = m.severity ? m.severity.toUpperCase() : 'INFO';
        return `${sev}: ${m.title}`;
      })
      .join('   •   ');
  }, [roadConditionUpdates]);

  useEffect(() => {
    if (!tickerContainerWidth || !tickerContentWidth) return;

    tickerX.stopAnimation();
    tickerX.setValue(0);

    const distance = Math.max(1, tickerContentWidth);
    const duration = Math.max(9000, Math.round(distance * 18));

    const animation = Animated.loop(
      Animated.timing(tickerX, {
        toValue: -distance,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    animation.start();
    return () => animation.stop();
  }, [tickerContainerWidth, tickerContentWidth, tickerX, roadTickerText]);

  return (
    <MapPanelLayout
      map={
        <View style={{ flex: 1 }}>
          <VehicleMap vehicle={vehicle} route={route} stops={stops} userStopId={nextStop?.id} />

          <Card
            mode="outlined"
            style={{
              position: 'absolute',
              left: 8,
              top: insets.top + 8,
              borderRadius: 12,
              backgroundColor: theme.colors.surface,
              opacity: 0.96,
            }}
          >
            <Card.Content style={{ paddingVertical: 6, paddingHorizontal: 10 }}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Speed Limit
              </Text>
              <Text>{`${SPEED_LIMIT_MPH} mph`}</Text>
            </Card.Content>
          </Card>

          <View
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              right: 4,
              bottom: 4,
              flexDirection: 'row',
              gap: 4,
            }}
          >
            <Animated.View style={{ transform: [{ scale: pulse }] }}>
              <Button
                mode="contained"
                buttonColor={status === 'On Route' ? trueGreen : theme.colors.surfaceVariant}
                textColor={status === 'On Route' ? onTrueGreen : theme.colors.onSurfaceVariant}
                disabled={status === 'On Route' || status === 'Completed'}
                onPress={startTrip}
              >
                {status === 'On Route' ? 'In Progress' : 'Start'}
              </Button>
            </Animated.View>

            <Button
              mode="contained"
              buttonColor={status === 'Paused' ? trueYellow : theme.colors.surfaceVariant}
              textColor={status === 'Paused' ? onTrueYellow : theme.colors.onSurfaceVariant}
              disabled={status === 'Completed'}
              onPress={pauseTrip}
            >
              {status === 'Paused' ? 'Idle' : 'Pause'}
            </Button>

            <Button
              mode="contained"
              buttonColor={status === 'Completed' ? trueRed : theme.colors.surfaceVariant}
              textColor={status === 'Completed' ? onTrueRed : theme.colors.onSurfaceVariant}
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
          <View style={{ paddingHorizontal: 6, paddingTop: 4, paddingBottom: 4, gap: 6 }}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Road Conditions
            </Text>
            <View
              onLayout={(e) => setTickerContainerWidth(e.nativeEvent.layout.width)}
              style={{
                backgroundColor: theme.colors.surfaceVariant,
                borderRadius: 10,
                overflow: 'hidden',
                paddingVertical: 4,
              }}
            >
              <Animated.View style={{ flexDirection: 'row', transform: [{ translateX: tickerX }] }}>
                <View
                  onLayout={(e) => setTickerContentWidth(e.nativeEvent.layout.width)}
                  style={{ paddingLeft: 12, paddingRight: 24 }}
                >
                  <Text numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>
                    {roadTickerText}
                  </Text>
                </View>
                <View style={{ paddingRight: 24 }}>
                  <Text numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>
                    {roadTickerText}
                  </Text>
                </View>
              </Animated.View>
            </View>
          </View>

          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <View style={{ gap: 8 }}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Route Summary
              </Text>

              <Card>
                <Card.Content>
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
                        <Text style={{ textAlign: 'center' }}>
                          {stops.length ? `${currentStopIndex + 1} / ${stops.length}` : '— / —'}
                        </Text>
                      </Card.Content>
                    </Card>
                  </View>

                  <View style={{ marginTop: 6 }}>
                    <Text variant="labelSmall">Progress</Text>
                    <ProgressBar progress={progress} />
                  </View>
                </Card.Content>
              </Card>
            </View>
          </View>
        </View>
      }
    />
  );
}
