import { Platform } from 'react-native';

export type StoredSession = {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt?: number; // epoch ms
};

const KEY = 'securestop.session.v1';

let inMemorySession: string | null = null;

let cachedSecureStore:
  | {
      getItemAsync: (key: string) => Promise<string | null>;
      setItemAsync: (key: string, value: string) => Promise<void>;
      deleteItemAsync: (key: string) => Promise<void>;
      isAvailableAsync?: () => Promise<boolean>;
    }
  | undefined;

let secureStoreDisabled = false;

function getWebStorage(): Storage | undefined {
  if (Platform.OS !== 'web') return undefined;
  try {
    return globalThis?.localStorage;
  } catch {
    return undefined;
  }
}

async function getSecureStore(): Promise<
  | {
      getItemAsync: (key: string) => Promise<string | null>;
      setItemAsync: (key: string, value: string) => Promise<void>;
      deleteItemAsync: (key: string) => Promise<void>;
      isAvailableAsync?: () => Promise<boolean>;
    }
  | undefined
> {
  if (Platform.OS === 'web') return undefined;
  if (secureStoreDisabled) return undefined;
  if (cachedSecureStore) return cachedSecureStore;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const SecureStore = require('expo-secure-store') as typeof import('expo-secure-store');
    cachedSecureStore = SecureStore;
    return cachedSecureStore;
  } catch {
    // Likely running in a dev client that hasn't been rebuilt with expo-secure-store.
    return undefined;
  }
}

async function secureGetItem(key: string): Promise<string | null> {
  const secureStore = await getSecureStore();
  if (!secureStore) return null;

  try {
    if (typeof secureStore.isAvailableAsync === 'function') {
      const available = await secureStore.isAvailableAsync();
      if (!available) {
        secureStoreDisabled = true;
        return null;
      }
    }
    return await secureStore.getItemAsync(key);
  } catch {
    secureStoreDisabled = true;
    return null;
  }
}

async function secureSetItem(key: string, value: string): Promise<boolean> {
  const secureStore = await getSecureStore();
  if (!secureStore) return false;

  try {
    if (typeof secureStore.isAvailableAsync === 'function') {
      const available = await secureStore.isAvailableAsync();
      if (!available) {
        secureStoreDisabled = true;
        return false;
      }
    }
    await secureStore.setItemAsync(key, value);
    return true;
  } catch {
    secureStoreDisabled = true;
    return false;
  }
}

async function secureDeleteItem(key: string): Promise<boolean> {
  const secureStore = await getSecureStore();
  if (!secureStore) return false;

  try {
    if (typeof secureStore.isAvailableAsync === 'function') {
      const available = await secureStore.isAvailableAsync();
      if (!available) {
        secureStoreDisabled = true;
        return false;
      }
    }
    await secureStore.deleteItemAsync(key);
    return true;
  } catch {
    secureStoreDisabled = true;
    return false;
  }
}

export async function loadSession(): Promise<StoredSession | undefined> {
  try {
    const web = getWebStorage();
    if (web) {
      const raw = web.getItem(KEY);
      if (!raw) return undefined;
      const parsed = JSON.parse(raw) as StoredSession;
      if (!parsed?.accessToken) return undefined;
      return parsed;
    }

    const raw = (await secureGetItem(KEY)) ?? inMemorySession;
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.accessToken) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

export async function saveSession(session: StoredSession | undefined): Promise<void> {
  try {
    const web = getWebStorage();
    if (web) {
      if (!session) {
        web.removeItem(KEY);
        return;
      }
      web.setItem(KEY, JSON.stringify(session));
      return;
    }

    if (!session) {
      const deleted = await secureDeleteItem(KEY);
      if (!deleted) inMemorySession = null;
      return;
    }
    const saved = await secureSetItem(KEY, JSON.stringify(session));
    if (!saved) {
      inMemorySession = JSON.stringify(session);
    }
  } catch {
    // Ignore storage errors in scaffold.
  }
}

export async function clearSession(): Promise<void> {
  return saveSession(undefined);
}
