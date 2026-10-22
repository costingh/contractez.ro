import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { deleteAccount } from "@/server/account";
import { db } from "@/server/db";
import { applications, categories, portfolioItems, projects, providerProfiles, providerServices, users } from "@/server/db/schema";
import { createTestUser } from "./helpers";

describe("ștergerea contului (GDPR)", () => {
  it("șterge portofoliul și serviciile și eliberează locurile ocupate de aplicările retrase", async () => {
    const [cat] = await db.select().from(categories).where(eq(categories.slug, "dezvoltare-web"));
    const client = await createTestUser({ isClient: true });
    const v = await createTestUser({ isProvider: true, avatarPath: "public/avatars/3a7f0c1d-2b3e-4f5a-8b9c-0d1e2f3a4b5c.jpg" });
    await db.insert(providerProfiles).values({ userId: v.id, slug: `del-${v.id}` });
    await db.insert(portfolioItems).values({ providerId: v.id, title: "Lucrare", imagePath: "public/portfolio/3a7f0c1d-2b3e-4f5a-8b9c-0d1e2f3a4b5d.jpg" });
    await db.insert(providerServices).values({ providerId: v.id, categoryId: cat.id, title: "Site de prezentare", priceUnit: "project" });
    const [p] = await db
      .insert(projects)
      .values({
        clientId: client.id,
        title: "Site pentru cafenea",
        description: "Avem nevoie de un site de prezentare cu meniu și formular de contact.",
        categoryId: cat.id,
        status: "open",
        budgetType: "fixed",
        workMode: "remote",
        applicationsCount: 2,
        autoApplicationsCount: 1,
      })
      .returning();
    const other = await createTestUser({ isProvider: true });
    await db.insert(applications).values([
      { projectId: p.id, providerId: v.id, message: "Bună ziua, vă pot ajuta.", isAuto: true },
      { projectId: p.id, providerId: other.id, message: "Bună ziua, și eu." },
    ]);

    await deleteAccount(v.id);

    expect(await db.select().from(portfolioItems).where(eq(portfolioItems.providerId, v.id))).toHaveLength(0);
    expect(await db.select().from(providerServices).where(eq(providerServices.providerId, v.id))).toHaveLength(0);
    const [u] = await db.select().from(users).where(eq(users.id, v.id));
    expect(u.avatarPath).toBeNull();
    expect(u.deletedAt).toBeTruthy();
    const [app] = await db.select().from(applications).where(eq(applications.providerId, v.id));
    expect(app.status).toBe("withdrawn");
    const [after] = await db.select().from(projects).where(eq(projects.id, p.id));
    expect(after.applicationsCount).toBe(1);
    expect(after.autoApplicationsCount).toBe(0);
  });
});
