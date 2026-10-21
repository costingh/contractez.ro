import { db } from "./db";
import { events } from "./db/schema";
import { forwardToVisitrack } from "./visitrack";

/** Eveniment de produs (funnel: cont → proiect → aplicare → colaborare → cumpărare). */
export async function track(name: string, userId: string | null, props?: Record<string, unknown>) {
  try {
    await db.insert(events).values({ name, userId, props });
    if (userId) forwardToVisitrack(userId, name, props);
  } catch (err) {
    console.error("[analytics]", (err as Error).message);
  }
}
