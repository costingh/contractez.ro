import { and, desc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { applyToProject, hireApplication } from "@/server/applications/service";
import { db } from "@/server/db";
import { applications, categories, collaborationFeedback, collaborations, emailLog, notifications, projectStatusHistory, projects, providerProfiles, reviews } from "@/server/db/schema";
import { cancelCollaboration, completeCollaboration, confirmCollaboration, leaveReview } from "@/server/trust/service";
import { createTestUser } from "./helpers";

const msg = "Bună ziua! Am realizat multe lucrări asemănătoare și vă pot ajuta rapid și corect.";
const feedback = { rating: 2, comment: "Nu ne-am înțeles asupra termenului de livrare." };
const cancel = (id: string, userId: string, reopen?: boolean) => cancelCollaboration(id, userId, { feedback, reopen });

async function setup(projectOverrides: Partial<typeof projects.$inferInsert> = {}) {
  const [cat] = await db.select().from(categories).where(eq(categories.slug, "dezvoltare-web"));
  const client = await createTestUser({ isClient: true, name: "Client Colaborare" });
  const provider = await createTestUser({ isProvider: true, name: "Prestator Colaborare" });
  await db.insert(providerProfiles).values({ userId: provider.id, slug: `collab-${provider.id}` });
  const [project] = await db
    .insert(projects)
    .values({
      clientId: client.id,
      title: "Aplicație web pentru o școală de șoferi",
      description: "Avem nevoie de o aplicație web pentru programarea orelor de condus și evidența cursanților.",
      categoryId: cat.id,
      status: "open",
      workMode: "remote",
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 86_400_000),
      ...projectOverrides,
    })
    .returning();
  const app = await applyToProject({ providerId: provider.id, projectId: project.id, message: msg });
  const collab = (await hireApplication(app.id, client.id))!;
  return { client, provider, project, app, collab };
}

const load = async <T extends typeof projects | typeof applications | typeof collaborations>(table: T, id: string) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (await db.select().from(table as any).where(eq((table as any).id, id)))[0] as T["$inferSelect"];

