import type { DomainEvent, DomainEventName } from "@/core/events/contracts";

type DomainEventListener<TEvent extends DomainEvent = DomainEvent> = (
  event: TEvent,
) => void;

const listeners = new Map<DomainEventName, Set<DomainEventListener>>();

export function publishDomainEvent<TEvent extends DomainEvent>(
  event: TEvent,
): void {
  const eventListeners = listeners.get(event.name);
  if (!eventListeners?.size) return;

  for (const listener of eventListeners) {
    listener(event);
  }
}

export function subscribeToDomainEvent<TEvent extends DomainEvent>(
  eventName: TEvent["name"],
  listener: DomainEventListener<TEvent>,
): () => void {
  const eventListeners = listeners.get(eventName) ?? new Set();
  eventListeners.add(listener as DomainEventListener);
  listeners.set(eventName, eventListeners);

  return () => {
    const nextListeners = listeners.get(eventName);
    if (!nextListeners) return;
    nextListeners.delete(listener as DomainEventListener);
    if (nextListeners.size === 0) {
      listeners.delete(eventName);
    }
  };
}
