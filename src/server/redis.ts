import IORedis, { type Redis } from "ioredis";
import { env } from "./env";

const g = globalThis as unknown as { redis?: Redis };

/** Conexiune Redis partajată (lazy, ca build-ul să nu se conecteze). */
export function getRedis(): Redis {
  if (!g.redis) {
    g.redis = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableOfflineQueue: true,
      lazyConnect: false,
    });
    g.redis.on("error", (err) => console.error("[redis]", err.message));
  }
  return g.redis;
}
