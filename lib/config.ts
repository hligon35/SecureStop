export type AppConfig = {
  apiBaseUrl: string;
  sentry?: {
    dsn: string;
  };
  cloudflare?: {
    domainEventIngressBaseUrl?: string;
    domainEventIngressPath: string;
  };
  firebase?: {
    apiKey: string;
    authDomain?: string;
    projectId: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId: string;
  };
  supabase?: {
    url: string;
    anonKey: string;
    schema: string;
  };
  tenants: Array<{ id: string; name: string }>;
  oidc?: {
    issuer?: string;
    clientId?: string;
    redirectUri?: string;
    scopes: string[];
  };
  features: {
    enableDemoLogin: boolean;
    enableDriverGps: boolean;
    enablePushTokenRegistration: boolean;
  };
};

function envBool(name: string, fallback: boolean) {
  const raw = process.env[name];
  if (raw == null) return fallback;
  const v = raw.trim().toLowerCase();
  if (v === "1" || v === "true" || v === "yes" || v === "on") return true;
  if (v === "0" || v === "false" || v === "no" || v === "off") return false;
  return fallback;
}

export function getConfig(): AppConfig {
  const apiBaseUrl = (
    process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://example.invalid/api"
  ).trim();
  const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
  const cloudflareDomainEventIngressBaseUrl =
    process.env.EXPO_PUBLIC_CLOUDFLARE_EVENTS_BASE_URL?.trim();
  const cloudflareDomainEventIngressPath =
    process.env.EXPO_PUBLIC_CLOUDFLARE_EVENTS_PATH?.trim() || "/events/domain";
  const firebaseApiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim();
  const firebaseAuthDomain =
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();
  const firebaseProjectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const firebaseStorageBucket =
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
  const firebaseMessagingSenderId =
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim();
  const firebaseAppId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID?.trim();
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const supabaseSchema =
    process.env.EXPO_PUBLIC_SUPABASE_SCHEMA?.trim() || "public";

  const tenantsRaw = (process.env.EXPO_PUBLIC_TENANTS ?? "").trim();
  const tenants = (() => {
    if (!tenantsRaw) return [{ id: "mock-school", name: "Demo School" }];

    // Supports either JSON array or a CSV format: id:name,id2:name2
    if (tenantsRaw.startsWith("[") || tenantsRaw.startsWith("{")) {
      try {
        const parsed = JSON.parse(tenantsRaw) as any;
        const arr = Array.isArray(parsed) ? parsed : parsed?.tenants;
        if (!Array.isArray(arr))
          return [{ id: "mock-school", name: "Demo School" }];
        const cleaned = arr
          .map((t: any) => ({
            id: String(t?.id ?? "").trim(),
            name: String(t?.name ?? "").trim(),
          }))
          .filter((t) => t.id.length > 0 && t.name.length > 0);
        return cleaned.length > 0
          ? cleaned
          : [{ id: "mock-school", name: "Demo School" }];
      } catch {
        return [{ id: "mock-school", name: "Demo School" }];
      }
    }

    const pairs = tenantsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((pair) => {
        const idx = pair.indexOf(":");
        if (idx < 0) return undefined;
        const id = pair.slice(0, idx).trim();
        const name = pair.slice(idx + 1).trim();
        if (!id || !name) return undefined;
        return { id, name };
      })
      .filter(Boolean) as Array<{ id: string; name: string }>;

    return pairs.length > 0
      ? pairs
      : [{ id: "mock-school", name: "Demo School" }];
  })();

  const issuer = process.env.EXPO_PUBLIC_OIDC_ISSUER?.trim();
  const clientId = process.env.EXPO_PUBLIC_OIDC_CLIENT_ID?.trim();
  const redirectUri = process.env.EXPO_PUBLIC_OIDC_REDIRECT_URI?.trim();

  const scopesRaw = (
    process.env.EXPO_PUBLIC_OIDC_SCOPES ?? "openid profile email"
  ).trim();
  const scopes = scopesRaw.split(/[\s,]+/).filter(Boolean);

  return {
    apiBaseUrl,
    sentry: sentryDsn ? { dsn: sentryDsn } : undefined,
    cloudflare:
      cloudflareDomainEventIngressBaseUrl || cloudflareDomainEventIngressPath
        ? {
            domainEventIngressBaseUrl: cloudflareDomainEventIngressBaseUrl,
            domainEventIngressPath: cloudflareDomainEventIngressPath,
          }
        : undefined,
    firebase:
      firebaseApiKey && firebaseProjectId && firebaseAppId
        ? {
            apiKey: firebaseApiKey,
            authDomain: firebaseAuthDomain,
            projectId: firebaseProjectId,
            storageBucket: firebaseStorageBucket,
            messagingSenderId: firebaseMessagingSenderId,
            appId: firebaseAppId,
          }
        : undefined,
    supabase:
      supabaseUrl && supabaseAnonKey
        ? {
            url: supabaseUrl,
            anonKey: supabaseAnonKey,
            schema: supabaseSchema,
          }
        : undefined,
    tenants,
    oidc:
      issuer || clientId || redirectUri
        ? { issuer, clientId, redirectUri, scopes }
        : undefined,
    features: {
      enableDemoLogin: envBool("EXPO_PUBLIC_ENABLE_DEMO_LOGIN", false),
      enableDriverGps: envBool("EXPO_PUBLIC_ENABLE_DRIVER_GPS", false),
      enablePushTokenRegistration: envBool(
        "EXPO_PUBLIC_ENABLE_PUSH_TOKEN_REGISTRATION",
        true,
      ),
    },
  };
}
