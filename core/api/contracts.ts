import type { Role } from "@/constants/roles";

export type AuthLoginRequest = {
  email: string;
  password: string;
};

export type AuthLoginResponse = {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number;
  role?: Role;
  userId?: string;
  tenantId?: string;
  schoolId?: string;
  homeAddress?: string;
};

export type PushTokenRegistrationRequest = {
  token: string;
  platform?: string;
  deviceName?: string;
};

export type DriverLocationPoint = {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  timestamp: number;
};

export type DriverLocationBatchRequest = {
  points: DriverLocationPoint[];
};
