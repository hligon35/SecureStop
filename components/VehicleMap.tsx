import { useEffect, useMemo, useRef } from 'react';
import MapView, { AnimatedRegion, Marker, Polyline, type Region } from 'react-native-maps';

import type { LatLng, Stop } from '@/store/location';

type Props = {
  vehicle: LatLng;
  route: LatLng[];
  stops: Stop[];
  userStopId?: string;
  mode?: 'vehicle' | 'fleet';
  fleetVehicles?: Array<{ id: string; coordinate: LatLng; title?: string }>;
  fleetRoutes?: LatLng[][];
};

export function VehicleMap(props: Props) {
  const mode = props.mode ?? 'vehicle';

  const baseCoordinate = useMemo(() => {
    if (mode === 'fleet') return props.fleetVehicles?.[0]?.coordinate ?? props.vehicle;
    return props.vehicle;
  }, [mode, props.fleetVehicles, props.vehicle]);

  const animatedVehicle = useRef(
    new AnimatedRegion({
      latitude: props.vehicle.latitude,
      longitude: props.vehicle.longitude,
      latitudeDelta: 0,
      longitudeDelta: 0,
    })
  ).current;

  const initialRegion: Region = useMemo(
    () => ({
      latitude: baseCoordinate.latitude,
      longitude: baseCoordinate.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }),
    [baseCoordinate.latitude, baseCoordinate.longitude]
  );

  useEffect(() => {
    if (mode !== 'vehicle') return;

    animatedVehicle
      .timing(
        {
          latitude: props.vehicle.latitude,
          longitude: props.vehicle.longitude,
          duration: 900,
          useNativeDriver: false,
        } as any
      )
      .start();
  }, [animatedVehicle, mode, props.vehicle.latitude, props.vehicle.longitude]);

  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={initialRegion}
      accessibilityLabel="Vehicle map"
    >
      {mode === 'fleet' && props.fleetRoutes?.length
        ? props.fleetRoutes.map((r, idx) => (r.length ? <Polyline key={`fleet-route-${idx}`} coordinates={r} strokeWidth={3} /> : null))
        : null}

      {props.route.length > 0 ? <Polyline coordinates={props.route} strokeWidth={4} /> : null}

      {props.stops.map((s) => (
        <Marker
          key={s.id}
          coordinate={s.coordinate}
          title={s.name}
          accessibilityLabel={s.id === props.userStopId ? 'Your stop' : 'Stop marker'}
        />
      ))}

      {mode === 'fleet' && props.fleetVehicles?.length
        ? props.fleetVehicles.map((v) => (
            <Marker
              key={v.id}
              coordinate={v.coordinate}
              title={v.title ?? v.id}
              accessibilityLabel="Fleet vehicle marker"
            />
          ))
        : null}

      {mode === 'vehicle' ? (
        <Marker.Animated
          coordinate={animatedVehicle as any}
          title="Bus"
          accessibilityLabel="Bus marker"
        />
      ) : null}
    </MapView>
  );
}
