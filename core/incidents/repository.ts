import type { Incident } from "@/core/incidents/types";

export interface IncidentsRepository {
  load(): Promise<Incident[]>;
  save(incidents: Incident[]): Promise<void>;
  clear(): Promise<void>;
}
