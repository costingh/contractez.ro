import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { applyToProject, refundApplication } from "@/server/applications/service";
import { getActivePlan, getPlanUsage, grantCompPlan, revokeCompPlans, usageWindow } from "@/server/billing/plans";
import { db } from "@/server/db";
import { applications, categories, projects, providerProfiles, subscriptions } from "@/server/db/schema";
import { createTestUser } from "./helpers";

const msg = "Bună ziua! Am realizat multe site-uri pentru restaurante și vă pot ajuta rapid.";

async function projectsFor(clientId: string, n: number) {
  const [cat] = await db.select().from(categories).where(eq(categories.slug, "dezvoltare-web"));
  return db
    .insert(projects)
    .values(
      Array.from({ length: n }, (_, i) => ({
        clientId,
        title: `Proiect de test ${i + 1}`,
        description: "Avem nevoie de un site de prezentare cu meniu, galerie și formular de rezervare.",
        categoryId: cat.id,
        status: "open" as const,
        budgetType: "fixed" as const,
        budgetMax: 3000,
        workMode: "remote" as const,
        publishedAt: new Date(),
        expiresAt: new Date(Date.now() + 86_400_000),
      })),
    )
    .returning();
}

async function provider() {
  const u = await createTestUser({ isProvider: true });
  await db.insert(providerProfiles).values({ userId: u.id, slug: `p-${u.id}` });
  return u;
}

describe("abonamente și limita lunară", () => {
  it("planul Gratuit permite 5 aplicări pe lună; a 6-a e refuzată fără să salveze nimic", async () => {
    const client = await createTestUser({ isClient: true });
    const ps = await projectsFor(client.id, 6);
    const v = await provider();
    for (const p of ps.slice(0, 5)) await applyToProject({ providerId: v.id, projectId: p.id, message: msg });
    await expect(applyToProject({ providerId: v.id, projectId: ps[5].id, message: msg })).rejects.toMatchObject({ code: "quota" });
    const usage = await getPlanUsage(v.id);
    expect(usage).toMatchObject({ used: 5, limit: 5, remaining: 0 });
    expect(usage.plan.id).toBe("free");
    const [last] = await db.select().from(projects).where(eq(projects.id, ps[5].id));
    expect(last.applicationsCount).toBe(0);
  });

  it("aplicările simultane ale aceluiași prestator nu depășesc limita", async () => {
    const client = await createTestUser({ isClient: true });
    const ps = await projectsFor(client.id, 8);
    const v = await provider();
    const results = await Promise.allSettled(ps.map((p) => applyToProject({ providerId: v.id, projectId: p.id, message: msg })));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(5);
    expect((await getPlanUsage(v.id)).used).toBe(5);
  });

  it("o aplicare restituită eliberează un loc în limită", async () => {
    const client = await createTestUser({ isClient: true });
    const ps = await projectsFor(client.id, 6);
    const v = await provider();
    const apps = [];
    for (const p of ps.slice(0, 5)) apps.push(await applyToProject({ providerId: v.id, projectId: p.id, message: msg }));
    expect(await refundApplication(apps[0].id, { reason: "test" })).toBe(1);
    expect(await refundApplication(apps[0].id, { reason: "test" })).toBe(0);
    await expect(applyToProject({ providerId: v.id, projectId: ps[5].id, message: msg })).resolves.toBeTruthy();
  });

  it("planul oferit Pro: 40 de aplicări, Auto Bid, se prelungește și se poate anula", async () => {
    const v = await provider();
    await grantCompPlan(v.id, "pro", 10);
    const a = await getActivePlan(v.id);
    expect(a.plan.id).toBe("pro");
    expect(a.comp).toBe(true);
    expect(a.plan.autoBid).toBe(true);
    expect((await getPlanUsage(v.id)).limit).toBe(40);

    await grantCompPlan(v.id, "pro", 10); // prelungire, nu un abonament nou
    const rows = await db.select().from(subscriptions).where(eq(subscriptions.userId, v.id));
    expect(rows).toHaveLength(1);
    const days = (rows[0].currentPeriodEnd!.getTime() - rows[0].currentPeriodStart!.getTime()) / 86_400_000;
    expect(Math.round(days)).toBe(20);

    expect(await revokeCompPlans(v.id)).toBe(1);
    expect((await getActivePlan(v.id)).plan.id).toBe("free");
  });

  it("Business promovează profilul cât timp planul e activ", async () => {
    const v = await provider();
    await grantCompPlan(v.id, "business", 30);
    const [p1] = await db.select().from(providerProfiles).where(eq(providerProfiles.userId, v.id));
    expect(p1.boostedUntil?.getTime()).toBeGreaterThan(Date.now());
    expect(p1.featuredUntil?.getTime()).toBeGreaterThan(Date.now());
    await revokeCompPlans(v.id);
    const [p2] = await db.select().from(providerProfiles).where(eq(providerProfiles.userId, v.id));
    expect(p2.boostedUntil).toBeNull();
  });

  it("planul oferit nu înlocuiește un abonament plătit", async () => {
    const v = await provider();
    const now = Date.now();
    await db.insert(subscriptions).values({
      userId: v.id,
      planId: "business",
      status: "active",
      stripeSubscriptionId: `sub_${v.id}`,
      currentPeriodStart: new Date(now - 86_400_000),
      currentPeriodEnd: new Date(now + 20 * 86_400_000),
    });
    expect(await grantCompPlan(v.id, "pro", 30)).toMatchObject({ granted: false });
    expect((await getActivePlan(v.id)).plan.id).toBe("business");
  });

  it("abonamentul Stripe expirat de peste 2 zile revine la Gratuit", async () => {
    const v = await provider();
    const now = Date.now();
    await db.insert(subscriptions).values({
      userId: v.id,
      planId: "pro",
      status: "active",
      stripeSubscriptionId: `sub_old_${v.id}`,
      currentPeriodStart: new Date(now - 33 * 86_400_000),
      currentPeriodEnd: new Date(now - 3 * 86_400_000),
    });
    expect((await getActivePlan(v.id)).plan.id).toBe("free");
  });
});

