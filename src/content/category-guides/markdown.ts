/** Ghidurile de categorie ca markdown (pentru /llms-full.txt): intro, tabel de prețuri, factori, checklist, FAQ. */
import { guidesUpdated, type CategoryGuide } from "./index";

function cell(s: string) {
  return s.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

export function guideToMarkdown({
  name,
  slug,
  parentName,
  guide,
  baseUrl,
}: {
  name: string;
  slug: string;
  parentName?: string;
  guide: CategoryGuide;
  baseUrl: string;
}): string {
  const parts = [
    `# ${name}`,
    [`URL: ${baseUrl}/categorii/${slug}`, parentName ? `Categorie: ${parentName}` : "Categorie principală"].join("  \n"),
    ...guide.intro,
  ];
  if (guide.prices?.length) {
    parts.push(
      `## Cât costă: ${name} (prețuri orientative, ${guidesUpdated})`,
      [
        "| Lucrare | Preț orientativ | Observații |",
        "|---|---|---|",
        ...guide.prices.map((p) => `| ${cell(p.item)} | ${cell(p.range)} | ${cell(p.note ?? "")} |`),
      ].join("\n"),
      "Prețuri orientative pentru România, adunate din oferte publice. Prețul final depinde de proiect și se stabilește direct cu prestatorul.",
    );
  }
  if (guide.priceFactors?.length) parts.push("## Ce influențează prețul", guide.priceFactors.map((f) => `- ${f}`).join("\n"));
  if (guide.checklist?.length) parts.push("## Cum alegi prestatorul", guide.checklist.map((f) => `- ${f}`).join("\n"));
  if (guide.faq.length) parts.push("## Întrebări frecvente", ...guide.faq.map((f) => `### ${f.q}\n\n${f.a}`));
  return parts.join("\n\n") + "\n";
}
