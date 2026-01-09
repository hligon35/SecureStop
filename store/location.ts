import { create } from 'zustand';

import type { TripStatus } from '@/store/trip';

export type LatLng = { latitude: number; longitude: number };

export type Stop = {
  id: string;
  name: string;
  coordinate: LatLng;
};

export type VehicleLocation = {
  coordinate: LatLng;
  heading?: number;
  updatedAt: number;
};

export type FleetVehicle = {
  id: string;
  badgeNumber: number;
  driverName: string;
  status: TripStatus;
  statusUpdatedAt: number;
  delayMinutes: number;
  vehicleLocation: VehicleLocation;
  routePolyline: LatLng[];
  stops: Stop[];
};

type LocationState = {
  demoFleetOverride?: boolean;
  vehicleId: string;
  vehicleLocation: VehicleLocation;
  routePolyline: LatLng[];
  stops: Stop[];
  userStopId: string;
  fleet: FleetVehicle[];
  setDemoFleetOverride: (next?: boolean) => void;
  setVehicleLocation: (next: VehicleLocation) => void;
  setFleetVehicleLocation: (vehicleId: string, next: VehicleLocation) => void;
  setFleetVehicleOperational: (vehicleId: string, next: { status: TripStatus; delayMinutes: number }) => void;
  setUserStopId: (stopId: string) => void;
};

const mockRoute: LatLng[] = [
  { latitude: 40.758, longitude: -73.9855 },
  { latitude: 40.7572, longitude: -73.98 },
  { latitude: 40.7545, longitude: -73.977 },
  { latitude: 40.7503, longitude: -73.975 },
];

const mockStops: Stop[] = [
  { id: 'stop-1', name: '8th Ave', coordinate: mockRoute[0] },
  { id: 'stop-2', name: 'Broadway', coordinate: mockRoute[1] },
  { id: 'stop-3', name: '5th Ave', coordinate: mockRoute[2] },
  { id: 'stop-4', name: 'Terminal', coordinate: mockRoute[3] },
];

function offsetRoute(route: LatLng[], deltaLat: number, deltaLng: number): LatLng[] {
  return route.map((p) => ({ latitude: p.latitude + deltaLat, longitude: p.longitude + deltaLng }));
}

function offsetStops(stops: Stop[], deltaLat: number, deltaLng: number): Stop[] {
  return stops.map((s) => ({
    ...s,
    coordinate: { latitude: s.coordinate.latitude + deltaLat, longitude: s.coordinate.longitude + deltaLng },
  }));
}