describe("anularea colaborării", () => {
  it("clientul anulează: proiectul se redeschide, oferta devine respinsă, prestatorul e anunțat în aplicație și pe email", async () => {
    const { client, provider, project, app, collab } = await setup();
    expect((await load(projects, project.id)).status).toBe("in_progress");

    await cancel(collab.id, client.id);

    expect((await load(collaborations, collab.id)).status).toBe("cancelled");
    expect(await load(applications, app.id)).toMatchObject({ status: "rejected", rejectionReason: "Colaborare anulată" });
    expect((await load(projects, project.id)).status).toBe("open");
    const [h] = await db.select().from(projectStatusHistory).where(eq(projectStatusHistory.projectId, project.id)).orderBy(desc(projectStatusHistory.id));
    expect(h).toMatchObject({ fromStatus: "in_progress", toStatus: "open", actorId: client.id });

    const [n] = await db.select().from(notifications).where(and(eq(notifications.userId, provider.id), eq(notifications.type, "collab.cancelled")));
    expect(n?.title).toContain("Clientul a anulat colaborarea");
    const [mail] = await db.select().from(emailLog).where(and(eq(emailLog.to, provider.email), eq(emailLog.template, "collab.cancelled")));
    expect(mail?.subject).toContain("Colaborare anulată");

    // Proiectul redeschis poate primi o altă alegere (indexul unic ignoră colaborările anulate).
    const other = await createTestUser({ isProvider: true });
    await db.insert(providerProfiles).values({ userId: other.id, slug: `collab-${other.id}` });
    const app2 = await applyToProject({ providerId: other.id, projectId: project.id, message: msg });
    expect(await hireApplication(app2.id, client.id)).toBeTruthy();
  });

  it("prestatorul anulează o colaborare confirmată: clientul e anunțat", async () => {
    const { client, provider, project, collab } = await setup();
    await confirmCollaboration(collab.id, provider.id);
    await cancel(collab.id, provider.id);
    expect((await load(projects, project.id)).status).toBe("open");
    const [n] = await db.select().from(notifications).where(and(eq(notifications.userId, client.id), eq(notifications.type, "collab.cancelled")));
    expect(n).toMatchObject({ link: `/proiectele-mele/${project.id}` });
    expect(n.title).toContain("Prestatorul a anulat colaborarea");
  });

  it("prestatorul anulează și proiectul a expirat între timp: se închide în loc să se redeschidă", async () => {
    const { provider, project, collab } = await setup();
    await db.update(projects).set({ expiresAt: new Date(Date.now() - 60_000) }).where(eq(projects.id, project.id));
    await cancel(collab.id, provider.id);
    const after = await load(projects, project.id);
    expect(after.status).toBe("closed");
    expect(after.closedAt).not.toBeNull();
    const [h] = await db.select().from(projectStatusHistory).where(eq(projectStatusHistory.projectId, project.id)).orderBy(desc(projectStatusHistory.id));
    expect(h).toMatchObject({ fromStatus: "in_progress", toStatus: "closed" });
  });

  it("anularea e idempotentă, iar o colaborare finalizată nu poate fi anulată", async () => {
    const { client, provider, collab } = await setup();
    await Promise.all([cancel(collab.id, client.id), cancel(collab.id, client.id)]);
    const sent = await db.select().from(notifications).where(and(eq(notifications.userId, provider.id), eq(notifications.type, "collab.cancelled")));
    expect(sent).toHaveLength(1);

    const second = await setup();
    await confirmCollaboration(second.collab.id, second.provider.id);
    await completeCollaboration(second.collab.id, second.client.id, { rating: 5 });
    await expect(cancel(second.collab.id, second.client.id)).rejects.toMatchObject({ code: "state" });
  });

  it("alți utilizatori nu pot anula colaborarea", async () => {
    const { collab } = await setup();
    const outsider = await createTestUser();
    await expect(cancel(collab.id, outsider.id)).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("încheierea colaborării: feedback și aplicări", () => {
  it("clientul redeschide aplicările: locuri noi, termen nou dacă expirase, feedback privat (colaborare neconfirmată)", async () => {
    const { client, provider, project, collab } = await setup({ maxApplications: 1 });
    expect((await load(projects, project.id)).applicationsCount).toBe(1);
    await db.update(projects).set({ expiresAt: new Date(Date.now() - 60_000) }).where(eq(projects.id, project.id));

    await cancel(collab.id, client.id, true);

    const after = await load(projects, project.id);
    expect(after.status).toBe("open");
    expect(after.maxApplications).toBe(6); // 1 ofertă socotită + 5 locuri noi
    expect(after.expiresAt!.getTime()).toBeGreaterThan(Date.now() + 29 * 86_400_000);
    const [f] = await db.select().from(collaborationFeedback).where(eq(collaborationFeedback.collaborationId, collab.id));
    expect(f).toMatchObject({ authorId: client.id, rating: 2, comment: feedback.comment });
    expect(await db.select().from(reviews).where(eq(reviews.collaborationId, collab.id))).toEqual([]);

    // Prestatorul e rugat să lase și el feedback; rămâne privat și o singură dată.
    const [n] = await db.select().from(notifications).where(and(eq(notifications.userId, provider.id), eq(notifications.type, "collab.cancelled")));
    expect(n).toMatchObject({ link: "/colaborari" });
    await leaveReview(collab.id, provider.id, { rating: 4, comment: "" });
    expect(await db.select().from(collaborationFeedback).where(eq(collaborationFeedback.collaborationId, collab.id))).toHaveLength(2);
    await expect(leaveReview(collab.id, provider.id, { rating: 4 })).rejects.toMatchObject({ code: "duplicate" });
  });

  it("clientul închide proiectul la anulare: nu mai primește oferte", async () => {
    const { client, project, collab } = await setup();
    await cancel(collab.id, client.id, false);
    const after = await load(projects, project.id);
    expect(after).toMatchObject({ status: "closed" });
    expect(after.closedAt).not.toBeNull();
    const [h] = await db.select().from(projectStatusHistory).where(eq(projectStatusHistory.projectId, project.id)).orderBy(desc(projectStatusHistory.id));
    expect(h).toMatchObject({ fromStatus: "in_progress", toStatus: "closed", reason: "Colaborare anulată de client; proiect închis" });
  });

  it("anularea cere un motiv; fără el nu se schimbă nimic", async () => {
    const { client, project, collab } = await setup();
    await expect(cancelCollaboration(collab.id, client.id, { feedback: { rating: 3, comment: "nu" } })).rejects.toThrow();
    await expect(cancelCollaboration(collab.id, client.id, { feedback: { comment: "Motiv suficient de lung aici." } })).rejects.toThrow();
    expect((await load(collaborations, collab.id)).status).toBe("pending_confirmation");
    expect((await load(projects, project.id)).status).toBe("in_progress");
  });

  it("o colaborare confirmată, anulată sau finalizată, produce recenzii publice de la ambele părți", async () => {
    const a = await setup();
    await confirmCollaboration(a.collab.id, a.provider.id);
    await cancel(a.collab.id, a.provider.id);
    await leaveReview(a.collab.id, a.client.id, { rating: 3, comment: "A anulat după prima săptămână." });
    expect(await db.select().from(reviews).where(eq(reviews.collaborationId, a.collab.id))).toHaveLength(2);
    expect(await db.select().from(collaborationFeedback).where(eq(collaborationFeedback.collaborationId, a.collab.id))).toEqual([]);

    const b = await setup();
    await confirmCollaboration(b.collab.id, b.provider.id);
    await expect(completeCollaboration(b.collab.id, b.client.id, {})).rejects.toThrow();
    expect((await load(collaborations, b.collab.id)).status).toBe("active");
    await completeCollaboration(b.collab.id, b.client.id, { rating: 5, comment: "Totul a fost perfect." });
    const [r] = await db.select().from(reviews).where(eq(reviews.collaborationId, b.collab.id));
    expect(r).toMatchObject({ authorId: b.client.id, targetId: b.provider.id, rating: 5 });
    await leaveReview(b.collab.id, b.provider.id, { rating: 5 });
    expect(await db.select().from(reviews).where(eq(reviews.collaborationId, b.collab.id))).toHaveLength(2);
  });
});
