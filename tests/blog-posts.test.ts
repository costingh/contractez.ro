import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { posts } from "@/content/blog/posts";
import { taxonomy } from "../db/seed-data/taxonomy";

const dir = path.resolve(import.meta.dirname, "../src/content/blog");
const files = readdirSync(dir).filter((f) => f.endsWith(".mdx")).map((f) => f.replace(/\.mdx$/, ""));
const slugs = new Set(taxonomy.flatMap((c) => [c.slug, ...c.subs.map((s) => s.slug)]));

describe("blog", () => {
  it("fiecare articol înregistrat are fișier MDX și invers", () => {
    expect(posts.map((p) => p.slug).sort()).toEqual([...files].sort());
  });

  it.each(posts)("$slug: metadate valide", (p) => {
    expect(p.title.length).toBeLessThanOrEqual(65);
    expect(p.description.length).toBeGreaterThanOrEqual(110);
    expect(p.description.length).toBeLessThanOrEqual(160);
    expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(p.categories.filter((c) => !slugs.has(c))).toEqual([]);
    const body = readFileSync(path.join(dir, `${p.slug}.mdx`), "utf8");
    expect(body).not.toMatch(/[şţŞŢ]/);
    expect(body).toMatch(/## Întrebări frecvente/);
  });
});