const mockFleet: FleetVehicle[] = [
  {
    id: 'bus-74',
    badgeNumber: 74,
    driverName: 'A. Johnson',
    status: 'On Route',
    statusUpdatedAt: Date.now(),
    delayMinutes: 0,
    vehicleLocation: { coordinate: mockRoute[0], updatedAt: Date.now(), heading: 90 },
    routePolyline: mockRoute,
    stops: mockStops,
  },
  {
    id: 'bus-12',
    badgeNumber: 12,
    driverName: 'S. Rivera',
    status: 'On Route',
    statusUpdatedAt: Date.now(),
    delayMinutes: 6,
    vehicleLocation: {
      coordinate: { latitude: mockRoute[0].latitude + 0.002, longitude: mockRoute[0].longitude - 0.002 },
      updatedAt: Date.now(),
      heading: 90,
    },
    routePolyline: offsetRoute(mockRoute, 0.002, -0.002),
    stops: offsetStops(mockStops, 0.002, -0.002),
  },
  {
    id: 'bus-33',
    badgeNumber: 33,
    driverName: 'M. Chen',
    status: 'In Depot',
    statusUpdatedAt: Date.now(),
    delayMinutes: 0,
    vehicleLocation: {
      coordinate: { latitude: mockRoute[0].latitude - 0.002, longitude: mockRoute[0].longitude + 0.002 },
      updatedAt: Date.now(),
      heading: 90,
    },
    routePolyline: offsetRoute(mockRoute, -0.002, 0.002),
    stops: offsetStops(mockStops, -0.002, 0.002),
  },
  {
    id: 'bus-88',
    badgeNumber: 88,
    driverName: 'D. Patel',
    status: 'On Route',
    statusUpdatedAt: Date.now(),
    delayMinutes: 0,
    vehicleLocation: {
      coordinate: { latitude: mockRoute[0].latitude + 0.0015, longitude: mockRoute[0].longitude + 0.0025 },
      updatedAt: Date.now(),
      heading: 90,
    },
    routePolyline: offsetRoute(mockRoute, 0.0015, 0.0025),
    stops: offsetStops(mockStops, 0.0015, 0.0025),
  },
  {
    id: 'bus-45',
    badgeNumber: 45,
    driverName: 'K. Brooks',
    status: 'On Route',
    statusUpdatedAt: Date.now(),
    delayMinutes: 3,
    vehicleLocation: {
      coordinate: { latitude: mockRoute[0].latitude + 0.003, longitude: mockRoute[0].longitude + 0.001 },
      updatedAt: Date.now(),
      heading: 90,
    },
    routePolyline: offsetRoute(mockRoute, 0.003, 0.001),
    stops: offsetStops(mockStops, 0.003, 0.001),
  },
  {
    id: 'bus-19',
    badgeNumber: 19,
    driverName: 'R. Nguyen',
    status: 'On Route',
    statusUpdatedAt: Date.now(),
    delayMinutes: 0,
    vehicleLocation: {
      coordinate: { latitude: mockRoute[0].latitude - 0.003, longitude: mockRoute[0].longitude - 0.001 },
      updatedAt: Date.now(),
      heading: 90,
    },
    routePolyline: offsetRoute(mockRoute, -0.003, -0.001),
    stops: offsetStops(mockStops, -0.003, -0.001),
  },
  {
    id: 'bus-52',
    badgeNumber: 52,
    driverName: 'L. Garcia',
    status: 'On Route',
    statusUpdatedAt: Date.now(),
    delayMinutes: 9,
    vehicleLocation: {
      coordinate: { latitude: mockRoute[0].latitude - 0.001, longitude: mockRoute[0].longitude - 0.003 },
      updatedAt: Date.now(),
      heading: 90,
    },
    routePolyline: offsetRoute(mockRoute, -0.001, -0.003),
    stops: offsetStops(mockStops, -0.001, -0.003),
  },
  {
    id: 'bus-7',
    badgeNumber: 7,
    driverName: 'T. Williams',
    status: 'In Depot',
    statusUpdatedAt: Date.now(),
    delayMinutes: 0,
    vehicleLocation: {
      coordinate: { latitude: mockRoute[0].latitude + 0.004, longitude: mockRoute[0].longitude - 0.0025 },
      updatedAt: Date.now(),
      heading: 90,
    },
    routePolyline: offsetRoute(mockRoute, 0.004, -0.0025),
    stops: offsetStops(mockStops, 0.004, -0.0025),
  },
  {
    id: 'bus-5',
    badgeNumber: 5,
    driverName: 'J. Adams',
    status: 'On Route',
    statusUpdatedAt: Date.now(),
    delayMinutes: 2,
    vehicleLocation: {
      coordinate: { latitude: mockRoute[0].latitude + 0.001, longitude: mockRoute[0].longitude + 0.0005 },
      updatedAt: Date.now(),
      heading: 90,
    },
    routePolyline: offsetRoute(mockRoute, 0.001, 0.0005),
    stops: offsetStops(mockStops, 0.001, 0.0005),
  },
  {
    id: 'bus-9',
    badgeNumber: 9,
    driverName: 'E. Scott',
    status: 'On Route',
    statusUpdatedAt: Date.now(),
    delayMinutes: 0,
    vehicleLocation: {
      coordinate: { latitude: mockRoute[0].latitude - 0.0008, longitude: mockRoute[0].longitude + 0.0012 },
      updatedAt: Date.now(),
      heading: 90,
    },
    routePolyline: offsetRoute(mockRoute, -0.0008, 0.0012),
    stops: offsetStops(mockStops, -0.0008, 0.0012),
  },
  {
    id: 'bus-10',
    badgeNumber: 10,
    driverName: 'N. Clark',
    status: 'On Route',
    statusUpdatedAt: Date.now(),
    delayMinutes: 4,
    vehicleLocation: {
      coordinate: { latitude: mockRoute[0].latitude + 0.0022, longitude: mockRoute[0].longitude + 0.0016 },
      updatedAt: Date.now(),
      heading: 90,
    },
    routePolyline: offsetRoute(mockRoute, 0.0022, 0.0016),
    stops: offsetStops(mockStops, 0.0022, 0.0016),
  },
  {
    id: 'bus-11',
    badgeNumber: 11,
    driverName: 'P. Reed',
    status: 'On Route',
    statusUpdatedAt: Date.now(),
    delayMinutes: 1,
    vehicleLocation: {
      coordinate: { latitude: mockRoute[0].latitude - 0.0014, longitude: mockRoute[0].longitude - 0.0011 },
      updatedAt: Date.now(),
      heading: 90,
    },
    routePolyline: offsetRoute(mockRoute, -0.0014, -0.0011),
    stops: offsetStops(mockStops, -0.0014, -0.0011),
  },
  {
    id: 'bus-13',
    badgeNumber: 13,
    driverName: 'C. Hill',
    status: 'On Route',
    statusUpdatedAt: Date.now(),
    delayMinutes: 0,
    vehicleLocation: {
      coordinate: { latitude: mockRoute[0].latitude + 0.0032, longitude: mockRoute[0].longitude - 0.0006 },
      updatedAt: Date.now(),
      heading: 90,
    },
    routePolyline: offsetRoute(mockRoute, 0.0032, -0.0006),
    stops: offsetStops(mockStops, 0.0032, -0.0006),
  },
  {
    id: 'bus-14',
    badgeNumber: 14,
    driverName: 'V. Flores',
    status: 'In Depot',
    statusUpdatedAt: Date.now(),
    delayMinutes: 0,
    vehicleLocation: {
      coordinate: { latitude: mockRoute[0].latitude - 0.0036, longitude: mockRoute[0].longitude + 0.0009 },
      updatedAt: Date.now(),
      heading: 90,
    },
    routePolyline: offsetRoute(mockRoute, -0.0036, 0.0009),
    stops: offsetStops(mockStops, -0.0036, 0.0009),
  },
  {
    id: 'bus-15',
    badgeNumber: 15,
    driverName: 'B. James',
    status: 'On Route',
    statusUpdatedAt: Date.now(),
    delayMinutes: 7,
    vehicleLocation: {
      coordinate: { latitude: mockRoute[0].latitude + 0.0004, longitude: mockRoute[0].longitude - 0.0034 },
      updatedAt: Date.now(),
      heading: 90,
    },
    routePolyline: offsetRoute(mockRoute, 0.0004, -0.0034),
    stops: offsetStops(mockStops, 0.0004, -0.0034),
  },
  {
    id: 'bus-16',
    badgeNumber: 16,
    driverName: 'H. Parker',
    status: 'On Route',
    statusUpdatedAt: Date.now(),
    delayMinutes: 0,
    vehicleLocation: {
      coordinate: { latitude: mockRoute[0].latitude + 0.0028, longitude: mockRoute[0].longitude - 0.0031 },
      updatedAt: Date.now(),
      heading: 90,
    },
    routePolyline: offsetRoute(mockRoute, 0.0028, -0.0031),
    stops: offsetStops(mockStops, 0.0028, -0.0031),
  },
  {
    id: 'bus-18',
    badgeNumber: 18,
    driverName: 'S. Howard',
    status: 'On Route',
    statusUpdatedAt: Date.now(),
    delayMinutes: 5,
    vehicleLocation: {
      coordinate: { latitude: mockRoute[0].latitude - 0.0026, longitude: mockRoute[0].longitude + 0.003 },
      updatedAt: Date.now(),
      heading: 90,
    },
    routePolyline: offsetRoute(mockRoute, -0.0026, 0.003),
    stops: offsetStops(mockStops, -0.0026, 0.003),
  },
  {
    id: 'bus-20',
    badgeNumber: 20,
    driverName: 'I. Moore',
    status: 'On Route',
    statusUpdatedAt: Date.now(),
    delayMinutes: 0,
    vehicleLocation: {
      coordinate: { latitude: mockRoute[0].latitude - 0.0018, longitude: mockRoute[0].longitude + 0.0035 },
      updatedAt: Date.now(),
      heading: 90,
    },
    routePolyline: offsetRoute(mockRoute, -0.0018, 0.0035),
    stops: offsetStops(mockStops, -0.0018, 0.0035),
  },
  {
    id: 'bus-21',
    badgeNumber: 21,
    driverName: 'G. Price',
    status: 'Arriving',
    statusUpdatedAt: Date.now(),
    delayMinutes: 0,
    vehicleLocation: {
      coordinate: { latitude: mockRoute[0].latitude + 0.0042, longitude: mockRoute[0].longitude + 0.0019 },
      updatedAt: Date.now(),
      heading: 90,
    },
    routePolyline: offsetRoute(mockRoute, 0.0042, 0.0019),
    stops: offsetStops(mockStops, 0.0042, 0.0019),
  },
  {
    id: 'bus-22',
    badgeNumber: 22,
    driverName: 'D. Cox',
    status: 'On Route',
    statusUpdatedAt: Date.now(),
    delayMinutes: 3,
    vehicleLocation: {
      coordinate: { latitude: mockRoute[0].latitude + 0.0039, longitude: mockRoute[0].longitude - 0.0018 },
      updatedAt: Date.now(),
      heading: 90,
    },
    routePolyline: offsetRoute(mockRoute, 0.0039, -0.0018),
    stops: offsetStops(mockStops, 0.0039, -0.0018),
  },
];

export const useLocationStore = create<LocationState>((set) => ({
  demoFleetOverride: undefined,
  vehicleId: 'bus-12',
  vehicleLocation: {
    coordinate: mockRoute[0],
    updatedAt: Date.now(),
    heading: 90,
  },
  routePolyline: mockRoute,
  stops: mockStops,
  userStopId: 'stop-3',
  fleet: mockFleet,
  setDemoFleetOverride: (next) => set({ demoFleetOverride: next }),
  setVehicleLocation: (next) => set({ vehicleLocation: next }),
  setFleetVehicleLocation: (vehicleId, next) =>
    set((state) => ({
      fleet: state.fleet.map((v) => (v.id === vehicleId ? { ...v, vehicleLocation: next } : v)),
    })),
  setFleetVehicleOperational: (vehicleId, next) =>
    set((state) => ({
      fleet: state.fleet.map((v) => {
        if (v.id !== vehicleId) return v;
        const statusChanged = v.status !== next.status;
        return {
          ...v,
          status: next.status,
          delayMinutes: next.delayMinutes,
          statusUpdatedAt: statusChanged ? Date.now() : v.statusUpdatedAt,
        };
      }),
    })),
  setUserStopId: (stopId) => set({ userStopId: stopId }),
}));
