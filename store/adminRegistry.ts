import { create } from 'zustand';

import { getJson, setJson } from '@/lib/storage/kv';

export type VehicleStatus = 'active' | 'maintenance' | 'inactive';

export type VehicleRecord = {
  id: string;
  label: string;
  status: VehicleStatus;
  assignedRouteId?: string;
};

export type DriverRecord = {
  id: string;
  name: string;
  licenseId?: string;
  phone?: string;
  active: boolean;
  assignedVehicleId?: string;
};

export type StudentRecord = {
  id: string;
  name: string;
  grade?: string;
  parentName?: string;
  stopName?: string;
  active: boolean;
};

export type RouteRecord = {
  id: string;
  name: string;
  active: boolean;
  vehicleId?: string;
  driverId?: string;
};

type TenantRegistry = {
  vehicles: VehicleRecord[];
  drivers: DriverRecord[];
  students: StudentRecord[];
  routes: RouteRecord[];
};

type RegistryState = {
  hydrated: boolean;
  byTenant: Record<string, TenantRegistry>;
  hydrate: () => Promise<void>;
  ensureTenant: (tenantId: string) => void;

  addVehicle: (tenantId: string, v: VehicleRecord) => void;
  updateVehicle: (tenantId: string, id: string, next: Partial<VehicleRecord>) => void;
  deleteVehicle: (tenantId: string, id: string) => void;

  addDriver: (tenantId: string, d: DriverRecord) => void;
  updateDriver: (tenantId: string, id: string, next: Partial<DriverRecord>) => void;
  deleteDriver: (tenantId: string, id: string) => void;

  addStudent: (tenantId: string, s: StudentRecord) => void;
  updateStudent: (tenantId: string, id: string, next: Partial<StudentRecord>) => void;
  deleteStudent: (tenantId: string, id: string) => void;

  addRoute: (tenantId: string, r: RouteRecord) => void;
  updateRoute: (tenantId: string, id: string, next: Partial<RouteRecord>) => void;
  deleteRoute: (tenantId: string, id: string) => void;

  resetTenant: (tenantId: string) => void;
};

const KEY = 'securestop.adminRegistry.v1';

function emptyTenant(): TenantRegistry {
  return { vehicles: [], drivers: [], students: [], routes: [] };
}

function persist(byTenant: Record<string, TenantRegistry>) {
  setJson(KEY, { byTenant }).catch(() => {});
}

function seedIfEmpty(reg: TenantRegistry): TenantRegistry {
  if (reg.vehicles.length || reg.drivers.length || reg.students.length || reg.routes.length) return reg;

  return {
    vehicles: [
      { id: 'BUS-12', label: 'Bus 12', status: 'active', assignedRouteId: 'R-101' },
      { id: 'BUS-07', label: 'Bus 07', status: 'maintenance' },
    ],
    drivers: [
      { id: 'D-100', name: 'Alex Driver', active: true, assignedVehicleId: 'BUS-12' },
      { id: 'D-101', name: 'Taylor Driver', active: true },
    ],
    students: [
      { id: 'S-001', name: 'A. Student', grade: '3', parentName: 'P. Parent', stopName: 'Oak St', active: true },
      { id: 'S-002', name: 'B. Student', grade: '5', parentName: 'P. Parent', stopName: 'Pine Ave', active: true },
    ],
    routes: [
      { id: 'R-101', name: 'AM Route 101', active: true, vehicleId: 'BUS-12', driverId: 'D-100' },
      { id: 'R-202', name: 'PM Route 202', active: true },
    ],
  };
}

