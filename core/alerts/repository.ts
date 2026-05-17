import type { AlertMessage, NotificationPrefs } from "@/core/alerts/types";

export interface AlertPreferencesRepository {
  load(): Promise<NotificationPrefs | undefined>;
  save(prefs: NotificationPrefs): Promise<void>;
}

export interface AlertInboxRepository {
  load(): Promise<AlertMessage[]>;
  save(inbox: AlertMessage[]): Promise<void>;
  clear(): Promise<void>;
}

export interface AlertInboxReadRepository {
  loadRecent(params: {
    tenantId: string;
    limit?: number;
  }): Promise<AlertMessage[]>;
}
