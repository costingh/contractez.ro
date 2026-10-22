import { and, desc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { applyToProject, hireApplication } from "@/server/applications/service";
import { db } from "@/server/db";
import { applications, categories, collaborations, emailLog, notifications, projectStatusHistory, projects, providerProfiles } from "@/server/db/schema";
import { cancelCollaboration, completeCollaboration, confirmCollaboration } from "@/server/trust/service";
import { createTestUser } from "./helpers";

const msg = "Bună ziua! Am realizat multe lucrări asemănătoare și vă pot ajuta rapid și corect.";

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

    await cancelCollaboration(collab.id, client.id);

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
    await cancelCollaboration(collab.id, provider.id);
    expect((await load(projects, project.id)).status).toBe("open");
    const [n] = await db.select().from(notifications).where(and(eq(notifications.userId, client.id), eq(notifications.type, "collab.cancelled")));
    expect(n).toMatchObject({ link: `/proiectele-mele/${project.id}` });
    expect(n.title).toContain("Prestatorul a anulat colaborarea");
  });

  it("un proiect expirat între timp se închide în loc să se redeschidă", async () => {
    const { client, project, collab } = await setup();
    await db.update(projects).set({ expiresAt: new Date(Date.now() - 60_000) }).where(eq(projects.id, project.id));
    await cancelCollaboration(collab.id, client.id);
    const after = await load(projects, project.id);
    expect(after.status).toBe("closed");
    expect(after.closedAt).not.toBeNull();
    const [h] = await db.select().from(projectStatusHistory).where(eq(projectStatusHistory.projectId, project.id)).orderBy(desc(projectStatusHistory.id));
    expect(h).toMatchObject({ fromStatus: "in_progress", toStatus: "closed" });
  });

  it("anularea e idempotentă, iar o colaborare finalizată nu poate fi anulată", async () => {
    const { client, provider, collab } = await setup();
    await Promise.all([cancelCollaboration(collab.id, client.id), cancelCollaboration(collab.id, client.id)]);
    const sent = await db.select().from(notifications).where(and(eq(notifications.userId, provider.id), eq(notifications.type, "collab.cancelled")));
    expect(sent).toHaveLength(1);

    const second = await setup();
    await confirmCollaboration(second.collab.id, second.provider.id);
    await completeCollaboration(second.collab.id, second.client.id);
    await expect(cancelCollaboration(second.collab.id, second.client.id)).rejects.toMatchObject({ code: "state" });
  });

  it("alți utilizatori nu pot anula colaborarea", async () => {
    const { collab } = await setup();
    const outsider = await createTestUser();
    await expect(cancelCollaboration(collab.id, outsider.id)).rejects.toMatchObject({ code: "not_found" });
  });
});
