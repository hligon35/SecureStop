import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getGoogleMapsApiKey(): string | undefined {
  // Preferred: Expo public env var (works on web + native)
  const fromEnv = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (typeof fromEnv === 'string' && fromEnv.trim().length > 0) return fromEnv.trim();

  // Fallback: app.json -> expo.extra.googleMapsApiKey
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
