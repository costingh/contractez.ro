import { describe, expect, it } from "vitest";
import { cities, citiesBySlug, cityServices, indexedCityPages } from "@/content/cities";
import { taxonomy } from "../db/seed-data/taxonomy";

const subSlugs = new Set(taxonomy.flatMap((c) => c.subs.map((s) => s.slug)));

describe("paginile categorie × oraș", () => {
  it("folosesc doar subcategorii existente", () => {
    expect(Object.keys(cityServices).filter((s) => !subSlugs.has(s))).toEqual([]);
  });

  it("au slug-uri de oraș unice", () => {
    expect(new Set(cities.map((c) => c.slug)).size).toBe(cities.length);
  });

  it("indexează doar combinații valide", () => {
    const invalid = [...indexedCityPages].filter((key) => {
      const [cat, city] = key.split("/");
      return !cityServices[cat] || !citiesBySlug.has(city);
    });
    expect(invalid).toEqual([]);
  });
});
