import { Queue, type JobsOptions } from "bullmq";
import { getRedis } from "../redis";

export const QUEUES = {
  matching: "matching",
  autobid: "autobid",
  email: "email",
  ai: "ai",
  scheduled: "scheduled",
} as const;

export type JobMap = {
  matching: { projectId: string } | { providerId: string };
  autobid: { projectId: string };
  email: { emailId: string };
  ai: { kind: "project-enrich"; projectId: string } | { kind: "provider-skills"; providerId: string } | { kind: "outreach-classify" };
  scheduled: { kind: "digest-daily" | "digest-weekly" | "maintenance" | "unseen-refunds" | "outreach-sweep" };
};

const g = globalThis as unknown as { queues?: Map<string, Queue> };

export function getQueue<K extends keyof JobMap>(name: K): Queue<JobMap[K]> {
  g.queues ??= new Map();
  let q = g.queues.get(name);
  if (!q) {
    q = new Queue(QUEUES[name], {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 5_000 },
        removeOnComplete: { age: 7 * 86_400, count: 5_000 },
        removeOnFail: { age: 30 * 86_400 },
      },
    });
    g.queues.set(name, q);
  }
  return q as Queue<JobMap[K]>;
}

/**
 * Pune un job în coadă. `jobId` asigură deduplicarea (același proiect nu este procesat de două ori).
 * Erorile Redis nu blochează acțiunea utilizatorului: le logăm, iar job-ul de mentenanță recuperează.
 */
export async function enqueue<K extends keyof JobMap>(name: K, data: JobMap[K], opts: JobsOptions = {}) {
  try {
    await (getQueue(name) as unknown as Queue).add(name, data, opts);
  } catch (err) {
    console.error(`[queue] Nu am putut adăuga job ${name}`, err);
  }
}
