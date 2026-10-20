import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getRedis } from "@/server/redis";

export const dynamic = "force-dynamic";

async function withTimeout<T>(p: Promise<T>, ms = 2_000): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
}

export async function GET() {
  const [dbRes, redisRes] = await Promise.allSettled([withTimeout(db.execute(sql`select 1`)), withTimeout(getRedis().ping())]);
  const status = { db: dbRes.status === "fulfilled", redis: redisRes.status === "fulfilled" && redisRes.value === "PONG" };
  const ok = status.db && status.redis;
  return NextResponse.json({ ok, ...status }, { status: ok ? 200 : 503, headers: { "cache-control": "no-store" } });
}
