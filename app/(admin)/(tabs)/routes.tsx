import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';

import {
  VEHICLE_CAROUSEL_BOTTOM_OFFSET,
  VEHICLE_CAROUSEL_HEIGHT,
  VehicleCarousel,
} from '@/components/VehicleCarousel';
import { VehicleMap } from '@/components/VehicleMap';
import type { LatLng, Stop } from '@/store/location';
import { useLocationStore } from '@/store/location';

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

function formatTripSummary(params: {
  distanceKm: number;
  averageSpeedKph?: number;
}): {
  minutes: number;
  miles: number;
  timeLabel: string;
  distLabel: string;
} {
  const speed = Math.max(5, params.averageSpeedKph ?? 25);
  const hours = params.distanceKm / speed;
  const minutes = Math.max(1, Math.round(hours * 60));
  const miles = params.distanceKm * 0.621371;

  return {
    minutes,
    miles,
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
      const totalDistanceKm = fleet.reduce((acc, v) => acc + routeDistanceKm(v.routePolyline), 0);
      const trip = formatTripSummary({ distanceKm: totalDistanceKm });

      const averageDistanceKm = vehicleCount > 0 ? totalDistanceKm / vehicleCount : 0;
      const averageTrip = formatTripSummary({ distanceKm: averageDistanceKm });
      const averageSpeedMph = averageTrip.minutes > 0 ? (averageTrip.miles / (averageTrip.minutes / 60)) : 0;

      return {
        vehicleCount,
        stopsCount,
        trip,
        average: {
          miles: averageTrip.miles,
          minutes: averageTrip.minutes,
          speedMph: averageSpeedMph,
        },
      };
    }
    if (!selectedVehicle) {
      const trip = formatTripSummary({ distanceKm: 0 });
      return { vehicleCount: 0, stopsCount: 0, trip, average: { miles: 0, minutes: 0, speedMph: 0 } };
    }
    const distanceKm = routeDistanceKm(selectedVehicle.routePolyline);
    const trip = formatTripSummary({ distanceKm });

    const averageSpeedMph = trip.minutes > 0 ? (trip.miles / (trip.minutes / 60)) : 0;
    return {
      vehicleCount: 1,
      stopsCount: selectedVehicle.stops.length,
      trip,
      average: {
        miles: trip.miles,
        minutes: trip.minutes,
        speedMph: averageSpeedMph,
      },
    };
  }, [activeId, fleet, selectedVehicle]);

  const carouselData = useMemo(() => [{ id: 'fleet', label: 'Fleet' }, ...fleet.map((v) => ({ id: v.id, label: String(v.badgeNumber) }))], [fleet]);

  const detailsGap = 8;

  const [detailsSectionHeight, setDetailsSectionHeight] = useState(0);

  const mapBottomPadding = useMemo(() => {
    // Reserve space so the map visually ends above the Details strip + carousel + bottom nav.
    return VEHICLE_CAROUSEL_BOTTOM_OFFSET + VEHICLE_CAROUSEL_HEIGHT + detailsGap + detailsSectionHeight;
  }, [detailsGap, detailsSectionHeight]);

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
          bottom: VEHICLE_CAROUSEL_BOTTOM_OFFSET + detailsGap + VEHICLE_CAROUSEL_HEIGHT,
          gap: 6,
        }}
      >
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 2 }}>
          Details
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToAlignment="start"
          snapToInterval={124}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
        >
          <Card mode="outlined" style={{ width: 116 }}>
            <Card.Content style={{ paddingVertical: 6, paddingHorizontal: 2, alignItems: 'center' }}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Vehicles
              </Text>
              <Text style={{ textAlign: 'center' }}>{details.vehicleCount}</Text>
            </Card.Content>
          </Card>

          <Card mode="outlined" style={{ width: 116 }}>
            <Card.Content style={{ paddingVertical: 6, alignItems: 'center' }}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Stops
              </Text>
              <Text style={{ textAlign: 'center' }}>{details.stopsCount}</Text>
            </Card.Content>
          </Card>

          <Card mode="outlined" style={{ width: 116 }}>
            <Card.Content style={{ paddingVertical: 6, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Avg Dist
                </Text>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, opacity: 0.75 }}>
                  mi
                </Text>
              </View>
              <Text style={{ textAlign: 'center' }}>{details.average.miles.toFixed(1)}</Text>
            </Card.Content>
          </Card>

          <Card mode="outlined" style={{ width: 116 }}>
            <Card.Content style={{ paddingVertical: 6, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Avg Time
                </Text>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, opacity: 0.75 }}>
                  min
                </Text>
              </View>
              <Text style={{ textAlign: 'center' }}>{details.average.minutes}</Text>
            </Card.Content>
          </Card>

          <Card mode="outlined" style={{ width: 116 }}>
            <Card.Content style={{ paddingVertical: 6, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Avg Speed
                </Text>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, opacity: 0.75 }}>
                  mph
                </Text>
              </View>
              <Text style={{ textAlign: 'center' }}>{details.average.speedMph.toFixed(1)}</Text>
            </Card.Content>
          </Card>

          <Card mode="outlined" style={{ width: 116 }}>
            <Card.Content style={{ paddingVertical: 6, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Trip
                </Text>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, opacity: 0.75 }}>
                  min/mi
                </Text>
              </View>
              <Text style={{ textAlign: 'center' }}>{`${details.trip.minutes} / ${details.trip.miles.toFixed(1)}`}</Text>
            </Card.Content>
          </Card>
        </ScrollView>
      </View>

      {/* Vehicle Carousel */}
      <VehicleCarousel items={carouselData} activeId={activeId} onSelect={setActiveId} />
    </View>
  );
}
