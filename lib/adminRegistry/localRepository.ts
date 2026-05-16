import type {
    DriverRecord,
    RouteRecord,
    StudentRecord,
    TenantRegistry,
    VehicleRecord,
} from "@/core/adminRegistry/types";
import { getJson, setJson } from "@/lib/storage/kv";

const KEY = "securestop.adminRegistry.v1";

export function emptyTenantRegistry(): TenantRegistry {
  return { vehicles: [], drivers: [], students: [], routes: [] };
}

export function seedTenantRegistryIfEmpty(
  registry: TenantRegistry,
): TenantRegistry {
  if (
    registry.vehicles.length ||
    registry.drivers.length ||
    registry.students.length ||
    registry.routes.length
  ) {
    return registry;
  }

  return {
    vehicles: [
      {
        id: "BUS-12",
        label: "Bus 12",
        status: "active",
        assignedRouteId: "R-101",
      },
      { id: "BUS-07", label: "Bus 07", status: "maintenance" },
    ],
    drivers: [
      {
        id: "D-100",
        name: "Alex Driver",
        active: true,
        assignedVehicleId: "BUS-12",
      },
      { id: "D-101", name: "Taylor Driver", active: true },
    ],
    students: [
      {
        id: "S-001",
        name: "A. Student",
        grade: "3",
        parentName: "P. Parent",
        stopName: "Oak St",
        active: true,
      },
      {
        id: "S-002",
        name: "B. Student",
        grade: "5",
        parentName: "P. Parent",
        stopName: "Pine Ave",
        active: true,
      },
    ],
    routes: [
      {
        id: "R-101",
        name: "AM Route 101",
        active: true,
        vehicleId: "BUS-12",
        driverId: "D-100",
      },
      { id: "R-202", name: "PM Route 202", active: true },
    ],
  };
}

export async function loadTenantRegistries(): Promise<
  Record<string, TenantRegistry>
> {
  const data = await getJson<{ byTenant?: Record<string, TenantRegistry> }>(
    KEY,
  );
  return data?.byTenant && typeof data.byTenant === "object"
    ? data.byTenant
    : {};
}

export async function saveTenantRegistries(
  byTenant: Record<string, TenantRegistry>,
): Promise<void> {
  await setJson(KEY, { byTenant });
}

export function ensureTenantRegistry(
  byTenant: Record<string, TenantRegistry>,
  tenantId: string,
): Record<string, TenantRegistry> {
  if (!tenantId) return byTenant;
  if (byTenant[tenantId]) return byTenant;

  return {
    ...byTenant,
    [tenantId]: seedTenantRegistryIfEmpty(emptyTenantRegistry()),
  };
}

export function updateTenantRegistry(
  byTenant: Record<string, TenantRegistry>,
  tenantId: string,
  updater: (registry: TenantRegistry) => TenantRegistry,
): Record<string, TenantRegistry> {
  const current = seedTenantRegistryIfEmpty(
    byTenant[tenantId] ?? emptyTenantRegistry(),
  );
  return {
    ...byTenant,
    [tenantId]: updater(current),
  };
}

export function upsertVehicleRecord(
  registry: TenantRegistry,
  vehicle: VehicleRecord,
): TenantRegistry {
  return {
    ...registry,
    vehicles: [
      vehicle,
      ...registry.vehicles.filter((entry) => entry.id !== vehicle.id),
    ],
  };
}

export function updateVehicleRecord(
  registry: TenantRegistry,
  id: string,
  next: Partial<VehicleRecord>,
): TenantRegistry {
  return {
    ...registry,
    vehicles: registry.vehicles.map((entry) =>
      entry.id === id ? { ...entry, ...next } : entry,
    ),
  };
}

export function deleteVehicleRecord(
  registry: TenantRegistry,
  id: string,
): TenantRegistry {
  return {
    ...registry,
    vehicles: registry.vehicles.filter((entry) => entry.id !== id),
  };
}

export function upsertDriverRecord(
  registry: TenantRegistry,
  driver: DriverRecord,
): TenantRegistry {
  return {
    ...registry,
    drivers: [
      driver,
      ...registry.drivers.filter((entry) => entry.id !== driver.id),
    ],
  };
}

export function updateDriverRecord(
  registry: TenantRegistry,
  id: string,
  next: Partial<DriverRecord>,
): TenantRegistry {
  return {
    ...registry,
    drivers: registry.drivers.map((entry) =>
      entry.id === id ? { ...entry, ...next } : entry,
    ),
  };
}

export function deleteDriverRecord(
  registry: TenantRegistry,
  id: string,
): TenantRegistry {
  return {
    ...registry,
    drivers: registry.drivers.filter((entry) => entry.id !== id),
  };
}

export function upsertStudentRecord(
  registry: TenantRegistry,
  student: StudentRecord,
): TenantRegistry {
  return {
    ...registry,
    students: [
      student,
      ...registry.students.filter((entry) => entry.id !== student.id),
    ],
  };
}

export function updateStudentRecord(
  registry: TenantRegistry,
  id: string,
  next: Partial<StudentRecord>,
): TenantRegistry {
  return {
    ...registry,
    students: registry.students.map((entry) =>
      entry.id === id ? { ...entry, ...next } : entry,
    ),
  };
}

export function deleteStudentRecord(
  registry: TenantRegistry,
  id: string,
): TenantRegistry {
  return {
    ...registry,
    students: registry.students.filter((entry) => entry.id !== id),
  };
}

export function upsertRouteRecord(
  registry: TenantRegistry,
  route: RouteRecord,
): TenantRegistry {
  return {
    ...registry,
    routes: [
      route,
      ...registry.routes.filter((entry) => entry.id !== route.id),
    ],
  };
}

export function updateRouteRecord(
  registry: TenantRegistry,
  id: string,
  next: Partial<RouteRecord>,
): TenantRegistry {
  return {
    ...registry,
    routes: registry.routes.map((entry) =>
      entry.id === id ? { ...entry, ...next } : entry,
    ),
  };
}

export function deleteRouteRecord(
  registry: TenantRegistry,
  id: string,
): TenantRegistry {
  return {
    ...registry,
    routes: registry.routes.filter((entry) => entry.id !== id),
  };
}

export function resetTenantRegistry(
  byTenant: Record<string, TenantRegistry>,
  tenantId: string,
): Record<string, TenantRegistry> {
  return {
    ...byTenant,
    [tenantId]: seedTenantRegistryIfEmpty(emptyTenantRegistry()),
  };
}
