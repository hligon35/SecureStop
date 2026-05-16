import { create } from "zustand";

import type {
    DriverRecord,
    RouteRecord,
    StudentRecord,
    TenantRegistry,
    VehicleRecord,
    VehicleStatus,
} from "@/core/adminRegistry/types";
import {
    deleteDriverRecord,
    deleteRouteRecord,
    deleteStudentRecord,
    deleteVehicleRecord,
    ensureTenantRegistry,
    loadTenantRegistries,
    resetTenantRegistry,
    saveTenantRegistries,
    updateDriverRecord,
    updateRouteRecord,
    updateStudentRecord,
    updateTenantRegistry,
    updateVehicleRecord,
    upsertDriverRecord,
    upsertRouteRecord,
    upsertStudentRecord,
    upsertVehicleRecord,
} from "@/lib/adminRegistry/localRepository";

type RegistryState = {
  hydrated: boolean;
  byTenant: Record<string, TenantRegistry>;
  hydrate: () => Promise<void>;
  ensureTenant: (tenantId: string) => void;

  addVehicle: (tenantId: string, v: VehicleRecord) => void;
  updateVehicle: (
    tenantId: string,
    id: string,
    next: Partial<VehicleRecord>,
  ) => void;
  deleteVehicle: (tenantId: string, id: string) => void;

  addDriver: (tenantId: string, d: DriverRecord) => void;
  updateDriver: (
    tenantId: string,
    id: string,
    next: Partial<DriverRecord>,
  ) => void;
  deleteDriver: (tenantId: string, id: string) => void;

  addStudent: (tenantId: string, s: StudentRecord) => void;
  updateStudent: (
    tenantId: string,
    id: string,
    next: Partial<StudentRecord>,
  ) => void;
  deleteStudent: (tenantId: string, id: string) => void;

  addRoute: (tenantId: string, r: RouteRecord) => void;
  updateRoute: (
    tenantId: string,
    id: string,
    next: Partial<RouteRecord>,
  ) => void;
  deleteRoute: (tenantId: string, id: string) => void;

  resetTenant: (tenantId: string) => void;
};

export const useAdminRegistryStore = create<RegistryState>((set, get) => ({
  hydrated: false,
  byTenant: {},
  hydrate: async () => {
    const byTenant = await loadTenantRegistries();
    set({ byTenant, hydrated: true });
  },
  ensureTenant: (tenantId) => {
    if (!tenantId) return;
    const current = get().byTenant[tenantId];
    if (current) return;
    set((s) => {
      const byTenant = ensureTenantRegistry(s.byTenant, tenantId);
      saveTenantRegistries(byTenant).catch(() => {});
      return { byTenant };
    });
  },

  addVehicle: (tenantId, v) =>
    set((s) => {
      const byTenant = updateTenantRegistry(s.byTenant, tenantId, (registry) =>
        upsertVehicleRecord(registry, v),
      );
      saveTenantRegistries(byTenant).catch(() => {});
      return { byTenant };
    }),
  updateVehicle: (tenantId, id, next) =>
    set((s) => {
      const byTenant = updateTenantRegistry(s.byTenant, tenantId, (registry) =>
        updateVehicleRecord(registry, id, next),
      );
      saveTenantRegistries(byTenant).catch(() => {});
      return { byTenant };
    }),
  deleteVehicle: (tenantId, id) =>
    set((s) => {
      const byTenant = updateTenantRegistry(s.byTenant, tenantId, (registry) =>
        deleteVehicleRecord(registry, id),
      );
      saveTenantRegistries(byTenant).catch(() => {});
      return { byTenant };
    }),

  addDriver: (tenantId, d) =>
    set((s) => {
      const byTenant = updateTenantRegistry(s.byTenant, tenantId, (registry) =>
        upsertDriverRecord(registry, d),
      );
      saveTenantRegistries(byTenant).catch(() => {});
      return { byTenant };
    }),
  updateDriver: (tenantId, id, next) =>
    set((s) => {
      const byTenant = updateTenantRegistry(s.byTenant, tenantId, (registry) =>
        updateDriverRecord(registry, id, next),
      );
      saveTenantRegistries(byTenant).catch(() => {});
      return { byTenant };
    }),
  deleteDriver: (tenantId, id) =>
    set((s) => {
      const byTenant = updateTenantRegistry(s.byTenant, tenantId, (registry) =>
        deleteDriverRecord(registry, id),
      );
      saveTenantRegistries(byTenant).catch(() => {});
      return { byTenant };
    }),

  addStudent: (tenantId, st) =>
    set((s) => {
      const byTenant = updateTenantRegistry(s.byTenant, tenantId, (registry) =>
        upsertStudentRecord(registry, st),
      );
      saveTenantRegistries(byTenant).catch(() => {});
      return { byTenant };
    }),
  updateStudent: (tenantId, id, next) =>
    set((s) => {
      const byTenant = updateTenantRegistry(s.byTenant, tenantId, (registry) =>
        updateStudentRecord(registry, id, next),
      );
      saveTenantRegistries(byTenant).catch(() => {});
      return { byTenant };
    }),
  deleteStudent: (tenantId, id) =>
    set((s) => {
      const byTenant = updateTenantRegistry(s.byTenant, tenantId, (registry) =>
        deleteStudentRecord(registry, id),
      );
      saveTenantRegistries(byTenant).catch(() => {});
      return { byTenant };
    }),

  addRoute: (tenantId, r) =>
    set((s) => {
      const byTenant = updateTenantRegistry(s.byTenant, tenantId, (registry) =>
        upsertRouteRecord(registry, r),
      );
      saveTenantRegistries(byTenant).catch(() => {});
      return { byTenant };
    }),
  updateRoute: (tenantId, id, next) =>
    set((s) => {
      const byTenant = updateTenantRegistry(s.byTenant, tenantId, (registry) =>
        updateRouteRecord(registry, id, next),
      );
      saveTenantRegistries(byTenant).catch(() => {});
      return { byTenant };
    }),
  deleteRoute: (tenantId, id) =>
    set((s) => {
      const byTenant = updateTenantRegistry(s.byTenant, tenantId, (registry) =>
        deleteRouteRecord(registry, id),
      );
      saveTenantRegistries(byTenant).catch(() => {});
      return { byTenant };
    }),

  resetTenant: (tenantId) =>
    set((s) => {
      const byTenant = resetTenantRegistry(s.byTenant, tenantId);
      saveTenantRegistries(byTenant).catch(() => {});
      return { byTenant };
    }),
}));

export type {
    DriverRecord,
    RouteRecord,
    StudentRecord,
    TenantRegistry,
    VehicleRecord,
    VehicleStatus
};

