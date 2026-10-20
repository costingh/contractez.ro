import { getRedis } from "./redis";

/**
 * Fixed-window rate limit în Redis. Dacă Redis nu răspunde, permitem cererea
 * (preferăm disponibilitatea în fața blocării utilizatorilor).
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  try {
    const redis = getRedis();
    const bucket = `rl:${key}:${Math.floor(Date.now() / 1000 / windowSeconds)}`;
    const count = await redis.incr(bucket);
    if (count === 1) await redis.expire(bucket, windowSeconds + 5);
    return count <= limit;
  } catch {
    return true;
  }
}
