import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "./db/schema";
import { env } from "./env";

/** Cookie-ul prin care evenimentele din acțiunile utilizatorului ajung în browser (vezi analytics.track). */
export const RELAY_COOKIE = "vt_ev";

/** Numele din VisitTrack: „user.signed_up” → „signup”, restul cu „_” în loc de „.”. */
export function visitrackEventName(name: string) {
  return name === "user.signed_up" ? "signup" : name.replace(/\./g, "_");
}

/** Id-urile de vizitator VisitTrack (și ce acceptă Stripe în client_reference_id): litere, cifre, - și _. */
const VISITOR_ID_RE = /^[A-Za-z0-9_-]{1,200}$/;

export function cleanVisitorId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return VISITOR_ID_RE.test(v) ? v : null;
}

/**
 * Trimite un eveniment de pe server în VisitTrack, legat de istoricul din browser al utilizatorului
 * (users.vt_visitor_id). Nu aruncă niciodată și nu blochează cererea: e doar analytics.
 */
export function forwardToVisitrack(userId: string, name: string, props?: Record<string, unknown>) {
  if (!env.VISITRACK_API_KEY) return;
  void (async () => {
    try {
      const [u] = await db.select({ vid: users.vtVisitorId }).from(users).where(eq(users.id, userId)).limit(1);
      if (u?.vid) await send(u.vid, name, props);
    } catch (err) {
      console.error(`[visitrack] ${name}:`, (err as Error).message);
    }
  })();
}

async function send(visitorId: string, name: string, props?: Record<string, unknown> | null) {
  await fetch("https://visitrack.app/api/track", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.VISITRACK_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "event", visitorId, name: visitrackEventName(name), props: props ?? undefined }),
    signal: AbortSignal.timeout(5000),
  });
}

/** Leagă contul de vizitatorul din browser (pentru evenimentele trimise de pe server și atribuirea plăților Stripe). */
export async function linkVisitor(userId: string, visitorId: string, previous: string | null) {
  if (previous === visitorId) return;
  await db.update(users).set({ vtVisitorId: visitorId }).where(eq(users.id, userId));
}
