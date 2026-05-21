import * as Sentry from "@sentry/react-native";
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

  const headers = axios.AxiosHeaders.from(config.headers);

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (tenantContext) {
    headers.set(TENANT_HEADER, tenantContext.tenantId);
    headers.set(
      LEGACY_SCHOOL_HEADER,
      tenantContext.legacySchoolId ?? tenantContext.tenantId,
    );
  }

  config.headers = headers;

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status && status >= 400) {
        Sentry.captureException(error, {
          tags: {
            area: "api",
            status: String(status),
          },
          extra: {
            method: error.config?.method,
            url: error.config?.url,
            baseURL: error.config?.baseURL,
          },
        });
      }
    }

    return Promise.reject(error);
  },
);
