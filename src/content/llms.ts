/**
 * /llms.txt și /llms-full.txt (formatul de la https://llmstxt.org): un rezumat al site-ului pentru asistenții AI,
 * cu legături absolute, și textul complet al articolelor și al ghidurilor de categorie.
 * Totul se compune din config și din conținutul existent; nimic nu e copiat de mână.
 */
import { site } from "@/config/site";
import { pluralRo } from "@/lib/text";
import { taxonomy } from "../../db/seed-data/taxonomy";
import { aboutDefinition, clientSteps, coverageText, notDoing, pricingFacts, providerSteps, verificationFacts } from "./about";
import { postToMarkdown } from "./blog/markdown";
import { posts, type Post } from "./blog/posts";
import { categoryGuideSlugs, getCategoryGuide, guideAnswer, guidesUpdated } from "./category-guides";
import { guideToMarkdown } from "./category-guides/markdown";
import { cities, cityServices, isCityHubIndexed, isCityPageIndexedByDefault } from "./cities";

/** Subcategoriile cu cea mai mare cerere (vezi docs/SEO-KEYWORDS.md), listate separat în /llms.txt. */
export const popularSubcategories = [
  "renovari-complete",
  "gresie-faianta",
  "finisaje",
  "instalatii-electrice",
  "instalatii-sanitare",
  "instalatii-termice",
  "aer-conditionat",
  "topografie-cadastru",
  "traduceri",
  "mutari",
  "debarasare",
  "curatenie",
  "dezinsectie",
  "electrocasnice",
  "contabilitate",
  "site-prezentare",
  "magazin-online",
  "fotografie",
  "muzica-dj",
  "meditatii",
];

const subsBySlug = new Map(taxonomy.flatMap((root) => root.subs.map((s) => [s.slug, { ...s, root }] as const)));

function sortedPosts(): Post[] {
  return [...posts].sort((a, b) => (b.updated ?? b.date).localeCompare(a.updated ?? a.date) || a.title.localeCompare(b.title, "ro"));
}

function answerFor(slug: string) {
  const guide = getCategoryGuide(slug);
  return guide ? guideAnswer(guide) : undefined;
}

const list = (items: string[]) => items.map((i) => `- ${i}`).join("\n");
const link = (title: string, url: string, note?: string) => `- [${title}](${url})${note ? `: ${note}` : ""}`;

/** Paragrafele cu faptele de bază, comune ambelor fișiere. */
function factsSection() {
  return [
    `**Lansare:** ${site.launched.label}. **Operator:** ${site.operator}. **Contact:** ${site.supportEmail}.`,
    `**In English:** ${site.name} is a Romanian services marketplace (launched ${site.launched.iso}). Clients post a project for free and receive a limited number of offers from verified, compatible providers; providers pay an optional monthly subscription and there is no commission on the work.`,
    `**Cum funcționează pentru clienți:**\n\n${list(clientSteps)}`,
    `**Cum funcționează pentru prestatori:**\n\n${list(providerSteps)}`,
    `**Prețuri:**\n\n${list(pricingFacts)}`,
    `**Verificare:**\n\n${list(verificationFacts)}`,
    `**Ce nu face ${site.name}:**\n\n${list(notDoing)}`,
    `**Acoperire:** ${coverageText}`,
  ].join("\n\n");
}

export function buildLlmsTxt(baseUrl: string): string {
  const u = (p: string) => `${baseUrl}${p}`;
  const keyPages = [
    link("Despre Contractez", u("/despre"), "ce este platforma, cine o operează, cum funcționează, verificare, abonamente"),
    link("Cum funcționează", u("/cum-functioneaza"), "pașii pentru clienți și prestatori, scorul de compatibilitate, regulile de încredere"),
    link("Abonamente pentru prestatori", u("/preturi"), "planurile Gratuit, Pro și Business"),
    link(`Ghid de prețuri 2026`, u("/ghid-preturi"), `toate prețurile orientative pentru servicii din România, pe o singură pagină (actualizate ${guidesUpdated})`),
    link("Blog: ghiduri și prețuri", u("/blog")),
    link("Proiecte deschise", u("/proiecte"), "cererile publicate de clienți"),
    link("Prestatori", u("/prestatori"), "căutare de prestatori după categorie și localitate"),
    link("Contact", u("/contact")),
    link("Text complet pentru asistenți AI", u("/llms-full.txt"), "toate articolele și ghidurile de categorie, în markdown"),
  ];
  const blog = sortedPosts().map((p) => link(p.title, u(`/blog/${p.slug}`), `${p.summary ?? p.description} Markdown: ${u(`/blog/${p.slug}/md`)}`));
  const roots = taxonomy.map((r) => link(r.name, u(`/categorii/${r.slug}`), answerFor(r.slug) ?? r.description));
  const popular = popularSubcategories.flatMap((slug) => {
    const s = subsBySlug.get(slug);
    if (!s) return [];
    return [link(`${s.name} (${s.root.name})`, u(`/categorii/${slug}`), answerFor(slug))];
  });
  const hubs = cities.filter(isCityHubIndexed).map((c) => {
    const services = Object.keys(cityServices).filter((slug) => isCityPageIndexedByDefault(slug, c));
    return link(`Prestatori în ${c.name}`, u(`/orase/${c.slug}`), services.map((slug) => `${cityServices[slug].plural} (${u(`/categorii/${slug}/${c.slug}`)})`).join(", "));
  });

  return (
    [
      `# ${site.name}`,
      `> ${aboutDefinition} Site-ul are ghiduri cu prețuri orientative pentru ${pluralRo(categoryGuideSlugs.length, "categorie", "categorii")} de servicii din România, actualizate în ${guidesUpdated}.`,
      factsSection(),
      `## Pagini principale\n\n${keyPages.join("\n")}`,
      `## Articole\n\n${blog.join("\n")}`,
      `## Ghiduri pe categorii\n\n${roots.join("\n")}`,
      `## Servicii căutate des\n\n${popular.join("\n")}`,
      `## Orașe\n\n${hubs.join("\n")}`,
      `## Optional\n\n${[
        link("Termeni și condiții", u("/termeni")),
        link("Politica de confidențialitate", u("/confidentialitate")),
        link("Toate orașele", u("/orase")),
      ].join("\n")}`,
    ].join("\n\n") + "\n"
  );
}

export function buildLlmsFullTxt(baseUrl: string): string {
  const guides = taxonomy.flatMap((root) =>
    [{ slug: root.slug, name: root.name, parentName: undefined as string | undefined }, ...root.subs.map((s) => ({ ...s, parentName: root.name }))].flatMap((c) => {
      const guide = getCategoryGuide(c.slug);
      return guide ? [guideToMarkdown({ name: c.name, slug: c.slug, parentName: c.parentName, guide, baseUrl })] : [];
    }),
  );
  const header = [
    `# ${site.name}: text complet`,
    `> ${aboutDefinition} Fișierul conține toate articolele de pe ${baseUrl}/blog și toate ghidurile de categorie (prețuri orientative actualizate în ${guidesUpdated}). Rezumatul cu legături: ${baseUrl}/llms.txt.`,
    factsSection(),
  ].join("\n\n");
  return [header, ...sortedPosts().map((p) => postToMarkdown(p, baseUrl).trim()), ...guides.map((g) => g.trim())].join("\n\n---\n\n") + "\n";
}