export const useAdminRegistryStore = create<RegistryState>((set, get) => ({
  hydrated: false,
  byTenant: {},
  hydrate: async () => {
    const data = await getJson<{ byTenant?: Record<string, TenantRegistry> }>(KEY);
    const byTenant = data?.byTenant && typeof data.byTenant === 'object' ? data.byTenant : {};
    set({ byTenant, hydrated: true });
  },
  ensureTenant: (tenantId) => {
    if (!tenantId) return;
    const current = get().byTenant[tenantId];
    if (current) return;
    set((s) => {
      const byTenant = { ...s.byTenant, [tenantId]: seedIfEmpty(emptyTenant()) };
      persist(byTenant);
      return { byTenant };
    });
  },

  addVehicle: (tenantId, v) =>
    set((s) => {
      const t = seedIfEmpty(s.byTenant[tenantId] ?? emptyTenant());
      const vehicles = [v, ...t.vehicles.filter((x) => x.id !== v.id)];
      const byTenant = { ...s.byTenant, [tenantId]: { ...t, vehicles } };
      persist(byTenant);
      return { byTenant };
    }),
  updateVehicle: (tenantId, id, next) =>
    set((s) => {
      const t = seedIfEmpty(s.byTenant[tenantId] ?? emptyTenant());
      const vehicles = t.vehicles.map((x) => (x.id === id ? { ...x, ...next } : x));
      const byTenant = { ...s.byTenant, [tenantId]: { ...t, vehicles } };
      persist(byTenant);
      return { byTenant };
    }),
  deleteVehicle: (tenantId, id) =>
    set((s) => {
      const t = seedIfEmpty(s.byTenant[tenantId] ?? emptyTenant());
      const vehicles = t.vehicles.filter((x) => x.id !== id);
      const byTenant = { ...s.byTenant, [tenantId]: { ...t, vehicles } };
      persist(byTenant);
      return { byTenant };
    }),

  addDriver: (tenantId, d) =>
    set((s) => {
      const t = seedIfEmpty(s.byTenant[tenantId] ?? emptyTenant());
      const drivers = [d, ...t.drivers.filter((x) => x.id !== d.id)];
      const byTenant = { ...s.byTenant, [tenantId]: { ...t, drivers } };
      persist(byTenant);
      return { byTenant };
    }),
  updateDriver: (tenantId, id, next) =>
    set((s) => {
      const t = seedIfEmpty(s.byTenant[tenantId] ?? emptyTenant());
      const drivers = t.drivers.map((x) => (x.id === id ? { ...x, ...next } : x));
      const byTenant = { ...s.byTenant, [tenantId]: { ...t, drivers } };
      persist(byTenant);
      return { byTenant };
    }),
  deleteDriver: (tenantId, id) =>
    set((s) => {
      const t = seedIfEmpty(s.byTenant[tenantId] ?? emptyTenant());
      const drivers = t.drivers.filter((x) => x.id !== id);
      const byTenant = { ...s.byTenant, [tenantId]: { ...t, drivers } };
      persist(byTenant);
      return { byTenant };
    }),

  addStudent: (tenantId, st) =>
    set((s) => {
      const t = seedIfEmpty(s.byTenant[tenantId] ?? emptyTenant());
      const students = [st, ...t.students.filter((x) => x.id !== st.id)];
      const byTenant = { ...s.byTenant, [tenantId]: { ...t, students } };
      persist(byTenant);
      return { byTenant };
    }),
  updateStudent: (tenantId, id, next) =>
    set((s) => {
      const t = seedIfEmpty(s.byTenant[tenantId] ?? emptyTenant());
      const students = t.students.map((x) => (x.id === id ? { ...x, ...next } : x));
      const byTenant = { ...s.byTenant, [tenantId]: { ...t, students } };
      persist(byTenant);
      return { byTenant };
    }),
  deleteStudent: (tenantId, id) =>
    set((s) => {
      const t = seedIfEmpty(s.byTenant[tenantId] ?? emptyTenant());
      const students = t.students.filter((x) => x.id !== id);
      const byTenant = { ...s.byTenant, [tenantId]: { ...t, students } };
      persist(byTenant);
      return { byTenant };
    }),

  addRoute: (tenantId, r) =>
    set((s) => {
      const t = seedIfEmpty(s.byTenant[tenantId] ?? emptyTenant());
      const routes = [r, ...t.routes.filter((x) => x.id !== r.id)];
      const byTenant = { ...s.byTenant, [tenantId]: { ...t, routes } };
      persist(byTenant);
      return { byTenant };
    }),
  updateRoute: (tenantId, id, next) =>
    set((s) => {
      const t = seedIfEmpty(s.byTenant[tenantId] ?? emptyTenant());
      const routes = t.routes.map((x) => (x.id === id ? { ...x, ...next } : x));
      const byTenant = { ...s.byTenant, [tenantId]: { ...t, routes } };
      persist(byTenant);
      return { byTenant };
    }),
  deleteRoute: (tenantId, id) =>
    set((s) => {
      const t = seedIfEmpty(s.byTenant[tenantId] ?? emptyTenant());
      const routes = t.routes.filter((x) => x.id !== id);
      const byTenant = { ...s.byTenant, [tenantId]: { ...t, routes } };
      persist(byTenant);
      return { byTenant };
    }),

  resetTenant: (tenantId) =>
    set((s) => {
      const byTenant = { ...s.byTenant, [tenantId]: seedIfEmpty(emptyTenant()) };
      persist(byTenant);
      return { byTenant };
    }),
}));
