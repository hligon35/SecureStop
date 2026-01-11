import { getConfig } from '@/lib/config';

export type OidcResult = {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
  expiresIn?: number; // seconds
};

let didInitWebBrowser = false;

export async function signInWithOidcInteractive(): Promise<OidcResult> {
  let AuthSession: typeof import('expo-auth-session');
  let WebBrowser: typeof import('expo-web-browser');
  try {
    AuthSession = await import('expo-auth-session');
    WebBrowser = await import('expo-web-browser');
  } catch {
    throw new Error(
      'SSO is unavailable in this build (missing native modules). If you are using a dev client, rebuild it after installing Expo modules.'
    );
  }

  if (!didInitWebBrowser) {
    didInitWebBrowser = true;
    WebBrowser.maybeCompleteAuthSession();
  }

  const cfg = getConfig();
  const oidc = cfg.oidc;

  if (!oidc?.issuer || !oidc?.clientId) {
    throw new Error('OIDC not configured. Set EXPO_PUBLIC_OIDC_ISSUER and EXPO_PUBLIC_OIDC_CLIENT_ID.');
  }

  const discovery = await AuthSession.fetchDiscoveryAsync(oidc.issuer);
  const redirectUri = oidc.redirectUri ?? AuthSession.makeRedirectUri({ scheme: 'securestop' });

  const request = new AuthSession.AuthRequest({
    clientId: oidc.clientId,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    scopes: oidc.scopes ?? ['openid', 'profile', 'email'],
    usePKCE: true,
  });

  await request.makeAuthUrlAsync(discovery);

  const result = await request.promptAsync(discovery);
  if (result.type !== 'success') {
    throw new Error(result.type === 'dismiss' ? 'SSO cancelled' : 'SSO failed');
  }

  const tokenResult = await AuthSession.exchangeCodeAsync(
    {
      clientId: oidc.clientId,
      code: result.params.code,
      redirectUri,
      extraParams: request.codeVerifier ? { code_verifier: request.codeVerifier } : undefined,
    },
    discovery
  );

  if (!tokenResult.accessToken) throw new Error('OIDC token exchange did not return an access token');

  return {
    accessToken: tokenResult.accessToken,
    refreshToken: tokenResult.refreshToken,
    idToken: tokenResult.idToken,
    expiresIn: tokenResult.expiresIn,
  };
}
