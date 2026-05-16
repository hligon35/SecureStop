import type { DomainEvent } from "@/core/events/contracts";
import { getJson, setJson } from "@/lib/storage/kv";

const KEY = "securestop.domainEventOutbox.v1";
const MAX_EVENTS = 200;

export async function loadDomainEventOutbox(): Promise<DomainEvent[]> {
  const current = await getJson<{ events?: DomainEvent[] }>(KEY);
  return Array.isArray(current?.events) ? current.events : [];
}

export async function appendDomainEventToOutbox(
  event: DomainEvent,
): Promise<void> {
  const events = await loadDomainEventOutbox();
  const next = [...events, event].slice(-MAX_EVENTS);
  await setJson(KEY, { events: next });
}

export async function removeDomainEventFromOutbox(
  eventId: string,
): Promise<void> {
  const events = await loadDomainEventOutbox();
  const next = events.filter((event) => event.id !== eventId);
  await setJson(KEY, next.length > 0 ? { events: next } : undefined);
}
