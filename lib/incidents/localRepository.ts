import type { IncidentsRepository } from "@/core/incidents/repository";
import type { Incident } from "@/core/incidents/types";
import { getJson, setJson } from "@/lib/storage/kv";

const KEY = "securestop.incidents.v1";

export const localIncidentsRepository: IncidentsRepository = {
  async load(): Promise<Incident[]> {
    const data = await getJson<{ incidents?: Incident[] }>(KEY);
    return Array.isArray(data?.incidents) ? data.incidents : [];
  },
  async save(incidents: Incident[]): Promise<void> {
    await setJson(KEY, { incidents });
  },
  async clear(): Promise<void> {
    await setJson(KEY, undefined);
  },
};
