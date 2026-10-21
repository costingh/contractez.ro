import { describe, expect, it } from "vitest";
import { categoryGuideSlugs, getCategoryGuide } from "@/content/category-guides";
import { taxonomy } from "../db/seed-data/taxonomy";

const slugs = taxonomy.flatMap((c) => [c.slug, ...c.subs.map((s) => s.slug)]);

describe("ghidurile de categorie", () => {
  it("există pentru fiecare categorie și subcategorie", () => {
    expect(slugs.filter((s) => !getCategoryGuide(s))).toEqual([]);
  });

  it("nu au chei care nu mai există în taxonomie", () => {
    expect(categoryGuideSlugs.filter((s) => !slugs.includes(s))).toEqual([]);
  });

  it.each(slugs)("%s: titlu și descriere de lungime potrivită, conținut complet", (slug) => {
    const g = getCategoryGuide(slug)!;
    expect(g.seoTitle.length).toBeLessThanOrEqual(65);
    expect(g.metaDescription.length).toBeGreaterThanOrEqual(90);
    expect(g.metaDescription.length).toBeLessThanOrEqual(165);
    expect(g.intro.length).toBeGreaterThanOrEqual(2);
    expect(g.faq.length).toBeGreaterThanOrEqual(3);
    // Diacritice corecte: virgulă dedesubt, nu sedilă.
    expect(JSON.stringify(g)).not.toMatch(/[şţŞŢ]/);
    const isSub = taxonomy.some((c) => c.subs.some((s) => s.slug === slug));
    if (isSub) {
      expect(g.prices?.length ?? 0).toBeGreaterThanOrEqual(4);
      expect(g.checklist?.length ?? 0).toBeGreaterThanOrEqual(3);
    }
  });
});
