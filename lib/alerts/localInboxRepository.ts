import type { AlertInboxRepository } from "@/core/alerts/repository";
import type { AlertMessage } from "@/core/alerts/types";
import { getJson, setJson } from "@/lib/storage/kv";

const KEY = "securestop.alertInbox.v1";

export const localAlertInboxRepository: AlertInboxRepository = {
  async load(): Promise<AlertMessage[]> {
    const data = await getJson<{ inbox?: AlertMessage[] }>(KEY);
    return Array.isArray(data?.inbox) ? data.inbox : [];
  },
  async save(inbox: AlertMessage[]): Promise<void> {
    await setJson(KEY, { inbox });
  },
  async clear(): Promise<void> {
    await setJson(KEY, undefined);
  },
};
