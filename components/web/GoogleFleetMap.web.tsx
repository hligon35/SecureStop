import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { loadGoogleMapsJsApi } from '@/lib/web/googleMaps';
import { useLocationStore } from '@/store/location';
import { useTripStore } from '@/store/trip';

export type VehicleIconType = 'school_bus' | 'transit_bus' | 'box_truck' | 'semi_truck' | 'limo';

const markerLabelByType: Record<VehicleIconType, string> = {
  school_bus: 'SB',
  transit_bus: 'TB',
  box_truck: 'BX',
  semi_truck: 'SE',
  limo: 'LM',
};

const markerColorByType: Record<VehicleIconType, string> = {
  school_bus: '#1E88E5',
  transit_bus: '#43A047',
  box_truck: '#6D4C41',
  semi_truck: '#5E35B1',
  limo: '#000000',
};

// Optional: provide real icon URLs later (PNG/SVG). When undefined, we fall back to labeled symbols.
const iconUrlByType: Partial<Record<VehicleIconType, string>> = {
  // school_bus: 'https://.../school-bus.png',
  // transit_bus: 'https://.../transit-bus.png',
  // box_truck: 'https://.../box-truck.png',
  // semi_truck: 'https://.../semi-truck.png',
  // limo: 'https://.../limo.png',
};

function buildMarkerIcon(params: {
  maps: any;
  type: VehicleIconType;
  heading?: number;
}): any {
  const { maps, type, heading } = params;

  const iconUrl = iconUrlByType[type];
  if (iconUrl) {
    return {
      url: iconUrl,
      scaledSize: new maps.Size(36, 36),
      anchor: new maps.Point(18, 18),
    };
  }

  // Fallback: a simple symbol + label. This keeps the implementation flexible
  // without requiring us to ship a new icon set right now.
  return {
    path: maps.SymbolPath.CIRCLE,
    fillColor: markerColorByType[type],
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: 10,
    rotation: typeof heading === 'number' ? heading : 0,
  };
}

export function GoogleFleetMap(props: { height?: number; vehicleType?: VehicleIconType }) {
  const height = props.height ?? 420;

  const coordinate = useLocationStore((s) => s.vehicleLocation.coordinate);
  const heading = useLocationStore((s) => s.vehicleLocation.heading);
  const tripVehicleId = useTripStore((s) => s.vehicleId);

  const vehicleType = useMemo<VehicleIconType>(() => {
    // If caller provided, honor it.
    if (props.vehicleType) return props.vehicleType;

    // Minimal heuristic (can be replaced with real vehicle metadata later)
    const id = (tripVehicleId ?? '').toLowerCase();
    if (id.includes('limo')) return 'limo';
    if (id.includes('semi')) return 'semi_truck';
    if (id.includes('truck')) return 'box_truck';
    return 'school_bus';
  }, [props.vehicleType, tripVehicleId]);

  const containerRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'no-key' | 'error'>('idle');

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setStatus('loading');
      try {
        const { google, apiKey } = await loadGoogleMapsJsApi();
        if (!apiKey) {
          if (!cancelled) setStatus('no-key');
          return;
        }

        if (cancelled) return;
        const containerEl = containerRef.current as HTMLElement | null;
        if (!containerEl) return;

        const center = { lat: coordinate.latitude, lng: coordinate.longitude };

        const map = new google.maps.Map(containerEl, {
          center,
          zoom: 13,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
        });

        const marker = new google.maps.Marker({
          map,
          position: center,
          title: tripVehicleId,
          label: {
            text: markerLabelByType[vehicleType],
            color: '#ffffff',
            fontWeight: '700',
          },
          icon: buildMarkerIcon({ maps: google.maps, type: vehicleType, heading }),
        });

        mapRef.current = map;
        markerRef.current = marker;

        if (!cancelled) setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    init();

    return () => {
      cancelled = true;
      markerRef.current = null;
      mapRef.current = null;
    };
    // Intentionally only on mount: we update marker in a separate effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    const googleAny = (window as any).google;
    const mapsAny = googleAny?.maps;
    if (!mapsAny) return;

    const pos = { lat: coordinate.latitude, lng: coordinate.longitude };
    marker.setPosition(pos);
    marker.setTitle(tripVehicleId);
    marker.setLabel({
      text: markerLabelByType[vehicleType],
      color: '#ffffff',
      fontWeight: '700',
    });
    marker.setIcon(buildMarkerIcon({ maps: mapsAny, type: vehicleType, heading }));
  }, [coordinate.latitude, coordinate.longitude, heading, tripVehicleId, vehicleType]);

  if (status === 'no-key') {
    return (
      <Card>
        <Card.Title title="Live Map" subtitle="Google Maps JS" />
        <Card.Content>
          <Text>
            Missing Google Maps API key. Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY (recommended) or
            expo.extra.googleMapsApiKey.
          </Text>
        </Card.Content>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card>
        <Card.Title title="Live Map" subtitle="Google Maps JS" />
        <Card.Content>
          <Text>Failed to load Google Maps. Check your API key and network access.</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <View style={{ height, borderRadius: 12, overflow: 'hidden' }}>
      <View ref={containerRef} style={{ flex: 1 }} collapsable={false} />
    </View>
  );
}
