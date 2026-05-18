import { DOMAIN_EVENT_NAMES, type DomainEvent } from "@/core/events/contracts";
import type { DomainEventSink } from "@/core/events/sink";
import { subscribeToDomainEvent } from "@/lib/events/bus";
import { cloudflareEventSink } from "@/lib/events/cloudflareEventSink";
import {
    appendDomainEventToOutbox,
    loadDomainEventOutbox,
    removeDomainEventsFromOutbox,
} from "@/lib/events/localOutboxRepository";

const localOutboxSink: DomainEventSink = {
  publish(event: DomainEvent): Promise<void> {
    return appendDomainEventToOutbox(event);
  },
};

const remoteSinks: DomainEventSink[] = [cloudflareEventSink];

let started = false;
let stopForwarding: (() => void) | undefined;
let drainingOutbox: Promise<void> | undefined;
let liveBatchFlush: Promise<void> | undefined;
let pendingLiveEvents: DomainEvent[] = [];

function chunkEvents(events: DomainEvent[], size: number): DomainEvent[][] {
  const chunks: DomainEvent[][] = [];
  for (let index = 0; index < events.length; index += size) {
    chunks.push(events.slice(index, index + size));
  }
  return chunks;
}

async function publishBatchToRemoteSinks(
  events: DomainEvent[],
): Promise<boolean> {
  if (events.length === 0) return true;

  const results = await Promise.allSettled(
    remoteSinks.map((sink) => {
      if (sink.publishMany) {
        return sink.publishMany(events);
      }

      return Promise.all(events.map((event) => sink.publish(event))).then(
        () => undefined,
      );
    }),
  );
  return results.every((result) => result.status === "fulfilled");
}

async function forwardDomainEvent(
  event: DomainEvent,
  options?: { alreadyPersisted?: boolean },
): Promise<void> {
  if (!options?.alreadyPersisted) {
    await localOutboxSink.publish(event);
  }

  await enqueueLiveEventBatch([event]);
}

async function deliverPersistedBatch(events: DomainEvent[]): Promise<void> {
  const delivered = await publishBatchToRemoteSinks(events);
  if (delivered) {
    await removeDomainEventsFromOutbox(events.map((event) => event.id));
  }
}

async function flushPendingLiveEvents(): Promise<void> {
  if (pendingLiveEvents.length === 0) return;

  const byId = new Map<string, DomainEvent>();
  for (const event of pendingLiveEvents) {
    byId.set(event.id, event);
  }
  pendingLiveEvents = [];

  const events = [...byId.values()];
  const delivered = await publishBatchToRemoteSinks(events);
  if (delivered) {
    await removeDomainEventsFromOutbox(events.map((event) => event.id));
  }
}

function enqueueLiveEventBatch(events: DomainEvent[]): Promise<void> {
  pendingLiveEvents.push(...events);

  if (!liveBatchFlush) {
    liveBatchFlush = Promise.resolve()
      .then(() => flushPendingLiveEvents())
      .finally(() => {
        liveBatchFlush = undefined;
        if (pendingLiveEvents.length > 0) {
          void enqueueLiveEventBatch([]);
        }
      });
  }

  return liveBatchFlush;
}

async function drainPersistedOutbox(): Promise<void> {
  const events = await loadDomainEventOutbox();
  for (const batch of chunkEvents(events, 25)) {
    try {
      await deliverPersistedBatch(batch);
    } catch {
      // Keep the batch in the outbox and retry on the next startup/event.
    }
  }
}

function ensureOutboxDrainStarted(): Promise<void> {
  if (!drainingOutbox) {
    drainingOutbox = drainPersistedOutbox().finally(() => {
      drainingOutbox = undefined;
    });
  }

  return drainingOutbox;
}

export function startDomainEventForwarding(): () => void {
  if (started && stopForwarding) return stopForwarding;

  ensureOutboxDrainStarted().catch(() => {
    // Event forwarding is best-effort until backend sinks are authoritative.
  });

  const unsubscribers = DOMAIN_EVENT_NAMES.map((eventName) =>
    subscribeToDomainEvent(eventName, (event) => {
      forwardDomainEvent(event).catch(() => {
        // Event forwarding is best-effort until backend sinks are authoritative.
      });
    }),
  );

  started = true;
  stopForwarding = () => {
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
    started = false;
    stopForwarding = undefined;
  };

  return stopForwarding;
}
