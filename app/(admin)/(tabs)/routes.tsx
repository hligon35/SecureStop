import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Image, Pressable, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';

import { VehicleMap } from '@/components/VehicleMap';
import type { LatLng, Stop } from '@/store/location';
import { useLocationStore } from '@/store/location';

const BUS_ICON = require('../../../assets/images/sbus.png');

function routeDistanceKm(points: LatLng[]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const dLat = b.latitude - a.latitude;
    const dLng = (b.longitude - a.longitude) * Math.cos(((a.latitude + b.latitude) / 2) * (Math.PI / 180));
    const segmentKm = Math.sqrt(dLat * dLat + dLng * dLng) * 111;
    total += segmentKm;
  }
  return total;
}

function formatTripSummary(params: { distanceKm: number; averageSpeedKph?: number }): { timeLabel: string; distLabel: string } {
  const speed = Math.max(5, params.averageSpeedKph ?? 25);
  const hours = params.distanceKm / speed;
  const minutes = Math.max(1, Math.round(hours * 60));
  const miles = params.distanceKm * 0.621371;
  return {
    timeLabel: `${minutes} min`,
    distLabel: `${miles.toFixed(1)} mi`,
  };
}

export default function AdminRoutesScreen() {
  const theme = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const fleet = useLocationStore((s) => s.fleet);

  const params = useLocalSearchParams<{ vehicleId?: string }>();
  const paramVehicleId = typeof params.vehicleId === 'string' ? params.vehicleId : undefined;

  const [activeId, setActiveId] = useState<string>('fleet');

  const didApplyInitialParam = useRef(false);
  useEffect(() => {
    if (didApplyInitialParam.current) return;
    didApplyInitialParam.current = true;

    if (!paramVehicleId) return;
    if (!fleet.some((v) => v.id === paramVehicleId)) return;
    setActiveId(paramVehicleId);
  }, [fleet, paramVehicleId]);

  const selectedVehicle = useMemo(() => fleet.find((v) => v.id === activeId), [activeId, fleet]);

  const fleetRoutes = useMemo(() => fleet.map((v) => v.routePolyline).filter((r) => r.length > 1), [fleet]);

  const fleetStartEndStops: Stop[] = useMemo(() => {
    const stops: Stop[] = [];
    for (const v of fleet) {
      const first = v.stops[0];
      const last = v.stops[v.stops.length - 1];
      if (first) stops.push({ id: `${v.id}-start`, name: `${v.badgeNumber} Start`, coordinate: first.coordinate });
      if (last) stops.push({ id: `${v.id}-end`, name: `${v.badgeNumber} End`, coordinate: last.coordinate });
    }
    return stops;
  }, [fleet]);

  const details = useMemo(() => {
    if (activeId === 'fleet') {
      const vehicleCount = fleet.length;
      const stopsCount = fleet.reduce((acc, v) => acc + v.stops.length, 0);
      const distanceKm = fleet.reduce((acc, v) => acc + routeDistanceKm(v.routePolyline), 0);
      const trip = formatTripSummary({ distanceKm });
      return { vehicleCount, stopsCount, trip };
    }
    if (!selectedVehicle) return { vehicleCount: 0, stopsCount: 0, trip: formatTripSummary({ distanceKm: 0 }) };
    const distanceKm = routeDistanceKm(selectedVehicle.routePolyline);
    const trip = formatTripSummary({ distanceKm });
    return { vehicleCount: 1, stopsCount: selectedVehicle.stops.length, trip };
  }, [activeId, fleet, selectedVehicle]);

  const carouselData = useMemo(() => [{ id: 'fleet', label: 'Fleet' }, ...fleet.map((v) => ({ id: v.id, label: String(v.badgeNumber) }))], [fleet]);

  const carouselHeight = 55;
  const detailsGap = 8;

  // Place the carousel so its bottom sits exactly on the *top* edge of the tab bar.
  const carouselBottomOffset = 8;

  const [detailsSectionHeight, setDetailsSectionHeight] = useState(0);

  const mapBottomPadding = useMemo(() => {
    // Reserve space so the map visually ends above the Details strip + carousel + bottom nav.
    return carouselBottomOffset + carouselHeight + detailsGap + detailsSectionHeight;
  }, [carouselBottomOffset, carouselHeight, detailsGap, detailsSectionHeight]);

  const mapNode = useMemo(() => {
    const fallbackVehicle = fleet[0];
    const fallbackCoord = fallbackVehicle?.vehicleLocation.coordinate ?? { latitude: 40.758, longitude: -73.9855 };

    if (activeId === 'fleet') {
      return (
        <VehicleMap
          mode="fleet"
          vehicle={fallbackCoord}
          route={[]}
          stops={fleetStartEndStops}
          fleetRoutes={fleetRoutes}
        />
      );
    }

    if (!selectedVehicle) {
      return <VehicleMap vehicle={fallbackCoord} route={[]} stops={[]} />;
    }

    return (
      <VehicleMap
        vehicle={selectedVehicle.vehicleLocation.coordinate}
        route={selectedVehicle.routePolyline}
        stops={selectedVehicle.stops}
      />
    );
  }, [activeId, fleet, fleetRoutes, fleetStartEndStops, selectedVehicle]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flex: 1, paddingBottom: mapBottomPadding }}>
        {mapNode}
      </View>

      {/* Details Grid */}
      <View
        onLayout={(e) => {
          const next = Math.ceil(e.nativeEvent.layout.height);
          if (next !== detailsSectionHeight) setDetailsSectionHeight(next);
        }}
        style={{
          position: 'absolute',
          left: 6,
          right: 6,
          bottom: carouselBottomOffset + detailsGap + carouselHeight,
          gap: 6,
        }}
      >
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 2 }}>
          Details
        </Text>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Card mode="outlined" style={{ flex: 1 }}>
            <Card.Content style={{ paddingVertical: 10, alignItems: 'center' }}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Vehicles
              </Text>
              <Text style={{ textAlign: 'center' }}>{details.vehicleCount}</Text>
            </Card.Content>
          </Card>

          <Card mode="outlined" style={{ flex: 1 }}>
            <Card.Content style={{ paddingVertical: 10, alignItems: 'center' }}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Stops
              </Text>
              <Text style={{ textAlign: 'center' }}>{details.stopsCount}</Text>
            </Card.Content>
          </Card>

          <Card mode="outlined" style={{ flex: 1 }}>
            <Card.Content style={{ paddingVertical: 10, alignItems: 'center' }}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Trip
              </Text>
              <Text numberOfLines={1} style={{ textAlign: 'center' }}>{`${details.trip.timeLabel} / ${details.trip.distLabel}`}</Text>
            </Card.Content>
          </Card>
        </View>
      </View>

      {/* Vehicle Carousel */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: carouselBottomOffset,
          height: carouselHeight,
          paddingHorizontal: 2,
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingVertical: 2.5,
          backgroundColor: '#f0f0f000',
        }}
      >
        {/* Carousel List */}
        <FlatList
          style={{ flexGrow: 0 }}
          horizontal
          data={carouselData}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 4, alignItems: 'flex-end', paddingVertical: 0 }}
          renderItem={({ item }) => {
            const active = item.id === activeId;
            return (
              <Pressable
                onPress={() => setActiveId(item.id)}
                accessibilityRole="button"
                accessibilityLabel={item.id === 'fleet' ? 'Fleet routes' : `Route for bus ${item.label}`}
                style={{ alignItems: 'center' }}
              >
                {/* Vehicle selector */}
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 14,
                    backgroundColor: theme.colors.surface,
                    borderWidth: active ? 2 : 1,
                    borderColor: active ? theme.colors.primary : theme.colors.outline,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Vehicle Icon */}
                  <Image source={BUS_ICON} style={{ width: 40, height: 40, resizeMode: 'contain' }} />
                  <View style={{ position: 'absolute', bottom: 10, left: 2, right: 0, alignItems: 'center' }}>
                    <Text variant="labelSmall" style={{ color: 'black' }}>
                      {item.label}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      </View>
    </View>
  );
}
