import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { categories, notifications, projects } from "@/server/db/schema";
import { matchOpenProjectsForProvider, runMatchingForProject } from "@/server/matching/run";
import { saveProviderProfile } from "@/server/providers/service";
import { createTestUser } from "./helpers";

async function cat(slug: string) {
  const [c] = await db.select().from(categories).where(eq(categories.slug, slug));
  return c;
}

async function openProject(clientId: string, categoryId: number, title: string) {
  const [p] = await db
    .insert(projects)
    .values({
      clientId,
      title,
      description: "Avem nevoie de un logo nou și de o identitate vizuală completă pentru cafenea.",
      categoryId,
      status: "open",
      budgetType: "fixed",
      budgetMax: 2000,
      workMode: "remote",
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 86_400_000),
    })
    .returning();
  return p;
}

async function provider(categoryId: number) {
  const u = await createTestUser({ isProvider: true });
  await saveProviderProfile(u.id, {
    headline: "Designer de logo-uri",
    bio: "Creez identități vizuale pentru afaceri locale de peste cinci ani, remote.",
    pricingModel: "fixed",
    minProjectBudget: 500,
    remote: true,
    onSite: false,
    categoryIds: [categoryId],
    skills: [],
    issuesInvoice: false,
    legalEntity: "none",
  });
  return u;
}

describe("potriviri pentru prestatori noi", () => {
  it("prestatorul nou e anunțat (un singur rezumat) despre proiectele deja deschise", async () => {
    const logo = await cat("logo-identitate");
    const client = await createTestUser({ isClient: true });
    await openProject(client.id, logo.id, "Logo pentru cafenea de specialitate");
    await openProject(client.id, logo.id, "Identitate vizuală pentru brutărie");
    const v = await provider(logo.id);

    const first = await matchOpenProjectsForProvider(v.id);
    expect(first.notified).toBeGreaterThanOrEqual(2);
    const again = await matchOpenProjectsForProvider(v.id);
    expect(again.notified).toBe(0); // nimic nou → nicio notificare

    const notes = await db.select().from(notifications).where(and(eq(notifications.userId, v.id), eq(notifications.type, "match.summary")));
    expect(notes).toHaveLength(1);
  });

  it("matching-ul refăcut după editare nu re-notifică prestatorii deja anunțați", async () => {
    const logo = await cat("logo-identitate");
    const client = await createTestUser({ isClient: true });
    const v = await provider(logo.id);
    const p = await openProject(client.id, logo.id, "Logo pentru salon de înfrumusețare");
    const r1 = await runMatchingForProject(p.id);
    const r2 = await runMatchingForProject(p.id);
    expect(r1.notified).toBeGreaterThanOrEqual(1);
    expect(r2.notified).toBe(0);
    const notes = await db.select().from(notifications).where(and(eq(notifications.userId, v.id), eq(notifications.type, "match.new")));
    expect(notes).toHaveLength(1);
  });
});
