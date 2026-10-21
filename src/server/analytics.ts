import { db } from "./db";
import { events } from "./db/schema";
import { env } from "./env";
import { RELAY_COOKIE, forwardToVisitrack, visitrackEventName } from "./visitrack";

/** Eveniment de produs (funnel: cont → proiect → aplicare → colaborare → cumpărare). */
export async function track(name: string, userId: string | null, props?: Record<string, unknown>) {
  try {
    await db.insert(events).values({ name, userId, props });
  } catch (err) {
    console.error("[analytics]", (err as Error).message);
  }
  if (env.VISITRACK_SITE_ID && userId && !(await relayToBrowser(name, userId, props))) forwardToVisitrack(userId, name, props);
}

/**
 * Dacă evenimentul vine dintr-o cerere a chiar acestui utilizator (acțiune în browser), îl lăsăm într-un cookie scurt
 * pe care scriptul din pagină îl trimite în VisitTrack: așa e legat de vizita lui, fără cheie API și și în modul fără cookie-uri.
 * Webhook-urile (Stripe) și worker-ul nu au sesiunea utilizatorului, așa că merg pe calea de server (forwardToVisitrack).
 */
async function relayToBrowser(name: string, userId: string, props?: Record<string, unknown>) {
  try {
    // Import dinamic: modulul de sesiune e doar pentru server-ul Next; în worker importul eșuează și mergem pe server.
    const [{ getCurrentUser }, { cookies }] = await Promise.all([import("./auth/session"), import("next/headers")]);
    const user = await getCurrentUser();
    if (user?.id !== userId) return false;
    const jar = await cookies();
    let pending: unknown[] = [];
    try {
      pending = JSON.parse(jar.get(RELAY_COOKIE)?.value ?? "[]");
    } catch {}
    const queue = [...(Array.isArray(pending) ? pending : []), { n: visitrackEventName(name), p: props ?? null }].slice(-10);
    jar.set(RELAY_COOKIE, JSON.stringify(queue), { path: "/", maxAge: 600, sameSite: "lax", httpOnly: false });
    return true;
  } catch {
    // în afara unei cereri (worker) sau într-o randare de pagină, unde cookie-urile nu se pot scrie
    return false;
  }
}
