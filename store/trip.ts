import { create } from 'zustand';

export type TripStatus = 'In Depot' | 'Departed' | 'On Route' | 'Arriving' | 'Completed' | 'Paused';

type TripState = {
  routeId: string;
  vehicleId: string;
  driverName: string;
  status: TripStatus;
  startedAt?: number;
  endedAt?: number;
  currentStopIndex: number;

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
