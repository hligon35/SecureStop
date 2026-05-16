import axios from "axios";

import { getConfig } from "@/lib/config";
import {
    LEGACY_SCHOOL_HEADER,
    TENANT_HEADER,
    toTenantContext,
} from "@/lib/tenancy/context";

type AuthProviders = {
  getAccessToken: () => string | undefined;
  getTenantId: () => string | undefined;
  getSchoolId: () => string | undefined;
};

let providers: AuthProviders = {
  getAccessToken: () => undefined,
  getTenantId: () => undefined,
  getSchoolId: () => undefined,
};

export function configureApiAuthProviders(next: Partial<AuthProviders>) {
  providers = { ...providers, ...next } as AuthProviders;
}

export const api = axios.create({
  baseURL: getConfig().apiBaseUrl,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const accessToken = providers.getAccessToken();
  const tenantContext = toTenantContext({
    tenantId: providers.getTenantId(),
    legacySchoolId: providers.getSchoolId(),
  });

  config.headers = config.headers ?? {};

  if (accessToken) {
    (config.headers as any).Authorization = `Bearer ${accessToken}`;
  }
  if (tenantContext) {
    (config.headers as any)[TENANT_HEADER] = tenantContext.tenantId;
    (config.headers as any)[LEGACY_SCHOOL_HEADER] =
      tenantContext.legacySchoolId ?? tenantContext.tenantId;
  }

  return config;
});
