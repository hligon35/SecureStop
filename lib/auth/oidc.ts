import type { Role } from "@/constants/roles";
import { getConfig } from "@/lib/config";

export type OidcResult = {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
  expiresIn?: number; // seconds
};

export type OidcIdentityClaims = {
  userId: string;
  role?: Role;
  tenantId?: string;
  schoolId?: string;
  email?: string;
  homeAddress?: string;
};

const BASE64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function normalizeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  return padding === 0 ? normalized : normalized + "=".repeat(4 - padding);
}

function decodeBase64(input: string): string {
  const normalized = normalizeBase64Url(input);
  let output = "";
  let buffer = 0;
  let bits = 0;

  for (const char of normalized) {
    if (char === "=") break;
    const value = BASE64_CHARS.indexOf(char);
    if (value < 0) continue;

    buffer = (buffer << 6) | value;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }

  return output;
}

function decodeJwtPayload(token: string): Record<string, unknown> | undefined {
  const parts = token.split(".");
  if (parts.length < 2 || !parts[1]) return undefined;

  try {
    return JSON.parse(decodeBase64(parts[1])) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function normalizeRole(value: unknown): Role | undefined {
  if (value === "admin" || value === "driver" || value === "parent") {
    return value;
  }

  return undefined;
}

function claimString(
  payload: Record<string, unknown> | undefined,
  keys: string[],
): string | undefined {
  if (!payload) return undefined;

  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return undefined;
}

export function extractOidcIdentityClaims(params: {
  idToken?: string;
  accessToken?: string;
}): OidcIdentityClaims | undefined {
  const idPayload = params.idToken
    ? decodeJwtPayload(params.idToken)
    : undefined;
  const accessPayload = params.accessToken
    ? decodeJwtPayload(params.accessToken)
    : undefined;

  const userId =
    claimString(idPayload, ["sub", "user_id", "userId"]) ??
    claimString(accessPayload, ["sub", "user_id", "userId"]);
  if (!userId) return undefined;

  return {
    userId,
    role: normalizeRole(idPayload?.role) ?? normalizeRole(accessPayload?.role),
    tenantId:
      claimString(idPayload, ["tenantId", "tenant_id"]) ??
      claimString(accessPayload, ["tenantId", "tenant_id"]),
    schoolId:
      claimString(idPayload, ["schoolId", "school_id"]) ??
      claimString(accessPayload, ["schoolId", "school_id"]),
    email:
      claimString(idPayload, ["email"]) ??
      claimString(accessPayload, ["email"]),
    homeAddress:
      claimString(idPayload, ["homeAddress", "home_address"]) ??
      claimString(accessPayload, ["homeAddress", "home_address"]),
  };
}

let didInitWebBrowser = false;

export async function signInWithOidcInteractive(): Promise<OidcResult> {
  let AuthSession: typeof import("expo-auth-session");
  let WebBrowser: typeof import("expo-web-browser");
  try {
    AuthSession = await import("expo-auth-session");
    WebBrowser = await import("expo-web-browser");
  } catch {
    throw new Error(
      "SSO is unavailable in this build (missing native modules). If you are using a dev client, rebuild it after installing Expo modules.",
    );
  }

  if (!didInitWebBrowser) {
    didInitWebBrowser = true;
    WebBrowser.maybeCompleteAuthSession();
  }

  const cfg = getConfig();
  const oidc = cfg.oidc;

  if (!oidc?.issuer || !oidc?.clientId) {
    throw new Error(
      "OIDC not configured. Set EXPO_PUBLIC_OIDC_ISSUER and EXPO_PUBLIC_OIDC_CLIENT_ID.",
    );
  }

  const discovery = await AuthSession.fetchDiscoveryAsync(oidc.issuer);
  const redirectUri =
    oidc.redirectUri ?? AuthSession.makeRedirectUri({ scheme: "securestop" });

  const request = new AuthSession.AuthRequest({
    clientId: oidc.clientId,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    scopes: oidc.scopes ?? ["openid", "profile", "email"],
    usePKCE: true,
  });

  await request.makeAuthUrlAsync(discovery);

  const result = await request.promptAsync(discovery);
  if (result.type !== "success") {
    throw new Error(result.type === "dismiss" ? "SSO cancelled" : "SSO failed");
  }

  const tokenResult = await AuthSession.exchangeCodeAsync(
    {
      clientId: oidc.clientId,
      code: result.params.code,
      redirectUri,
      extraParams: request.codeVerifier
        ? { code_verifier: request.codeVerifier }
        : undefined,
    },
    discovery,
  );

  if (!tokenResult.accessToken)
    throw new Error("OIDC token exchange did not return an access token");

  return {
    accessToken: tokenResult.accessToken,
    refreshToken: tokenResult.refreshToken,
    idToken: tokenResult.idToken,
    expiresIn: tokenResult.expiresIn,
  };
}
