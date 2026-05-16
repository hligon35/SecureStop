export type VehicleStatus = "active" | "maintenance" | "inactive";

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

export type TenantRegistry = {
  vehicles: VehicleRecord[];
  drivers: DriverRecord[];
  students: StudentRecord[];
  routes: RouteRecord[];
};
