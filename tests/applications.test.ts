import { and, eq, ne } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  applyToProject,
  hireApplication,
  refundAllForProject,
  rejectApplication,
  shortlistApplication,
  withdrawApplication,
} from "@/server/applications/service";
import { applicationsUsedSince, grantCompPlan } from "@/server/billing/plans";
import { db } from "@/server/db";
import { applications, categories, collaborations, conversations, projects, providerProfiles } from "@/server/db/schema";
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

describe("alegerea prestatorului: cereri simultane", () => {
  it("două alegeri simultane pe același proiect: exact una reușește, fără deadlock", async () => {
    const client = await createTestUser({ isClient: true });
    const p = await openProject(client.id);
    const [v1, v2] = [await provider(), await provider()];
    const a1 = await applyToProject({ providerId: v1.id, projectId: p.id, message: msg });
    const a2 = await applyToProject({ providerId: v2.id, projectId: p.id, message: msg });

    const results = await Promise.allSettled([hireApplication(a1.id, client.id), hireApplication(a2.id, client.id)]);
    const ok = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    expect(ok).toHaveLength(1);
    expect(failed).toHaveLength(1);
    // Eroare de business afișabilă, nu o eroare Postgres (deadlock / unique violation).
    expect(failed[0].reason).toMatchObject({ name: "DomainError", code: "state" });

    const collabs = await db.select().from(collaborations).where(eq(collaborations.projectId, p.id));
    expect(collabs).toHaveLength(1);
    const hired = await db.select().from(applications).where(and(eq(applications.projectId, p.id), eq(applications.status, "hired")));
    expect(hired).toHaveLength(1);
  });

  it("aceeași ofertă aleasă de două ori simultan creează o singură colaborare", async () => {
    const client = await createTestUser({ isClient: true });
    const p = await openProject(client.id);
    const v = await provider();
    const a = await applyToProject({ providerId: v.id, projectId: p.id, message: msg });
    const results = await Promise.allSettled([hireApplication(a.id, client.id), hireApplication(a.id, client.id), hireApplication(a.id, client.id)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    for (const r of results) if (r.status === "rejected") expect(r.reason).toMatchObject({ name: "DomainError" });
    expect(await db.select().from(collaborations).where(eq(collaborations.projectId, p.id))).toHaveLength(1);
  });

  it("baza de date refuză a doua colaborare neanulată pe același proiect", async () => {
    const client = await createTestUser({ isClient: true });
    const p = await openProject(client.id);
    const [v1, v2] = [await provider(), await provider()];
    const a1 = await applyToProject({ providerId: v1.id, projectId: p.id, message: msg });
    const a2 = await applyToProject({ providerId: v2.id, projectId: p.id, message: msg });
    await hireApplication(a1.id, client.id);
    await expect(
      db.insert(collaborations).values({ projectId: p.id, applicationId: a2.id, clientId: client.id, providerId: v2.id }),
    ).rejects.toThrow();
  });

  it("o ofertă respinsă, retrasă sau aleasă nu mai poate fi modificată", async () => {
    const client = await createTestUser({ isClient: true });
    const p = await openProject(client.id);
    const [v1, v2] = [await provider(), await provider()];
    const a1 = await applyToProject({ providerId: v1.id, projectId: p.id, message: msg });
    const a2 = await applyToProject({ providerId: v2.id, projectId: p.id, message: msg });
    await rejectApplication(a1.id, client.id, "Peste buget");
    await expect(rejectApplication(a1.id, client.id)).rejects.toMatchObject({ code: "state" });
    await expect(shortlistApplication(a1.id, client.id, true)).rejects.toMatchObject({ code: "state" });
    await expect(withdrawApplication(a1.id, v1.id)).rejects.toMatchObject({ code: "state" });
    await withdrawApplication(a2.id, v2.id);
    await expect(shortlistApplication(a2.id, client.id, true)).rejects.toMatchObject({ code: "state" });
    await expect(hireApplication(a2.id, client.id)).rejects.toMatchObject({ code: "state" });
    const [after] = await db.select().from(applications).where(eq(applications.id, a2.id));
    expect(after.status).toBe("withdrawn");
  });
});

describe("retragerea ofertei", () => {
  it("eliberează locul pe proiect, iar limita de oferte folosește numărul corectat", async () => {
    const client = await createTestUser({ isClient: true });
    const p = await openProject(client.id, { maxApplications: 2 });
    const [v1, v2, v3] = [await provider(), await provider(), await provider()];
    const a1 = await applyToProject({ providerId: v1.id, projectId: p.id, message: msg });
    await applyToProject({ providerId: v2.id, projectId: p.id, message: msg });
    await expect(applyToProject({ providerId: v3.id, projectId: p.id, message: msg })).rejects.toMatchObject({ code: "full" });

    await withdrawApplication(a1.id, v1.id);
    let [after] = await db.select().from(projects).where(eq(projects.id, p.id));
    expect(after.applicationsCount).toBe(1);
    // Aplicarea retrasă rămâne socotită în limita lunară a prestatorului.
    expect(await used(v1.id)).toBe(1);

    await applyToProject({ providerId: v3.id, projectId: p.id, message: msg });
    [after] = await db.select().from(projects).where(eq(projects.id, p.id));
    expect(after.applicationsCount).toBe(2);
  });

  it("retragerea dublă sau de către alt prestator nu scade numărul de două ori", async () => {
    const client = await createTestUser({ isClient: true });
    const p = await openProject(client.id);
    const [v1, v2] = [await provider(), await provider()];
    const a1 = await applyToProject({ providerId: v1.id, projectId: p.id, message: msg });
    await applyToProject({ providerId: v2.id, projectId: p.id, message: msg });
    await expect(withdrawApplication(a1.id, v2.id)).rejects.toMatchObject({ code: "not_found" });
    const results = await Promise.allSettled([withdrawApplication(a1.id, v1.id), withdrawApplication(a1.id, v1.id)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const [after] = await db.select().from(projects).where(eq(projects.id, p.id));
    expect(after.applicationsCount).toBe(1);
  });

  it("o ofertă automată retrasă eliberează și locul rezervat aplicărilor automate", async () => {
    const client = await createTestUser({ isClient: true });
    const p = await openProject(client.id, { maxAutoApplications: 1 });
    const [v1, v2] = [await provider("pro"), await provider("pro")];
    const a1 = await applyToProject({ providerId: v1.id, projectId: p.id, message: msg, isAuto: true });
    await withdrawApplication(a1.id, v1.id);
    const [after] = await db.select().from(projects).where(eq(projects.id, p.id));
    expect(after.autoApplicationsCount).toBe(0);
    await applyToProject({ providerId: v2.id, projectId: p.id, message: msg, isAuto: true });
  });
});

describe("validarea ofertei", () => {
  it.each([
    [{ priceAmount: -100 }, "cel puțin 1 leu"],
    [{ priceAmount: 0 }, "cel puțin 1 leu"],
    [{ priceAmount: 99_999_999_999 }, "cel mult 10.000.000"],
    [{ estimatedDays: -3 }, "cel puțin o zi"],
    [{ estimatedDays: 0 }, "cel puțin o zi"],
    [{ estimatedDays: 400 }, "cel mult 365"],
    [{ priceType: "gratis" as never }, "tipul prețului"],
  ])("respinge %j fără să salveze sau să socotească aplicarea", async (extra, text) => {
    const client = await createTestUser({ isClient: true });
    const p = await openProject(client.id);
    const v = await provider();
    await expect(applyToProject({ providerId: v.id, projectId: p.id, message: msg, ...extra })).rejects.toMatchObject({
      name: "DomainError",
      code: "invalid",
      message: expect.stringContaining(text),
    });
    expect(await used(v.id)).toBe(0);
    expect(await db.select().from(applications).where(eq(applications.projectId, p.id))).toHaveLength(0);
  });

  it("mesajul are limite de lungime", async () => {
    const client = await createTestUser({ isClient: true });
    const p = await openProject(client.id);
    const v = await provider();
    await expect(applyToProject({ providerId: v.id, projectId: p.id, message: "  prea scurt  " })).rejects.toMatchObject({ code: "message_short" });
    await expect(applyToProject({ providerId: v.id, projectId: p.id, message: "a".repeat(5_001) })).rejects.toMatchObject({ code: "message_long" });
  });

  it("acceptă prețul și durata la limite, sau lipsa lor", async () => {
    const client = await createTestUser({ isClient: true });
    const p = await openProject(client.id);
    const [v1, v2] = [await provider(), await provider()];
    const a = await applyToProject({ providerId: v1.id, projectId: p.id, message: msg, priceAmount: 10_000_000, priceType: "fixed", estimatedDays: 365 });
    expect(a).toMatchObject({ priceAmount: 10_000_000, priceType: "fixed", estimatedDays: 365 });
    const b = await applyToProject({ providerId: v2.id, projectId: p.id, message: msg, priceAmount: null, estimatedDays: null });
    expect(b).toMatchObject({ priceAmount: null, priceType: "to_discuss", estimatedDays: null });
    expect(await db.select().from(applications).where(and(eq(applications.projectId, p.id), ne(applications.status, "withdrawn")))).toHaveLength(2);
  });
});
