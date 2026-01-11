import { api } from '@/lib/api/client';
import { getJson, setJson } from '@/lib/storage/kv';

type QueuedLocation = {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  timestamp: number;
};

const KEY = 'securestop.locationQueue.v1';

let flushing = false;

async function readQueue(): Promise<QueuedLocation[]> {
  const data = await getJson<{ queue?: QueuedLocation[] }>(KEY);
  return Array.isArray(data?.queue) ? (data!.queue as QueuedLocation[]) : [];
}

async function writeQueue(queue: QueuedLocation[]): Promise<void> {
  await setJson(KEY, { queue });
}

export async function enqueueLocation(point: QueuedLocation): Promise<void> {
  const queue = await readQueue();
  queue.push(point);
  // Cap to avoid unbounded growth.
  const capped = queue.slice(-500);
  await writeQueue(capped);
}

export async function flushLocationQueue(params?: { maxBatch?: number }): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    const maxBatch = params?.maxBatch ?? 25;
    let queue = await readQueue();

    while (queue.length > 0) {
      const batch = queue.slice(0, maxBatch);
      try {
        await api.post('/location/driver/batch', { points: batch });
        queue = queue.slice(batch.length);
        await writeQueue(queue);
      } catch {
        // If batch endpoint doesn't exist, try single-point fallback.
        try {
          await api.post('/location/driver', batch[0]);
          queue = queue.slice(1);
          await writeQueue(queue);
        } catch {
          break;
        }
      }
    }
  } finally {
    flushing = false;
  }
}
