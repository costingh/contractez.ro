/**
 * Varianta markdown a articolelor (pentru /blog/[slug]/md și /llms-full.txt): sursa MDX, fără comentariul
 * cu surse și fără componente JSX, cu legăturile interne absolute. Tabelele rămân în format GFM.
 *
 * Fișierele .mdx se citesc de pe disc, deci rutele care folosesc modulul trebuie trecute în
 * `outputFileTracingIncludes` din next.config.ts (altfel nu ajung în imaginea standalone).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { site } from "@/config/site";
import type { Post } from "./posts";
import { postSources } from "./sources";

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");

export function readPostSource(slug: string): string {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`Slug invalid: ${slug}`);
  return readFileSync(path.join(BLOG_DIR, `${slug}.mdx`), "utf8");
}

function attrs(raw: string): Record<string, string> {
  return Object.fromEntries([...raw.matchAll(/(\w+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
}

function quote(text: string) {
  return text
    .trim()
    .split("\n")
    .map((l) => (l.trim() ? `> ${l}` : ">"))
    .join("\n");
}

function ctaLabel(href: string) {
  if (href.startsWith("/categorii/")) return "Vezi prestatori și prețuri";
  if (href.startsWith("/inregistrare")) return "Creează profil gratuit";
  return "Publică un proiect gratuit";
}

/** Transformă sursa MDX a unui articol în markdown curat. */
export function mdxToMarkdown(source: string, baseUrl: string): string {
  const abs = (href: string) => (href.startsWith("/") ? `${baseUrl}${href}` : href);
  return (
    source
      // Comentariile MDX ({/* SURSE … */}), inclusiv cele pe mai multe rânduri.
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
      .replace(/<Callout\b([^>]*)>([\s\S]*?)<\/Callout>/g, (_, a: string, body: string) => {
        const { title } = attrs(a);
        return quote(title ? `**${title}**\n\n${body.trim()}` : body);
      })
      .replace(/<Cta\b([^>]*)>([\s\S]*?)<\/Cta>/g, (_, a: string, body: string) => {
        const { href = "/proiecte/nou", title = "" } = attrs(a);
        return quote(`**${title}** ${body.trim()} [${ctaLabel(href)}](${abs(href)})`.trim());
      })
      // Legături interne: [text](/categorii/x) → URL absolut.
      .replace(/\]\((\/[^)\s]*)\)/g, (_, href: string) => `](${abs(href)})`)
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

const dateFmt = new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "long", year: "numeric" });

/** Articolul complet: titlu, metadate, rezumat și conținut. */
export function postToMarkdown(post: Post, baseUrl: string): string {
  const url = `${baseUrl}/blog/${post.slug}`;
  const modified = post.updated ?? post.date;
  const meta = [
    `URL: ${url}`,
    `Publicat: ${dateFmt.format(new Date(post.date))}`,
    `Actualizat: ${dateFmt.format(new Date(modified))}`,
    `Autor: ${site.name} (${baseUrl}/despre)`,
  ];
  const parts = [
    `# ${post.title}`,
    meta.join("  \n"),
    post.summary ? `> **Pe scurt:** ${post.summary}` : `> ${post.description}`,
    mdxToMarkdown(readPostSource(post.slug), baseUrl),
  ];
  const sources = postSources[post.slug];
  if (sources?.length) parts.push(`## Surse\n\n${sources.map((s) => `- [${s.title}](${s.url}), ${s.publisher}`).join("\n")}`);
  return parts.join("\n\n") + "\n";
}
