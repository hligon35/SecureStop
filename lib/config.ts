export type AppConfig = {
  apiBaseUrl: string;
  tenants: Array<{ id: string; name: string }>;
  oidc?: {
    issuer?: string;
    clientId?: string;
    redirectUri?: string;
    scopes: string[];
  };
  features: {
    enableDriverGps: boolean;
    enablePushTokenRegistration: boolean;
  };
};

function envBool(name: string, fallback: boolean) {
  const raw = process.env[name];
  if (raw == null) return fallback;
  const v = raw.trim().toLowerCase();
  if (v === '1' || v === 'true' || v === 'yes' || v === 'on') return true;
  if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false;
  return fallback;
}

export function getConfig(): AppConfig {
  const apiBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://example.invalid/api').trim();

  const tenantsRaw = (process.env.EXPO_PUBLIC_TENANTS ?? '').trim();
  const tenants = (() => {
    if (!tenantsRaw) return [{ id: 'mock-school', name: 'Demo School' }];

    // Supports either JSON array or a CSV format: id:name,id2:name2
    if (tenantsRaw.startsWith('[') || tenantsRaw.startsWith('{')) {
      try {
        const parsed = JSON.parse(tenantsRaw) as any;
        const arr = Array.isArray(parsed) ? parsed : parsed?.tenants;
        if (!Array.isArray(arr)) return [{ id: 'mock-school', name: 'Demo School' }];
        const cleaned = arr
          .map((t: any) => ({ id: String(t?.id ?? '').trim(), name: String(t?.name ?? '').trim() }))
          .filter((t) => t.id.length > 0 && t.name.length > 0);
        return cleaned.length > 0 ? cleaned : [{ id: 'mock-school', name: 'Demo School' }];
      } catch {
        return [{ id: 'mock-school', name: 'Demo School' }];
      }
    }

    const pairs = tenantsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((pair) => {
        const idx = pair.indexOf(':');
        if (idx < 0) return undefined;
        const id = pair.slice(0, idx).trim();
        const name = pair.slice(idx + 1).trim();
        if (!id || !name) return undefined;
        return { id, name };
      })
      .filter(Boolean) as Array<{ id: string; name: string }>;

    return pairs.length > 0 ? pairs : [{ id: 'mock-school', name: 'Demo School' }];
  })();

  const issuer = process.env.EXPO_PUBLIC_OIDC_ISSUER?.trim();
  const clientId = process.env.EXPO_PUBLIC_OIDC_CLIENT_ID?.trim();
  const redirectUri = process.env.EXPO_PUBLIC_OIDC_REDIRECT_URI?.trim();

  const scopesRaw = (process.env.EXPO_PUBLIC_OIDC_SCOPES ?? 'openid profile email').trim();
  const scopes = scopesRaw.split(/[\s,]+/).filter(Boolean);

  return {
    apiBaseUrl,
    tenants,
    oidc: issuer || clientId || redirectUri ? { issuer, clientId, redirectUri, scopes } : undefined,
    features: {
      enableDriverGps: envBool('EXPO_PUBLIC_ENABLE_DRIVER_GPS', false),
      enablePushTokenRegistration: envBool('EXPO_PUBLIC_ENABLE_PUSH_TOKEN_REGISTRATION', true),
    },
  };
}
