import { describe, expect, it } from "vitest";
import { hasRecentCheckout } from "@/server/billing/plans";
import { db } from "@/server/db";
import { events } from "@/server/db/schema";
import { createTestUser } from "./helpers";

describe("mesajul de la întoarcerea din Stripe (`/abonament?plata=succes`)", () => {
  it("„în curs de confirmare” doar dacă utilizatorul a pornit o plată în ultimele 30 de minute", async () => {
    const u = await createTestUser({ isProvider: true });
    expect(await hasRecentCheckout(u.id)).toBe(false); // ex. link cu session_id fals
    await db.insert(events).values({ name: "checkout.started", userId: u.id, createdAt: new Date(Date.now() - 45 * 60_000) });
    expect(await hasRecentCheckout(u.id)).toBe(false);
    await db.insert(events).values({ name: "checkout.started", userId: u.id });
    expect(await hasRecentCheckout(u.id)).toBe(true);
  });
});
