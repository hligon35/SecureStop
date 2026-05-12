import { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { Card, Text } from "react-native-paper";

import { loadGoogleMapsJsApi } from "@/lib/web/googleMaps";
import type { LatLng, Stop } from "@/store/location";

type Props = {
  vehicle: LatLng;
  route: LatLng[];
  stops: Stop[];
  userStopId?: string;
  mode?: "vehicle" | "fleet";
  fleetVehicles?: Array<{ id: string; coordinate: LatLng; title?: string }>;
  fleetRoutes?: LatLng[][];
};

type GoogleOverlayState = {
  routePolylines: any[];
  stopMarkers: any[];
  fleetMarkers: any[];
  vehicleMarker: any | null;
};

function toGoogleLatLng(point: LatLng) {
  return { lat: point.latitude, lng: point.longitude };
}

function clearOverlays(overlays: GoogleOverlayState) {
  overlays.routePolylines.forEach((polyline) => polyline.setMap(null));
  overlays.stopMarkers.forEach((marker) => marker.setMap(null));
  overlays.fleetMarkers.forEach((marker) => marker.setMap(null));
  overlays.vehicleMarker?.setMap(null);
  overlays.routePolylines = [];
  overlays.stopMarkers = [];
  overlays.fleetMarkers = [];
  overlays.vehicleMarker = null;
}

export function VehicleMap(props: Props) {
  const mode = props.mode ?? "vehicle";
  const containerRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<GoogleOverlayState>({
    routePolylines: [],
    stopMarkers: [],
    fleetMarkers: [],
    vehicleMarker: null,
  });
  const [status, setStatus] = useState<
    "idle" | "loading" | "ready" | "no-key" | "error"
  >("idle");

  const baseCoordinate = useMemo(() => {
    if (mode === "fleet")
      return props.fleetVehicles?.[0]?.coordinate ?? props.vehicle;
    return props.vehicle;
  }, [mode, props.fleetVehicles, props.vehicle]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setStatus("loading");
      try {
        const { google, apiKey } = await loadGoogleMapsJsApi();
        if (!apiKey) {
          if (!cancelled) setStatus("no-key");
          return;
        }

        if (cancelled) return;

        const containerEl = containerRef.current as HTMLElement | null;
        if (!containerEl) return;

        const map = new google.maps.Map(containerEl, {
          center: toGoogleLatLng(baseCoordinate),
          zoom: 13,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
        });

        mapRef.current = map;
        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    init();

    return () => {
      cancelled = true;
      clearOverlays(overlaysRef.current);
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (status !== "ready") return;

    const map = mapRef.current;
    const mapsAny = (window as any).google?.maps;
    if (!map || !mapsAny) return;

    clearOverlays(overlaysRef.current);

    const bounds = new mapsAny.LatLngBounds();
    let hasBounds = false;
    const extendBounds = (point: LatLng) => {
      bounds.extend(toGoogleLatLng(point));
      hasBounds = true;
    };

    const addPolyline = (
      coordinates: LatLng[],
      color: string,
      weight: number,
    ) => {
      if (!coordinates.length) return;

      coordinates.forEach(extendBounds);
      const polyline = new mapsAny.Polyline({
        map,
        path: coordinates.map(toGoogleLatLng),
        strokeColor: color,
        strokeOpacity: 0.95,
        strokeWeight: weight,
      });
      overlaysRef.current.routePolylines.push(polyline);
    };

    if (mode === "fleet") {
      props.fleetRoutes?.forEach((fleetRoute) =>
        addPolyline(fleetRoute, "#1D4ED8", 3),
      );
    }

    addPolyline(props.route, "#0F766E", 4);

    props.stops.forEach((stop) => {
      extendBounds(stop.coordinate);
      const marker = new mapsAny.Marker({
        map,
        position: toGoogleLatLng(stop.coordinate),
        title: stop.name,
        label: stop.id === props.userStopId ? "You" : undefined,
      });
      overlaysRef.current.stopMarkers.push(marker);
    });

    if (mode === "fleet") {
      props.fleetVehicles?.forEach((fleetVehicle) => {
        extendBounds(fleetVehicle.coordinate);
        const marker = new mapsAny.Marker({
          map,
          position: toGoogleLatLng(fleetVehicle.coordinate),
          title: fleetVehicle.title ?? fleetVehicle.id,
          label: "Bus",
        });
        overlaysRef.current.fleetMarkers.push(marker);
      });
    } else {
      extendBounds(props.vehicle);
      overlaysRef.current.vehicleMarker = new mapsAny.Marker({
        map,
        position: toGoogleLatLng(props.vehicle),
        title: "Bus",
        label: "Bus",
      });
    }

    if (hasBounds) {
      map.fitBounds(bounds, 48);
      const listener = mapsAny.event.addListenerOnce(
        map,
        "bounds_changed",
        () => {
          if ((map.getZoom?.() ?? 0) > 15) {
            map.setZoom(15);
          }
        },
      );
      return () => listener?.remove?.();
    }

    map.setCenter(toGoogleLatLng(baseCoordinate));
    map.setZoom(13);
    return undefined;
  }, [
    baseCoordinate,
    mode,
    props.fleetRoutes,
    props.fleetVehicles,
    props.route,
    props.stops,
    props.userStopId,
    props.vehicle,
    status,
  ]);

  if (status === "no-key") {
    return (
      <Card>
        <Card.Title title="Live Map" subtitle="Google Maps JS" />
        <Card.Content>
          <Text>
            Missing Google Maps API key. Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY or
            expo.extra.googleMapsApiKey.
          </Text>
        </Card.Content>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card>
        <Card.Title title="Live Map" subtitle="Google Maps JS" />
        <Card.Content>
          <Text>
            Failed to load Google Maps. Check your API key and network access.
          </Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View
        ref={containerRef}
        style={{ flex: 1, minHeight: 320 }}
        collapsable={false}
      />
    </View>
  );
}
