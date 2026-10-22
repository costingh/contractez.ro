import "server-only";
import { and, eq, gt } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { db } from "../db";
import { sessions, users, type User } from "../db/schema";
import { env } from "../env";
import { randomToken, sha256 } from "./crypto";

export const SESSION_COOKIE = "sid";
const SESSION_DAYS = 30;
const RENEW_WHEN_DAYS_LEFT = 15;

export async function createSession(userId: string) {
  const token = randomToken();
  const h = await headers();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.insert(sessions).values({
    id: sha256(token),
    userId,
    expiresAt,
    userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
    ip: (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "").trim() || null,
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.APP_URL.startsWith("https://"),
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, sha256(token)));
  jar.delete(SESSION_COOKIE);
  jar.delete("sid_fresh");
}

export async function destroyAllSessions(userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

/** Utilizatorul curent (o singură interogare per request). */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const id = sha256(token);
  const [row] = await db
    .select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date())))
    .limit(1);
  if (!row || row.user.bannedAt || row.user.deletedAt) return null;

  const daysLeft = (row.expiresAt.getTime() - Date.now()) / 86_400_000;
  if (daysLeft < RENEW_WHEN_DAYS_LEFT) {
    // Prelungim sesiunea în DB; cookie-ul este reînnoit zilnic de proxy (src/proxy.ts).
    await db
      .update(sessions)
      .set({ expiresAt: new Date(Date.now() + SESSION_DAYS * 86_400_000) })
      .where(eq(sessions.id, id));
  }
  return row.user;
});

/** De câte minute există sesiunea curentă (de la autentificare). `null` fără sesiune validă. */
export async function currentSessionAgeMinutes(): Promise<number | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({ createdAt: sessions.createdAt })
    .from(sessions)
    .where(and(eq(sessions.id, sha256(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return row ? (Date.now() - row.createdAt.getTime()) / 60_000 : null;
}
