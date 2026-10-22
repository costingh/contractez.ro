import { and, desc, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db";
import { categories, notifications, projectStatusHistory, projects, reports } from "@/server/db/schema";
import { approveProject, publishProject, saveProject } from "@/server/projects/service";
import { createReport } from "@/server/trust/service";
import { createTestUser } from "./helpers";

// Moderarea AI e oprită în teste (fără cheie OpenAI); o simulăm ca să putem testa și varianta „semnalat”.
const aiModerate = vi.hoisted(() =>
  vi.fn<(text: string) => Promise<{ flagged: boolean; categories: string[] }>>(async () => ({ flagged: false, categories: [] })),
);
vi.mock("@/server/ai/client", async (importOriginal) => ({ ...(await importOriginal<object>()), aiModerate }));

beforeEach(() => {
  aiModerate.mockClear();
});

async function categoryId() {
  const [c] = await db.select().from(categories).where(eq(categories.slug, "dezvoltare-web"));
  return c.id;
}

async function input(overrides: Record<string, unknown> = {}) {
  return {
    title: "Site de prezentare pentru un cabinet stomatologic",
    description: "Avem nevoie de un site de prezentare cu servicii, echipă, prețuri orientative și formular de programare online.",
    categoryId: await categoryId(),
    budgetType: "fixed",
    budgetMin: 2000,
    budgetMax: 4000,
    workMode: "remote",
    invoice: "preferred",
    urgency: "flexible",
    skills: [],
    ...overrides,
  };
}

async function insertProject(clientId: string, overrides: Partial<typeof projects.$inferInsert> = {}) {
  const [p] = await db
    .insert(projects)
    .values({
      clientId,
      title: "Aplicație de rezervări pentru salon",
      description: "Avem nevoie de o aplicație simplă de rezervări pentru un salon de înfrumusețare, cu notificări.",
      categoryId: await categoryId(),
      status: "open",
      workMode: "remote",
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 86_400_000),
      ...overrides,
    })
    .returning();
  return p;
}

const load = async (id: string) => (await db.select().from(projects).where(eq(projects.id, id)))[0];
const history = (id: string) => db.select().from(projectStatusHistory).where(eq(projectStatusHistory.projectId, id)).orderBy(desc(projectStatusHistory.id));
const trustedReporter = () => createTestUser({ createdAt: new Date(Date.now() - 48 * 3_600_000) });

