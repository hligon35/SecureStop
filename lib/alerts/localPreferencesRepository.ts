import type { AlertPreferencesRepository } from "@/core/alerts/repository";
import type { NotificationPrefs } from "@/core/alerts/types";
import { getJson, setJson } from "@/lib/storage/kv";

const PREFS_KEY = "securestop.notificationPrefs.v1";

export const localAlertPreferencesRepository: AlertPreferencesRepository = {
  async load(): Promise<NotificationPrefs | undefined> {
    const data = await getJson<{ prefs?: NotificationPrefs }>(PREFS_KEY);
    return data?.prefs;
  },
  async save(prefs: NotificationPrefs): Promise<void> {
    await setJson(PREFS_KEY, { prefs });
  },
};
