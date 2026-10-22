import { describe, expect, it } from "vitest";
import { cities, citiesBySlug, cityServices, indexedCityPages } from "@/content/cities";
import { cityAuthorities } from "@/content/city-authorities";
import { cityFacts } from "@/content/city-facts";
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

describe("datele locale ale orașelor", () => {
  it("există pentru fiecare oraș, cu cartiere și OCPI", () => {
    for (const c of cities) {
      expect(cityFacts[c.slug], c.slug).toBeDefined();
      expect(cityFacts[c.slug].neighborhoods.length, c.slug).toBeGreaterThanOrEqual(5);
      expect(cityFacts[c.slug].ocpi, c.slug).toMatch(/^OCPI /);
    }
  });

  it("autoritățile locale există pentru fiecare oraș", () => {
    for (const c of cities) expect(cityAuthorities[c.slug], c.slug).toBeDefined();
  });
});

describe("combinațiile indexate au un bloc local concret", () => {
  it("cadastru: OCPI cu adresă; centrale: distribuitor de gaze și ISCIR; traduceri: curtea de apel", () => {
    for (const key of indexedCityPages) {
      const [cat, slug] = key.split("/");
      if (cat === "topografie-cadastru") expect(cityFacts[slug]?.ocpiAddress, key).toBeTruthy();
      if (cat === "instalatii-termice") {
        expect(cityFacts[slug]?.gasDistributor, key).toBeTruthy();
        expect(cityAuthorities[slug]?.iscir.name, key).toMatch(/^ISCIR/);
      }
      if (cat === "traduceri") expect(cityAuthorities[slug]?.courtOfAppeal, key).toMatch(/^Curtea de Apel /);
    }
  });
});