describe("publicarea: reguli de stare", () => {
  it("o ciornă se publică, iar un proiect pus în verificare automat poate fi retrimis de client", async () => {
    const client = await createTestUser({ isClient: true });
    const draft = await saveProject(client.id, await input(), { publish: false });
    expect(draft.status).toBe("draft");
    expect(await publishProject(draft.project.id, client.id)).toBe("open");

    const review = await insertProject(client.id, { status: "pending_review", moderationNote: "Posibil duplicat", publishedAt: null });
    expect(await publishProject(review.id, client.id)).toBe("open");
    const after = await load(review.id);
    expect(after.moderationNote).toBeNull();
    expect((await history(review.id))[0]).toMatchObject({ fromStatus: "pending_review", toStatus: "open" });
  });

  it.each(["removed", "closed", "cancelled", "in_progress"] as const)("un proiect „%s” nu poate fi republicat", async (status) => {
    const client = await createTestUser({ isClient: true });
    const p = await insertProject(client.id, { status });
    await expect(publishProject(p.id, client.id)).rejects.toMatchObject({ code: "state" });
    expect((await load(p.id)).status).toBe(status);
    expect(await history(p.id)).toHaveLength(0);
  });

  it("publicarea unui proiect deja deschis nu are efecte (fără istoric, fără anunțuri noi)", async () => {
    const client = await createTestUser({ isClient: true });
    const p = await insertProject(client.id);
    expect(await publishProject(p.id, client.id)).toBe("open");
    expect(await history(p.id)).toHaveLength(0);
  });

  it("doar proprietarul poate publica", async () => {
    const client = await createTestUser({ isClient: true });
    const other = await createTestUser({ isClient: true });
    const p = await insertProject(client.id, { status: "draft", publishedAt: null });
    await expect(publishProject(p.id, other.id)).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("raportări", () => {
  it("3 raportori de încredere blochează proiectul; clientul nu-l poate retrimite sau edita", async () => {
    const client = await createTestUser({ isClient: true });
    const admin = await createTestUser({ role: "admin" });
    const saved = await saveProject(client.id, await input({ title: "Proiect raportat de utilizatori verificați" }), { publish: true });
    expect(saved.status).toBe("open");
    const id = saved.project.id;

    for (const reason of ["spam", "fraud"] as const) await createReport((await trustedReporter()).id, { targetType: "project", targetId: id, reason });
    expect((await load(id)).status).toBe("open");
    await createReport((await trustedReporter()).id, { targetType: "project", targetId: id, reason: "fake_project" });

    const p = await load(id);
    expect(p).toMatchObject({ status: "pending_review", moderationLock: true, moderationNote: "Raportat de mai mulți utilizatori" });
    expect((await history(id))[0]).toMatchObject({ fromStatus: "open", toStatus: "pending_review" });
    const [adminNote] = await db.select().from(notifications).where(and(eq(notifications.userId, admin.id), eq(notifications.type, "admin.project_reported")));
    expect(adminNote?.link).toBe("/admin/rapoarte");
    const [ownerNote] = await db.select().from(notifications).where(and(eq(notifications.userId, client.id), eq(notifications.type, "project.reported")));
    expect(ownerNote).toBeTruthy();

    await expect(publishProject(id, client.id)).rejects.toMatchObject({ code: "locked", message: expect.stringContaining("un administrator") });
    await expect(saveProject(client.id, await input({ title: "Titlu schimbat de client după raportări" }), { projectId: id, publish: true })).rejects.toMatchObject({
      code: "locked",
    });
    expect((await load(id)).status).toBe("pending_review");
  });

  it("raportările conturilor noi, neconfirmate sau neconfigurate nu blochează proiectul", async () => {
    const client = await createTestUser({ isClient: true });
    const p = await insertProject(client.id);
    const untrusted = [
      await createTestUser(), // cont creat acum
      await createTestUser({ createdAt: new Date(Date.now() - 48 * 3_600_000), emailVerifiedAt: null }),
      await createTestUser({ createdAt: new Date(Date.now() - 48 * 3_600_000), onboardedAt: null }),
      await createTestUser({ createdAt: new Date(Date.now() - 48 * 3_600_000), bannedAt: new Date() }),
    ];
    for (const u of untrusted) await createReport(u.id, { targetType: "project", targetId: p.id, reason: "spam" });
    // Și același raportor de mai multe ori se socotește o singură dată.
    const one = await trustedReporter();
    await createReport(one.id, { targetType: "project", targetId: p.id, reason: "spam" });
    await createReport(one.id, { targetType: "project", targetId: p.id, reason: "fraud" });
    expect(await load(p.id)).toMatchObject({ status: "open", moderationLock: false });
    expect(await db.select().from(reports).where(eq(reports.targetId, p.id))).toHaveLength(5);
  });

  it("doar administratorul deblochează: aprobarea republică proiectul și închide raportările", async () => {
    const client = await createTestUser({ isClient: true });
    const admin = await createTestUser({ role: "admin" });
    const p = await insertProject(client.id, { expiresAt: new Date(Date.now() + 5 * 86_400_000) });
    for (let i = 0; i < 3; i++) await createReport((await trustedReporter()).id, { targetType: "project", targetId: p.id, reason: "spam" });
    expect((await load(p.id)).moderationLock).toBe(true);

    await approveProject(p.id, admin.id);
    const after = await load(p.id);
    expect(after).toMatchObject({ status: "open", moderationLock: false, moderationNote: null });
    // Data publicării și expirarea inițiale se păstrează.
    expect(after.expiresAt?.getTime()).toBe(p.expiresAt?.getTime());
    const open = await db.select().from(reports).where(and(eq(reports.targetId, p.id), eq(reports.status, "open")));
    expect(open).toHaveLength(0);

    // O raportare nouă nu îl blochează imediat din nou.
    await createReport((await trustedReporter()).id, { targetType: "project", targetId: p.id, reason: "spam" });
    expect((await load(p.id)).status).toBe("open");
  });
});

describe("editarea unui proiect publicat", () => {
  async function published(clientId: string, title: string) {
    const res = await saveProject(clientId, await input({ title }), { publish: true });
    expect(res.status).toBe("open");
    return load(res.project.id);
  }

  it("textul modificat trece din nou prin verificarea de duplicat; dacă e semnalat, intră în verificare", async () => {
    const client = await createTestUser({ isClient: true });
    const a = await published(client.id, "Magazin online pentru produse handmade");
    const b = await published(client.id, "Aplicație mobilă pentru o sală de fitness");

    const res = await saveProject(client.id, await input({ title: a.title }), { projectId: b.id, publish: true });
    expect(res).toMatchObject({ status: "pending_review", edited: true });
    expect(await load(b.id)).toMatchObject({ status: "pending_review", moderationLock: false, moderationNote: "Posibil duplicat al unui proiect existent" });
    expect((await history(b.id))[0]).toMatchObject({ fromStatus: "open", toStatus: "pending_review", reason: "Posibil duplicat al unui proiect existent" });
  });

  it("textul modificat trece din nou prin moderarea AI", async () => {
    const client = await createTestUser({ isClient: true });
    const p = await published(client.id, "Site pentru o pensiune din Bran");
    aiModerate.mockClear();
    aiModerate.mockResolvedValueOnce({ flagged: true, categories: ["harassment"] });
    const res = await saveProject(client.id, await input({ title: "Site pentru o pensiune din Bran", description: "Descriere nouă, complet schimbată, a proiectului pentru pensiunea noastră din Bran." }), {
      projectId: p.id,
      publish: true,
    });
    expect(aiModerate).toHaveBeenCalledTimes(1);
    expect(res.status).toBe("pending_review");
    expect((await load(p.id)).moderationNote).toBe("Conținut semnalat automat: harassment");
    expect((await history(p.id))[0]).toMatchObject({ fromStatus: "open", toStatus: "pending_review" });
  });

  it("modificările fără text nou rămân publicate, fără moderare și fără „republicare”", async () => {
    const client = await createTestUser({ isClient: true });
    const p = await published(client.id, "Logo și identitate vizuală pentru cafenea");
    const before = await history(p.id);
    aiModerate.mockClear();
    const res = await saveProject(client.id, await input({ title: "Logo și identitate vizuală pentru cafenea", budgetMax: 6000 }), { projectId: p.id, publish: true });
    expect(res).toMatchObject({ status: "open", edited: true });
    expect(aiModerate).not.toHaveBeenCalled();
    const after = await load(p.id);
    expect(after.budgetMax).toBe(6000);
    expect(after.publishedAt?.getTime()).toBe(p.publishedAt?.getTime());
    expect(await history(p.id)).toHaveLength(before.length);
  });
});
