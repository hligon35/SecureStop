import { create } from 'zustand';

export type TripStatus = 'In Depot' | 'Departed' | 'On Route' | 'Arriving' | 'Completed' | 'Paused';

export type TripScanCategory = 'public-transit-passengers' | 'school-student-ids' | 'private-misc';

export type TripScanEvent = {
  id: string;
  scannedAt: number;
  scannedId: string;
  category: TripScanCategory;
  driverName: string;
  stopIndex?: number;
  note?: string;
};

type TripState = {
  routeId: string;
  vehicleId: string;
  driverName: string;
  status: TripStatus;
  startedAt?: number;
  endedAt?: number;
  currentStopIndex: number;

  setVehicleId: (vehicleId: string) => void;

  scans: TripScanEvent[];

  addScan: (scan: Omit<TripScanEvent, 'id'> & { id?: string }) => void;

  startTrip: () => void;
  pauseTrip: () => void;
  endTrip: () => void;
  setStatus: (status: TripStatus) => void;
  setCurrentStopIndex: (index: number) => void;
};

export const useTripStore = create<TripState>((set, get) => ({
  routeId: 'route-21',
  vehicleId: 'bus-12',
  driverName: 'Driver (mock)',
  status: 'In Depot',
  startedAt: undefined,
  endedAt: undefined,
  currentStopIndex: 0,

  setVehicleId: (vehicleId) => set({ vehicleId }),

  scans: [
    {
      id: 'scan-1',
      scannedAt: Date.now() - 1000 * 60 * 8,
      scannedId: 'STU-104239',
      category: 'school-student-ids',
      driverName: 'Driver (mock)',
      stopIndex: 2,
      note: 'Student boarding',
    },
    {
      id: 'scan-2',
      scannedAt: Date.now() - 1000 * 60 * 5,
      scannedId: 'PASS-889120',
      category: 'public-transit-passengers',
      driverName: 'Driver (mock)',
      stopIndex: 3,
      note: 'Transit pass validated',
    },
    {
      id: 'scan-3',
      scannedAt: Date.now() - 1000 * 60 * 2,
      scannedId: 'MISC-00073',
      category: 'private-misc',
      driverName: 'Driver (mock)',
      stopIndex: 3,
      note: 'Misc private scan',
    },
  ],

  addScan: (scan) => {
    const id = scan.id ?? `scan-${Date.now()}`;
    set((state) => ({
      scans: [{ ...scan, id }, ...state.scans],
    }));
  },

  startTrip: () =>
    set({
      status: 'On Route',
      startedAt: get().startedAt ?? Date.now(),
      endedAt: undefined,
    }),
  pauseTrip: () => set({ status: 'Paused' }),
  endTrip: () => set({ status: 'Completed', endedAt: Date.now() }),
  setStatus: (status) => set({ status }),
  setCurrentStopIndex: (index) => set({ currentStopIndex: Math.max(0, index) }),
}));
