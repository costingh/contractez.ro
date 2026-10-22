import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { categories, skills, type Skill } from "@/server/db/schema";
import { COMMUNITY_SKILL_MIN_PROVIDERS, getCatalog, invalidateCatalog, skillsForCategory } from "@/server/catalog/taxonomy";
import { saveProviderProfile } from "@/server/providers/service";
import { createTestUser } from "./helpers";

const skill = (id: number, name: string, categoryId: number | null): Skill => ({ id, slug: name.toLowerCase(), name, categoryId });

describe("skillsForCategory (filtrare pură)", () => {
  const tree = [{ id: 1, children: [{ id: 11 }, { id: 12 }] }, { id: 2, children: [{ id: 21 }] }] as never;
  const all = [skill(1, "Curatoriată", 11), skill(2, "Altă categorie", 21), skill(3, "Scrisă de un prestator", null), skill(4, "Populară", null)];

  it("sugerează doar competențele din taxonomie și pe cele folosite de mai mulți prestatori", () => {
    const catalog = { tree, skills: all, communitySkillCategory: new Map([[4, 12]]) };
    expect(skillsForCategory(catalog, 1).map((s) => s.name)).toEqual(["Curatoriată", "Populară"]);
    expect(skillsForCategory(catalog, 11).map((s) => s.name)).toEqual(["Curatoriată"]);
    expect(skillsForCategory(catalog, 12).map((s) => s.name)).toEqual(["Populară"]);
    expect(skillsForCategory(catalog, 2).map((s) => s.name)).toEqual(["Altă categorie"]);
  });
});

describe("competențele scrise de prestatori", () => {
  async function input(categoryId: number, skillNames: string[]) {
    return {
      headline: "Instalator autorizat",
      bio: "Lucrez de peste zece ani la instalații sanitare și termice pentru locuințe.",
      pricingModel: "hourly",
      remote: true,
      onSite: false,
      categoryIds: [categoryId],
      skills: skillNames,
      issuesInvoice: false,
      legalEntity: "none",
    };
  }

  it(`rămân necategorisite și apar ca sugestii abia după ${COMMUNITY_SKILL_MIN_PROVIDERS} prestatori`, async () => {
    const [cat] = await db.select().from(categories).where(eq(categories.slug, "dezvoltare-web"));
    const name = `Competență rară ${Date.now()}`;
    const suggested = async () => {
      invalidateCatalog();
      return skillsForCategory(await getCatalog(), cat.id).some((s) => s.name === name);
    };

    for (let i = 1; i <= COMMUNITY_SKILL_MIN_PROVIDERS; i++) {
      const u = await createTestUser({ isProvider: true });
      await saveProviderProfile(u.id, await input(cat.id, [name]));
      if (i === 1) {
        const [row] = await db.select().from(skills).where(eq(skills.name, name));
        expect(row.categoryId).toBeNull();
      }
      expect(await suggested()).toBe(i >= COMMUNITY_SKILL_MIN_PROVIDERS);
    }
  });

  it("competențele din taxonomie rămân sugerate și se refolosesc", async () => {
    invalidateCatalog();
    const catalog = await getCatalog();
    const seeded = catalog.skills.find((s) => s.categoryId !== null)!;
    expect(skillsForCategory(catalog, seeded.categoryId!).some((s) => s.id === seeded.id)).toBe(true);
    const u = await createTestUser({ isProvider: true });
    await saveProviderProfile(u.id, await input(seeded.categoryId!, [seeded.name]));
    const [row] = await db.select().from(skills).where(eq(skills.slug, seeded.slug));
    expect(row.categoryId).toBe(seeded.categoryId);
  });
});
