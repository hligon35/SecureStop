import type { Incident } from "@/core/incidents/types";

export interface IncidentsRepository {
  load(): Promise<Incident[]>;
  save(incidents: Incident[]): Promise<void>;
  clear(): Promise<void>;
}

export interface IncidentReadRepository {
  loadRecent(params: { tenantId: string; limit?: number }): Promise<Incident[]>;
}
