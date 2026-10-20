import "dotenv/config";
import { Worker, type Job } from "bullmq";
import { sql } from "drizzle-orm";
import { runAutoBidForProject } from "@/server/autobid/engine";
import { db } from "@/server/db";
import { deliverEmail } from "@/server/email/send";
import { features } from "@/server/env";
import {
  enrichProject,
  enrichProviderSkills,
  maintenance,
  refundUnseenApplications,
  sendMatchDigests,
} from "@/server/jobs/scheduled";
import { matchOpenProjectsForProvider, runMatchingForProject } from "@/server/matching/run";
import { QUEUES, enqueue, getQueue, type JobMap } from "@/server/queue";
import { getRedis } from "@/server/redis";

const connection = getRedis();

function worker<K extends keyof JobMap>(name: K, handler: (job: Job<JobMap[K]>) => Promise<unknown>, concurrency = 4) {
  const w = new Worker<JobMap[K]>(
    QUEUES[name],
    async (job) => {
      const started = Date.now();
      const result = await handler(job);
      console.log(`[worker:${name}] ${job.id} ok in ${Date.now() - started}ms`, result ?? "");
      return result;
    },
    { connection, concurrency },
  );
  w.on("failed", (job, err) => {
    const final = job && job.attemptsMade >= (job.opts.attempts ?? 1);
    console.error(`[worker:${name}] ${job?.id} ${final ? "FAILED (dead-letter)" : "failed, retry"}:`, err.message);
  });
  return w;
}

const workers = [
  worker("matching", (job) => ("projectId" in job.data ? runMatchingForProject(job.data.projectId) : matchOpenProjectsForProvider(job.data.providerId)), 2),
  worker("autobid", (job) => runAutoBidForProject(job.data.projectId), 1),
  worker("email", (job) => deliverEmail(job.data.emailId), 5),
  worker(
    "ai",
    async (job) => {
      if (job.data.kind === "project-enrich") return enrichProject(job.data.projectId);
      if (job.data.kind === "provider-skills") return enrichProviderSkills(job.data.providerId);
    },
    2,
  ),
  worker(
    "scheduled",
    async (job) => {
      switch (job.data.kind) {
        case "digest-daily":
          return sendMatchDigests("daily");
        case "digest-weekly":
          return sendMatchDigests("weekly");
        case "unseen-refunds":
          return refundUnseenApplications();
        case "maintenance": {
          const res = await maintenance();
          // Recuperare: proiecte deschise recent fără matching (ex: Redis indisponibil la publicare).
          const stale = (await db.execute(sql`
            SELECT p.id FROM projects p
            WHERE p.status = 'open' AND p.published_at > now() - interval '6 hours'
              AND NOT EXISTS (SELECT 1 FROM project_matches m WHERE m.project_id = p.id)`)) as unknown as { id: string }[];
          for (const s of stale) await enqueue("matching", { projectId: s.id }, { jobId: `match-${s.id}` });
          return { ...res, recovered: stale.length };
        }
      }
    },
    1,
  ),
];

async function scheduleRepeatables() {
  const q = getQueue("scheduled");
  // Ora României: digest zilnic la 08:00, săptămânal luni la 08:00.
  await q.upsertJobScheduler("digest-daily", { pattern: "0 8 * * *", tz: "Europe/Bucharest" }, { name: "scheduled", data: { kind: "digest-daily" } });
  await q.upsertJobScheduler("digest-weekly", { pattern: "0 8 * * 1", tz: "Europe/Bucharest" }, { name: "scheduled", data: { kind: "digest-weekly" } });
  await q.upsertJobScheduler("maintenance", { every: 15 * 60_000 }, { name: "scheduled", data: { kind: "maintenance" } });
  await q.upsertJobScheduler("unseen-refunds", { pattern: "30 3 * * *", tz: "Europe/Bucharest" }, { name: "scheduled", data: { kind: "unseen-refunds" } });
}

async function main() {
  await scheduleRepeatables();
  console.log(`[worker] pornit · AI ${features.ai ? "activ" : "dezactivat"} · email ${features.email ? "Resend" : "doar log"}`);
}

async function shutdown(signal: string) {
  console.log(`[worker] ${signal}: oprire grațioasă…`);
  await Promise.allSettled(workers.map((w) => w.close()));
  await connection.quit().catch(() => {});
  process.exit(0);
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

main().catch((err) => {
  console.error("[worker] eroare la pornire", err);
  process.exit(1);
});
