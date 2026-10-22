import { describe, expect, it } from "vitest";
import { posts } from "@/content/blog/posts";
import { postSources } from "@/content/blog/sources";
import { categoryGuideSlugs, getCategoryGuide } from "@/content/category-guides";
import { parsePriceRange } from "@/content/category-guides/price-spec";
import { metaDescription, pageTitle } from "@/lib/seo";

describe("parsePriceRange", () => {
  it("citește intervalele în lei, cu unitate și separator de mii", () => {
    expect(parsePriceRange("70–130 lei/mp")).toEqual({ min: 70, max: 130, unit: "mp" });
    expect(parsePriceRange("5.000–10.000 lei")).toEqual({ min: 5000, max: 10000, unit: null });
    expect(parsePriceRange("de la 300 lei")).toEqual({ min: 300, max: null, unit: null });
    expect(parsePriceRange("1,5–3 lei/km")).toEqual({ min: 1.5, max: 3, unit: "km" });
    expect(parsePriceRange("100–200 lei/angajat/lună")).toEqual({ min: 100, max: 200, unit: "angajat/lună" });
  });

  it("ignoră procentele și formatele necunoscute", () => {
    expect(parsePriceRange("5–10% din preț")).toBeNull();
    expect(parsePriceRange("1–3 salarii brute ale postului")).toBeNull();
  });

  it("citește aproape toate prețurile din ghiduri, cu minimul sub maxim", () => {
    let total = 0;
    let parsed = 0;
    for (const slug of categoryGuideSlugs) {
      for (const p of getCategoryGuide(slug)?.prices ?? []) {
        total++;
        const spec = parsePriceRange(p.range);
        if (!spec) continue;
        parsed++;
        if (spec.max !== null) expect(spec.min, `${slug}: ${p.range}`).toBeLessThanOrEqual(spec.max);
      }
    }
    // Rămân pe dinafară doar procentele și „salarii” (câteva rânduri).
    expect(total - parsed).toBeLessThanOrEqual(5);
  });
});

describe("sursele articolelor", () => {
  it("fiecare articol are cel puțin 2 surse https, fără concurenți", () => {
    for (const p of posts) {
      const list = postSources[p.slug] ?? [];
      expect(list.length, p.slug).toBeGreaterThanOrEqual(2);
      for (const s of list) {
        expect(s.url, p.slug).toMatch(/^https:\/\//);
        expect(s.url, p.slug).not.toMatch(/brig\.ro|daibau\.ro|homerun\.ro|cautajutor\.ro|necesit\.ro|olx\.ro|publi24\.ro/);
        expect(s.accessed, p.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it("nu au surse pentru articole inexistente", () => {
    const slugs = new Set(posts.map((p) => p.slug));
    expect(Object.keys(postSources).filter((s) => !slugs.has(s))).toEqual([]);
  });
});

describe("titluri și descrieri", () => {
  it("păstrează sufixul site-ului doar când titlul încape", () => {
    expect(pageTitle("Cum funcționează")).toBe("Cum funcționează");
    expect(pageTitle("Cât costă renovarea unei băi în 2026: prețuri și etape")).toEqual({
      absolute: "Cât costă renovarea unei băi în 2026: prețuri și etape",
    });
  });

  it("taie descrierile lungi la un cuvânt întreg", () => {
    const d = metaDescription("cuvânt ".repeat(40).trim());
    expect(d.length).toBeLessThanOrEqual(158);
    expect(d.endsWith("…")).toBe(true);
    expect(d).not.toMatch(/ …$/);
  });
});
