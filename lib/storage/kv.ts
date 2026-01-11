import { Platform } from 'react-native';

const memoryStore = new Map<string, string>();

let secureStoreDisabled = false;
let cachedSecureStore:
  | {
      getItemAsync: (key: string) => Promise<string | null>;
      setItemAsync: (key: string, value: string) => Promise<void>;
      deleteItemAsync: (key: string) => Promise<void>;
      isAvailableAsync?: () => Promise<boolean>;
    }
  | undefined;

function getWebStorage(): Storage | undefined {
  if (Platform.OS !== 'web') return undefined;
  try {
    return globalThis?.localStorage;
  } catch {
    return undefined;
  }
}

async function getSecureStore() {
  if (Platform.OS === 'web') return undefined;
  if (secureStoreDisabled) return undefined;
  if (cachedSecureStore) return cachedSecureStore;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const SecureStore = require('expo-secure-store') as typeof import('expo-secure-store');
    cachedSecureStore = SecureStore;
    return cachedSecureStore;
  } catch {
    return undefined;
  }
}

async function secureAvailable(): Promise<boolean> {
  const ss = await getSecureStore();
  if (!ss) return false;
  try {
    if (typeof ss.isAvailableAsync === 'function') {
      const ok = await ss.isAvailableAsync();
      if (!ok) secureStoreDisabled = true;
      return ok;
    }
    return true;
  } catch {
    secureStoreDisabled = true;
    return false;
  }
}

export async function getItem(key: string): Promise<string | null> {
  const web = getWebStorage();
  if (web) {
    try {
      return web.getItem(key);
    } catch {
      return null;
    }
  }

  if (await secureAvailable()) {
    const ss = await getSecureStore();
    if (ss) {
      try {
        return await ss.getItemAsync(key);
      } catch {
        secureStoreDisabled = true;
      }
    }
  }

  return memoryStore.get(key) ?? null;
}

export async function setItem(key: string, value: string | null): Promise<void> {
  const web = getWebStorage();
  if (web) {
    try {
      if (value == null) web.removeItem(key);
      else web.setItem(key, value);
    } catch {
      // ignore
    }
    return;
  }

  if (await secureAvailable()) {
    const ss = await getSecureStore();
    if (ss) {
      try {
        if (value == null) await ss.deleteItemAsync(key);
        else await ss.setItemAsync(key, value);
        return;
      } catch {
        secureStoreDisabled = true;
      }
    }
  }

  if (value == null) memoryStore.delete(key);
  else memoryStore.set(key, value);
}

export async function getJson<T>(key: string): Promise<T | undefined> {
  const raw = await getItem(key);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export async function setJson(key: string, value: unknown | undefined): Promise<void> {
  if (value == null) {
    await setItem(key, null);
    return;
  }
  await setItem(key, JSON.stringify(value));
}
