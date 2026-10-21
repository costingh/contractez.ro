import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import { plans, site } from "@/config/site";
import { mdxToMarkdown, postToMarkdown, readPostSource } from "@/content/blog/markdown";
import { posts } from "@/content/blog/posts";
import { categoryGuideSlugs, getCategoryGuide, guideAnswer } from "@/content/category-guides";
import { buildLlmsFullTxt, buildLlmsTxt, popularSubcategories } from "@/content/llms";
import { priceGuideGroups, priceGuideStats } from "@/content/price-guide";
import { taxonomy } from "../db/seed-data/taxonomy";

const BASE = "https://contractez.test";
const subSlugs = new Set(taxonomy.flatMap((c) => c.subs.map((s) => s.slug)));

describe("/llms.txt", () => {
  const txt = buildLlmsTxt(BASE);

  it("respectă formatul llmstxt.org: H1, apoi un rezumat în blockquote", () => {
    const lines = txt.split("\n");
    expect(lines[0]).toBe(`# ${site.name}`);
    expect(lines[2].startsWith("> ")).toBe(true);
    expect(txt).toMatch(/^## Optional$/m);
  });

  it("listează fiecare articol, cu rezumatul și varianta markdown", () => {
    for (const p of posts) {
      expect(txt).toContain(`[${p.title}](${BASE}/blog/${p.slug})`);
      expect(txt).toContain(`${BASE}/blog/${p.slug}/md`);
      if (p.summary) expect(txt).toContain(p.summary);
    }
  });

  it("listează categoriile principale, subcategoriile populare, /despre, /ghid-preturi și /llms-full.txt", () => {
    for (const c of taxonomy) expect(txt).toContain(`(${BASE}/categorii/${c.slug})`);
    for (const s of popularSubcategories) expect(txt).toContain(`(${BASE}/categorii/${s})`);
    for (const p of ["/despre", "/ghid-preturi", "/llms-full.txt"]) expect(txt).toContain(`(${BASE}${p})`);
  });

  it("are prețurile abonamentelor din config", () => {
    for (const p of plans) expect(txt).toContain(`planul ${p.name}: ${p.priceLei === 0 ? "0 lei" : `${p.priceLei} lei/lună`}`);
  });

  it("folosește doar URL-uri absolute și diacritice corecte", () => {
    const links = [...txt.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);
    expect(links.length).toBeGreaterThan(50);
    expect(links.filter((l) => !l.startsWith(BASE))).toEqual([]);
    expect(txt).not.toMatch(/[şţŞŢ]/);
  });

  it("subcategoriile populare există în taxonomie", () => {
    expect(popularSubcategories.filter((s) => !subSlugs.has(s))).toEqual([]);
  });
});

describe("markdown pentru articole", () => {
  it("scoate comentariul cu surse și componentele JSX, păstrează tabelele, face legăturile absolute", () => {
    const md = mdxToMarkdown(
      [
        "{/* SURSE: ceva */}",
        "",
        "Text cu [link](/categorii/mutari).",
        "",
        "| A | B |",
        "|---|---|",
        "| 1 | 2 |",
        "",
        '<Callout type="tip" title="Titlu">',
        "Corp.",
        "</Callout>",
        "",
        '<Cta href="/categorii/mutari" title="Te muți?">Primești oferte.</Cta>',
      ].join("\n"),
      BASE,
    );
    expect(md).not.toContain("SURSE");
    expect(md).toContain(`[link](${BASE}/categorii/mutari)`);
    expect(md).toContain("| A | B |\n|---|---|\n| 1 | 2 |");
    expect(md).toContain("> **Titlu**\n>\n> Corp.");
    expect(md).toContain(`> **Te muți?** Primești oferte. [Vezi prestatori și prețuri](${BASE}/categorii/mutari)`);
    expect(md).not.toMatch(/<\/?(Callout|Cta)/);
  });

  it.each(posts)("$slug: markdown curat, cu tabele și întrebări frecvente", (p) => {
    const md = postToMarkdown(p, BASE);
    expect(md.startsWith(`# ${p.title}\n`)).toBe(true);
    expect(md).not.toMatch(/SURSE|\{\/\*|<Callout|<Cta|\]\(\//);
    expect(md).toMatch(/^\|.*\|$/m);
    expect(md).toContain("## Întrebări frecvente");
    expect(readPostSource(p.slug).length).toBeGreaterThan(md.length / 4);
  });
});

describe("/llms-full.txt", () => {
  const full = buildLlmsFullTxt(BASE);

  it("conține toate articolele și toate ghidurile de categorie, cu tabelul de prețuri", () => {
    for (const p of posts) expect(full).toContain(`# ${p.title}\n`);
    for (const slug of categoryGuideSlugs) {
      expect(full).toContain(`URL: ${BASE}/categorii/${slug}`);
      const row = getCategoryGuide(slug)!.prices?.[0];
      if (row) expect(full).toContain(`| ${row.item.replace(/\|/g, "\\|")} | ${row.range} |`);
    }
    expect(full).not.toMatch(/SURSE|<Callout|<Cta/);
  });
});

describe("/ghid-preturi", () => {
  const groups = priceGuideGroups();

  it("acoperă fiecare ghid care are prețuri și fiecare rând din ele", () => {
    const shown = new Set(groups.flatMap((g) => [...g.general, ...g.subs.flatMap((t) => t.rows)].map((r) => `${r.item}|${r.range}`)));
    const tables = new Set(groups.flatMap((g) => g.subs.map((t) => t.slug)));
    for (const slug of categoryGuideSlugs) {
      const prices = getCategoryGuide(slug)!.prices ?? [];
      if (subSlugs.has(slug) && prices.length) expect(tables.has(slug)).toBe(true);
      for (const r of prices) expect(shown.has(`${r.item}|${r.range}`)).toBe(true);
    }
  });

  it("grupează pe categoriile principale, în ordinea din taxonomie", () => {
    const order = taxonomy.map((c) => c.slug);
    expect(groups.map((g) => g.slug)).toEqual(order.filter((s) => groups.some((g) => g.slug === s)));
    const stats = priceGuideStats(groups);
    expect(stats.services).toBe(groups.reduce((n, g) => n + g.subs.length, 0));
    expect(stats.rows).toBeGreaterThan(400);
  });
});

describe("rezumate și răspunsuri directe", () => {
  it.each(posts)("$slug: rezumat „Pe scurt” de 2–3 fraze, cu cifre", (p) => {
    expect(p.summary).toBeTruthy();
    const sentences = p.summary!.split(/(?<=[.!?])\s+(?=[\p{Lu}„])/u);
    expect(sentences.length).toBeGreaterThanOrEqual(2);
    expect(sentences.length).toBeLessThanOrEqual(3);
    expect(p.summary).toMatch(/\d/);
    expect(p.summary).not.toMatch(/[şţŞŢ]/);
  });

  it.each(categoryGuideSlugs)("%s: primul paragraf începe cu prima frază din intro", (slug) => {
    const g = getCategoryGuide(slug)!;
    const answer = guideAnswer(g);
    expect(g.intro[0].startsWith(answer.split(" Preț orientativ")[0])).toBe(true);
    if (g.prices?.length) expect(answer).toContain(g.prices[0].range);
  });
});

describe("robots.txt", () => {
  it("permite explicit crawlerele AI, cu aceleași restricții ca `*`", () => {
    const rules = [robots().rules].flat();
    const star = rules.find((r) => r.userAgent === "*")!;
    const ai = rules.find((r) => Array.isArray(r.userAgent))!;
    for (const bot of ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "CCBot", "Bingbot", "meta-externalagent"]) {
      expect(ai.userAgent).toContain(bot);
    }
    expect(ai.disallow).toEqual(star.disallow);
    expect(star.disallow).toContain("/panou");
  });
});
