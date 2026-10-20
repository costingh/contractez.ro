import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { applyToProject, hireApplication, refundAllForProject } from "@/server/applications/service";
import { applicationsUsedSince, grantCompPlan } from "@/server/billing/plans";
import { db } from "@/server/db";
import { categories, conversations, projects, providerProfiles } from "@/server/db/schema";
import { createTestUser } from "./helpers";

async function category() {
  const [c] = await db.select().from(categories).where(eq(categories.slug, "dezvoltare-web"));
  return c;
}

async function openProject(clientId: string, overrides: Partial<typeof projects.$inferInsert> = {}) {
  const cat = await category();
  const [p] = await db
    .insert(projects)
    .values({
      clientId,
      title: "Site de prezentare pentru restaurant",
      description: "Avem nevoie de un site de prezentare cu meniu, galerie și formular de rezervare.",
      categoryId: cat.id,
      status: "open",
      budgetType: "fixed",
      budgetMin: 2000,
      budgetMax: 3000,
      workMode: "remote",
      publishedAt: new Date(),
      autoBidOpensAt: new Date(Date.now() - 1000),
      expiresAt: new Date(Date.now() + 86_400_000),
      ...overrides,
    })
    .returning();
  return p;
}

async function provider(plan?: "pro" | "business") {
  const u = await createTestUser({ isProvider: true, name: "Prestator Test" });
  await db.insert(providerProfiles).values({ userId: u.id, slug: `p-${u.id}` });
  if (plan) await grantCompPlan(u.id, plan, 30);
  return u;
}

const longAgo = new Date(0);
const used = (userId: string) => applicationsUsedSince(userId, longAgo);

const msg = "Bună ziua! Am realizat multe site-uri pentru restaurante și vă pot ajuta rapid.";

describe("aplicări", () => {
  it("o aplicare validă se socotește o dată în limită și deschide conversația", async () => {
    const client = await createTestUser({ isClient: true });
    const p = await openProject(client.id);
    const v = await provider();
    const app = await applyToProject({ providerId: v.id, projectId: p.id, message: msg });
    expect(app.status).toBe("submitted");
    expect(app.boostedAt).toBeNull(); // Gratuit: fără evidențiere
    expect(await used(v.id)).toBe(1);
    const [conv] = await db.select().from(conversations).where(eq(conversations.applicationId, app.id));
    expect(conv.clientId).toBe(client.id);
    const [after] = await db.select().from(projects).where(eq(projects.id, p.id));
    expect(after.applicationsCount).toBe(1);
  });

  it("a doua aplicare la același proiect este respinsă și nu se socotește", async () => {
    const client = await createTestUser({ isClient: true });
    const p = await openProject(client.id);
    const v = await provider();
    await applyToProject({ providerId: v.id, projectId: p.id, message: msg });
    await expect(applyToProject({ providerId: v.id, projectId: p.id, message: msg })).rejects.toMatchObject({ code: "duplicate" });
    expect(await used(v.id)).toBe(1);
  });

  it("client neverificat nu primește aplicări plătite", async () => {
    const client = await createTestUser({ isClient: true, emailVerifiedAt: null });
    const p = await openProject(client.id);
    const v = await provider();
    await expect(applyToProject({ providerId: v.id, projectId: p.id, message: msg })).rejects.toMatchObject({ code: "client_unverified" });
    expect(await used(v.id)).toBe(0);
  });

  it("respectă numărul maxim de locuri, inclusiv la aplicări simultane", async () => {
    const client = await createTestUser({ isClient: true });
    const p = await openProject(client.id, { maxApplications: 3 });
    const providers = await Promise.all(Array.from({ length: 6 }, () => provider()));
    const results = await Promise.allSettled(providers.map((v) => applyToProject({ providerId: v.id, projectId: p.id, message: msg })));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(3);
    const counts = await Promise.all(providers.map((v) => used(v.id)));
    expect(counts.filter((n) => n === 1)).toHaveLength(3); // doar aplicările acceptate se socotesc
  });

  it("aplicările automate ocupă cel mult locurile rezervate și se socotesc în limita planului", async () => {
    const client = await createTestUser({ isClient: true });
    const p = await openProject(client.id, { maxAutoApplications: 2 });
    const vs = [await provider("pro"), await provider("pro"), await provider("pro")];
    const first = await applyToProject({ providerId: vs[0].id, projectId: p.id, message: msg, isAuto: true });
    await applyToProject({ providerId: vs[1].id, projectId: p.id, message: msg, isAuto: true });
    await expect(applyToProject({ providerId: vs[2].id, projectId: p.id, message: msg, isAuto: true })).rejects.toMatchObject({ code: "auto_full" });
    expect(first.boostedAt).not.toBeNull(); // Pro: ofertă evidențiată
    expect(await used(vs[0].id)).toBe(1);
    expect(await used(vs[2].id)).toBe(0);
  });

  it("planul Gratuit nu poate trimite aplicări automate", async () => {
    const client = await createTestUser({ isClient: true });
    const p = await openProject(client.id);
    const v = await provider();
    await expect(applyToProject({ providerId: v.id, projectId: p.id, message: msg, isAuto: true })).rejects.toMatchObject({ code: "plan_autobid" });
  });

  it("clientul poate dezactiva aplicările automate", async () => {
    const client = await createTestUser({ isClient: true });
    const p = await openProject(client.id, { allowAutoBids: false });
    const v = await provider("pro");
    await expect(applyToProject({ providerId: v.id, projectId: p.id, message: msg, isAuto: true })).rejects.toMatchObject({ code: "no_auto" });
  });

  it("proiect fraudulos: aplicările sunt restituite o singură dată și nu se mai socotesc", async () => {
    const client = await createTestUser({ isClient: true });
    const p = await openProject(client.id);
    const v1 = await provider();
    const v2 = await provider();
    await applyToProject({ providerId: v1.id, projectId: p.id, message: msg });
    await applyToProject({ providerId: v2.id, projectId: p.id, message: msg });
    expect(await refundAllForProject(p.id, "fraudă")).toBe(2);
    expect(await refundAllForProject(p.id, "fraudă")).toBe(0);
    expect(await used(v1.id)).toBe(0);
    expect(await used(v2.id)).toBe(0);
  });

  it("alegerea unui prestator închide selecția și creează colaborarea", async () => {
    const client = await createTestUser({ isClient: true });
    const p = await openProject(client.id);
    const v1 = await provider();
    const v2 = await provider();
    const a1 = await applyToProject({ providerId: v1.id, projectId: p.id, message: msg });
    await applyToProject({ providerId: v2.id, projectId: p.id, message: msg });
    const collab = await hireApplication(a1.id, client.id);
    expect(collab?.providerId).toBe(v1.id);
    const [after] = await db.select().from(projects).where(eq(projects.id, p.id));
    expect(after.status).toBe("in_progress");
    const v3 = await provider();
    await expect(applyToProject({ providerId: v3.id, projectId: p.id, message: msg })).rejects.toMatchObject({ code: "closed" });
  });
});
