import axios from 'axios';

import { getConfig } from '@/lib/config';

type AuthProviders = {
  getAccessToken: () => string | undefined;
  getSchoolId: () => string | undefined;
};

let providers: AuthProviders = {
  getAccessToken: () => undefined,
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
  const schoolId = providers.getSchoolId();

  config.headers = config.headers ?? {};

  if (accessToken) {
    (config.headers as any).Authorization = `Bearer ${accessToken}`;
  }
  if (schoolId) {
    (config.headers as any)['X-School-Id'] = schoolId;
  }

  return config;
});