describe("planuri oferite de echipă: limita rămâne lunară", () => {
  it("fereastra = luna calendaristică, restrânsă la durata planului", () => {
    const month = { start: new Date("2026-10-01T00:00:00+03:00"), end: new Date("2026-11-01T00:00:00+02:00") };
    // Plan acordat acum câteva luni, valabil încă un an: numărăm doar luna curentă.
    expect(usageWindow(month, { currentPeriodStart: new Date("2026-06-15"), currentPeriodEnd: new Date("2027-06-15") })).toEqual({
      periodStart: month.start,
      periodEnd: month.end,
    });
    // Acordat la mijlocul lunii: aplicările de dinainte (pe planul Gratuit) nu se socotesc.
    const grantedAt = new Date("2026-10-12T10:00:00Z");
    expect(usageWindow(month, { currentPeriodStart: grantedAt, currentPeriodEnd: new Date("2027-10-12") }).periodStart).toEqual(grantedAt);
    // Expiră în cursul lunii: „se reînnoiește” la finalul planului, nu după.
    const endsAt = new Date("2026-10-20T10:00:00Z");
    expect(usageWindow(month, { currentPeriodStart: new Date("2026-09-20"), currentPeriodEnd: endsAt }).periodEnd).toEqual(endsAt);
  });

  it("un plan Pro oferit pe un an nu cumulează aplicările din lunile trecute", async () => {
    const client = await createTestUser({ isClient: true });
    const ps = await projectsFor(client.id, 4);
    const v = await provider();
    await grantCompPlan(v.id, "pro", 366);
    // Planul a început acum ~70 de zile.
    const start = new Date(Date.now() - 70 * 86_400_000);
    await db.update(subscriptions).set({ currentPeriodStart: start }).where(eq(subscriptions.userId, v.id));
    const old = new Date(Date.now() - 45 * 86_400_000);
    await db.insert(applications).values([
      { projectId: ps[0].id, providerId: v.id, message: msg, createdAt: old },
      { projectId: ps[1].id, providerId: v.id, message: msg, createdAt: old },
      { projectId: ps[2].id, providerId: v.id, message: msg },
    ]);
    const usage = await getPlanUsage(v.id);
    expect(usage.plan.id).toBe("pro");
    expect(usage.comp).toBe(true);
    expect(usage.used).toBe(1);
    expect(usage.remaining).toBe(39);
    // Fereastra e luna curentă (ora României), iar planul rămâne valabil până la finalul acordării.
    expect(usage.periodEnd.getTime() - usage.periodStart.getTime()).toBeLessThanOrEqual(31 * 86_400_000 + 3_600_000);
    expect(usage.planEndsAt!.getTime()).toBeGreaterThan(Date.now() + 300 * 86_400_000);
    // Profilul Business/perks: data de final e cea a planului, nu a lunii.
    expect(usage.periodEnd.getTime()).toBeLessThan(usage.planEndsAt!.getTime());
  });

  it("abonamentele Stripe păstrează perioada de facturare", async () => {
    const v = await provider();
    const now = Date.now();
    const start = new Date(now - 10 * 86_400_000);
    const end = new Date(now + 20 * 86_400_000);
    await db.insert(subscriptions).values({ userId: v.id, planId: "pro", status: "active", stripeSubscriptionId: `sub_bp_${v.id}`, currentPeriodStart: start, currentPeriodEnd: end });
    const a = await getActivePlan(v.id);
    expect(a.comp).toBe(false);
    expect(a.periodStart).toEqual(start);
    expect(a.periodEnd).toEqual(end);
    expect(a.planEndsAt).toEqual(end);
  });

  it("Business oferit pe mai multe luni promovează profilul până la finalul planului", async () => {
    const v = await provider();
    await grantCompPlan(v.id, "business", 120);
    const [p] = await db.select().from(providerProfiles).where(eq(providerProfiles.userId, v.id));
    expect(p.boostedUntil!.getTime()).toBeGreaterThan(Date.now() + 100 * 86_400_000);
  });
});
