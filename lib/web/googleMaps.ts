import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getGoogleMapsApiKey(): string | undefined {
  const runtimeConfig = (globalThis as {
    __SECURESTOP_RUNTIME_CONFIG__?: { googleMapsApiKey?: unknown };
  }).__SECURESTOP_RUNTIME_CONFIG__;
  const fromRuntimeConfig = runtimeConfig?.googleMapsApiKey;
  if (typeof fromRuntimeConfig === 'string' && fromRuntimeConfig.trim().length > 0) {
    return fromRuntimeConfig.trim();
  }

  const fromMeta =
    typeof document !== 'undefined'
      ? document
          .querySelector('meta[name="securestop-google-maps-api-key"]')
          ?.getAttribute('content')
      : undefined;
  if (typeof fromMeta === 'string' && fromMeta.trim().length > 0) {
    return fromMeta.trim();
  }

  // Native builds can still read from Expo config. Web cannot keep a browser API key secret
  // once it is compiled into a static bundle, so web only uses runtime injection above.
  if (Platform.OS === 'web') {
    return undefined;
  }

  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  const fromExtra = extra.googleMapsApiKey;
  if (typeof fromExtra === 'string' && fromExtra.trim().length > 0) return fromExtra.trim();

  return undefined;
}

type LoadGoogleMapsResult = { google: any; apiKey?: string };

export async function loadGoogleMapsJsApi(): Promise<LoadGoogleMapsResult> {
  if (Platform.OS !== 'web') {
    throw new Error('Google Maps JS API can only load on web.');
  }

  const apiKey = getGoogleMapsApiKey();
  const win = window as any;

  if (!apiKey) {
    return { google: win.google, apiKey: undefined };
  }

  const w = win as {
    google?: any;
    __securestopGoogleMapsPromise?: Promise<any>;
  };

  if (w.google?.maps) {
    return { google: w.google, apiKey };
  }

  if (!w.__securestopGoogleMapsPromise) {
    w.__securestopGoogleMapsPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-securestop-google-maps="1"]') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve(w.google));
        existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps JS API.')));
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
      script.async = true;
      script.defer = true;
      script.dataset.securestopGoogleMaps = '1';
      script.onload = () => resolve(w.google);
      script.onerror = () => reject(new Error('Failed to load Google Maps JS API.'));
      document.head.appendChild(script);
    });
  }

  const google = await w.__securestopGoogleMapsPromise;
  return { google, apiKey };
}
