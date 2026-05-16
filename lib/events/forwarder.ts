import { DOMAIN_EVENT_NAMES, type DomainEvent } from "@/core/events/contracts";
import type { DomainEventSink } from "@/core/events/sink";
import { subscribeToDomainEvent } from "@/lib/events/bus";
import { cloudflareEventSink } from "@/lib/events/cloudflareEventSink";
import {
  appendDomainEventToOutbox,
  loadDomainEventOutbox,
  removeDomainEventFromOutbox,
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

async function publishToRemoteSinks(event: DomainEvent): Promise<boolean> {
  const results = await Promise.allSettled(
    remoteSinks.map((sink) => sink.publish(event)),
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

  const delivered = await publishToRemoteSinks(event);
  if (delivered) {
    await removeDomainEventFromOutbox(event.id);
  }
}

async function drainPersistedOutbox(): Promise<void> {
  const events = await loadDomainEventOutbox();
  for (const event of events) {
    try {
      await forwardDomainEvent(event, { alreadyPersisted: true });
    } catch {
      // Keep the event in the outbox and retry on the next startup/event.
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
