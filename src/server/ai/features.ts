import { z } from "zod";
import { normalizeText, truncate } from "@/lib/text";
import { getCatalog, skillsForCategory } from "../catalog/taxonomy";
import { aiStructured, aiText, withFallback } from "./client";
import { extractBudget, guessInvoice, guessUrgency, guessWorkMode, ruleQuality, type QualityInput } from "./rules";

const SYSTEM_BASE =
  "Ești asistentul unei platforme românești de servicii (marketplace între clienți și prestatori). " +
  "Răspunzi mereu în limba română, concis și concret. Nu inventezi informații care nu apar în text; " +
  "când lipsește o informație folosești null.";

async function categoryList() {
  const catalog = await getCatalog();
  return catalog.tree
    .map((t) => `${t.name}: ${t.children.map((c) => `${c.slug} (${c.name})`).join(", ")}`)
    .join("\n");
}

/* -------------------------------------------------------------------------- */
/*                               Project builder                              */
/* -------------------------------------------------------------------------- */

const projectDraftSchema = z.object({
  title: z.string().describe("Titlu clar, max 90 caractere"),
  description: z.string().describe("Descriere structurată, cu paragrafe/puncte, fără date de contact"),
  categorySlug: z.string().describe("Slug-ul subcategoriei din listă"),
  skills: z.array(z.string()).describe("Max 6 competențe necesare, scurte"),
  budgetType: z.enum(["fixed", "hourly", "monthly", "unknown"]),
  budgetMin: z.number().nullable().describe("În lei"),
  budgetMax: z.number().nullable().describe("În lei"),
  estimatedHours: z.number().nullable(),
  workMode: z.enum(["remote", "on_site", "hybrid"]),
  localityName: z.string().nullable(),
  countyCode: z.string().nullable().describe("Cod auto județ, ex: CJ, B, IS"),
  urgency: z.enum(["flexible", "this_month", "this_week", "urgent"]),
  invoice: z.enum(["required", "preferred", "not_needed"]),
  durationText: z.string().nullable(),
  missing: z.array(z.string()).describe("Informații importante care lipsesc"),
  questions: z.array(z.string()).describe("Max 3 întrebări scurte pentru client, doar dacă lipsesc detalii esențiale"),
  budgetInsight: z
    .string()
    .nullable()
    .describe("Observație dacă bugetul pare nerealist pentru cerințe; altfel null"),
});

export type ProjectDraft = z.infer<typeof projectDraftSchema> & { source: "ai" | "rules" };

/** Transformă un text liber (ex: o postare de Facebook) într-un proiect structurat. */
export async function buildProjectDraft(text: string, userId?: string | null): Promise<ProjectDraft> {
  const input = truncate(text.trim(), 6_000);
  return withFallback<ProjectDraft>(
    async () => {
      const draft = await aiStructured({
        feature: "project-builder",
        userId,
        schema: projectDraftSchema,
        maxOutputTokens: 2_500,
        system:
          `${SYSTEM_BASE}\nTransformi cererea unui client într-un proiect structurat. ` +
          "Bugetul se convertește în lei (1 EUR ≈ 5 lei). Dacă bugetul acoperă și cheltuieli (ex: buget de reclame), menționează în budgetInsight. " +
          "Elimină numerele de telefon, emailurile și linkurile personale din descriere.\n\nSubcategorii disponibile:\n" +
          (await categoryList()),
        user: input,
      });
      return { ...draft, source: "ai" as const };
    },
    async () => ruleDraft(input),
  );
}

/** Titlu din prima propoziție, fără formule de salut/introducere („Bună, caut pe cineva să-mi facă…”). */
export function ruleTitle(sentence: string, categoryName?: string): string {
  let t = sentence
    .replace(/^\s*(bun[ăa]( ziua| seara| dimineata)?|salut(are)?|hei|hello|buna)[\s,!.]*/i, "")
    .replace(/^(caut|c[ăa]ut[ăa]m|am nevoie( urgent[ăa]?)?( de)?|vreau|doresc|ne trebuie|as avea nevoie( de)?)\s+/i, "")
    .replace(/^(pe )?(cineva|o persoan[ăa]|un specialist|o firm[ăa]|un meseria[șs])\s+(care\s+)?s[ăa](-mi|-ne|\s+[îi]mi|\s+ne)?\s+(fac[ăa]|realizeze|construiasc[ăa]|monteze|repare|ajute(\s+cu|\s+la)?)\s+/i, "")
    .replace(/^(un|o|niste|niște)\s+/i, "")
    .trim();
  // Tăiem la o limită naturală (virgulă / „pentru” / „cu”) dacă e prea lung.
  if (t.length > 70) {
    const cut = t.slice(0, 70).search(/,|;| - /);
    if (cut > 25) t = t.slice(0, cut);
  }
  if (t.length < 8) t = categoryName ? `Proiect: ${categoryName}` : sentence;
  return truncate(t.charAt(0).toUpperCase() + t.slice(1), 90);
}

async function ruleDraft(text: string): Promise<ProjectDraft> {
  const catalog = await getCatalog();
  const t = normalizeText(text);
  // Alegem subcategoria cu cele mai multe potriviri de cuvinte (nume categorie + competențe).
  let best = { slug: "diverse", hits: 0 };
  for (const root of catalog.tree) {
    for (const sub of root.children) {
      const words = [sub.name, ...skillsForCategory(catalog, sub.id).map((s) => s.name)]
        .flatMap((w) => normalizeText(w).split(/[^a-z0-9]+/))
        .filter((w) => w.length > 3);
      const hits = new Set(words.filter((w) => t.includes(w))).size;
      if (hits > best.hits) best = { slug: sub.slug, hits };
    }
  }
  const cat = catalog.bySlug.get(best.slug);
  const budget = extractBudget(text);
  const firstLine = text.split(/\n|\.|!|\?/).find((l) => l.trim().length > 10)?.trim() ?? "Proiect nou";
  const skillNames = cat
    ? skillsForCategory(catalog, cat.id)
        .filter((s) => t.includes(normalizeText(s.name)))
        .map((s) => s.name)
        .slice(0, 6)
    : [];
  const draft = {
    title: ruleTitle(firstLine, cat?.name),
    description: text.trim(),
    categorySlug: best.slug,
    skills: skillNames,
    budgetType: budget.max ? (budget.monthly ? "monthly" : budget.hourly ? "hourly" : "fixed") : "unknown",
    budgetMin: budget.min,
    budgetMax: budget.max,
    estimatedHours: null,
    workMode: guessWorkMode(text, cat?.typicalWorkMode ?? "remote"),
    localityName: null,
    countyCode: null,
    urgency: guessUrgency(text),
    invoice: guessInvoice(text),
    durationText: null,
    budgetInsight: null,
  } satisfies Omit<ProjectDraft, "missing" | "questions" | "source">;
  const q = ruleQuality({ ...draft, localityId: null, skillsCount: skillNames.length });
  return { ...draft, missing: q.missing, questions: q.questions, source: "rules" };
}

/* -------------------------------------------------------------------------- */
/*                               Quality check                                */
/* -------------------------------------------------------------------------- */

const qualitySchema = z.object({
  score: z.number().describe("0-100: cât de ușor poate un prestator să facă o ofertă corectă"),
  missing: z.array(z.string()),
  questions: z.array(z.string()).describe("Max 3 întrebări scurte"),
  budgetInsight: z.string().nullable(),
  summary: z.string().describe("Rezumat de 1-2 propoziții pentru prestatori"),
});

export type QualityResult = z.infer<typeof qualitySchema> & { source: "ai" | "rules" };

export async function checkProjectQuality(
  p: QualityInput & { categoryName: string; localityName?: string | null; invoice: string },
  userId?: string | null,
): Promise<QualityResult> {
  const rules = ruleQuality(p);
  return withFallback<QualityResult>(
    async () => {
      const r = await aiStructured({
        feature: "quality-check",
        userId,
        schema: qualitySchema,
        maxOutputTokens: 1_200,
        system:
          `${SYSTEM_BASE}\nVerifici calitatea unei cereri înainte de publicare. Prestatorii folosesc o aplicare din limita planului lor ca să aplice, ` +
          "deci cererea trebuie să fie suficient de clară. Semnalează bugete nerealiste față de amploarea cerinței. " +
          "Nu cere informații personale.",
        user: JSON.stringify({
          titlu: p.title,
          descriere: p.description,
          categorie: p.categoryName,
          buget: { tip: p.budgetType, min: p.budgetMin, max: p.budgetMax },
          mod_lucru: p.workMode,
          localitate: p.localityName ?? null,
          urgenta: p.urgency,
          factura: p.invoice,
        }),
      });
      // Scorul AI nu poate fi mai mare decât cel al regulilor obiective + 10 (evităm supraevaluarea).
      return { ...r, score: Math.round(Math.min(r.score, rules.score + 10)), source: "ai" as const };
    },
    () => ({ ...rules, summary: truncate(p.description.replace(/\s+/g, " "), 220), source: "rules" as const }),
  );
}

/* -------------------------------------------------------------------------- */
/*                           Natural-language search                          */
/* -------------------------------------------------------------------------- */

const providerSearchSchema = z.object({
  categorySlug: z.string().nullable(),
  keywords: z.string().nullable().describe("Cuvinte cheie pentru căutare text"),
  localityName: z.string().nullable(),
  countyCode: z.string().nullable(),
  radiusKm: z.number().nullable(),
  issuesInvoice: z.boolean().nullable(),
  legalEntity: z.enum(["pfa", "ii", "srl"]).nullable(),
  maxHourlyRate: z.number().nullable().describe("lei/oră"),
  maxBudget: z.number().nullable(),
  remote: z.boolean().nullable(),
  onSite: z.boolean().nullable(),
  minRating: z.number().nullable(),
  availableOnly: z.boolean().nullable(),
  languages: z.array(z.string()).nullable().describe("Coduri ISO, ex: en, de"),
  explanation: z.string().describe("Cum ai interpretat cererea, o propoziție"),
});
export type ProviderSearchParse = z.infer<typeof providerSearchSchema>;

export async function parseProviderSearch(query: string, userId?: string | null): Promise<ProviderSearchParse | null> {
  return withFallback<ProviderSearchParse | null>(
    () =>
      categoryList().then((cats) =>
        aiStructured({
          feature: "search-parse",
          userId,
          schema: providerSearchSchema,
          maxOutputTokens: 800,
          system:
            `${SYSTEM_BASE}\nTransformi o căutare de prestatori în filtre. Nu adăuga filtre care nu sunt cerute explicit. ` +
            "Atributele personale (etnie, religie, vârstă, gen etc.) nu sunt filtre permise: ignoră-le.\nSubcategorii:\n" +
            cats,
          user: query,
        }),
      ),
    () => null,
  );
}

const projectSearchSchema = z.object({
  categorySlug: z.string().nullable(),
  keywords: z.string().nullable(),
  minBudget: z.number().nullable(),
  maxBudget: z.number().nullable(),
  workMode: z.enum(["remote", "on_site", "hybrid"]).nullable(),
  localityName: z.string().nullable(),
  radiusKm: z.number().nullable(),
  invoiceRequired: z.boolean().nullable(),
  urgentOnly: z.boolean().nullable(),
  explanation: z.string(),
});
export type ProjectSearchParse = z.infer<typeof projectSearchSchema>;

export async function parseProjectSearch(query: string, userId?: string | null): Promise<ProjectSearchParse | null> {
  return withFallback<ProjectSearchParse | null>(
    async () =>
      aiStructured({
        feature: "search-parse",
        userId,
        schema: projectSearchSchema,
        maxOutputTokens: 600,
        system: `${SYSTEM_BASE}\nTransformi căutarea unui prestator (ce proiecte caută) în filtre.\nSubcategorii:\n${await categoryList()}`,
        user: query,
      }),
    () => null,
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Proposals                                 */
/* -------------------------------------------------------------------------- */

type ProposalContext = {
  project: { title: string; description: string; budgetMin: number | null; budgetMax: number | null; budgetType: string; workMode: string; localityName?: string | null };
  provider: { name: string; headline: string; bio: string; hourlyRate: number | null; yearsExperience: number | null; services: string[] };
};

export async function draftProposal(ctx: ProposalContext, userId?: string | null): Promise<string> {
  return withFallback(
    () =>
      aiText({
        feature: "proposal-draft",
        userId,
        maxOutputTokens: 900,
        system:
          `${SYSTEM_BASE}\nScrii o propunere scurtă (80-160 cuvinte) din partea prestatorului către client. ` +
          "Ton profesionist, cald, la persoana I. Arată că ai înțeles cerința, propune pașii următori și pune o întrebare relevantă. " +
          "Nu promite prețuri, termene sau garanții care nu apar în profil. Fără date de contact, fără formule de încheiere lungi.",
        user: JSON.stringify(ctx),
      }),
    () => fallbackProposal(ctx),
  );
}

function fallbackProposal(ctx: ProposalContext): string {
  const exp = ctx.provider.yearsExperience ? ` Am ${ctx.provider.yearsExperience} ani de experiență` : " Am experiență";
  const svc = ctx.provider.services.slice(0, 2).join(" și ");
  return (
    `Bună ziua! Am citit cu atenție cererea „${ctx.project.title}” și cred că vă pot ajuta.` +
    `${exp}${svc ? ` în ${svc}` : ""}, iar proiecte similare am livrat deja.\n\n` +
    "Aș propune o scurtă discuție pentru a clarifica detaliile și termenul dorit, apoi vă trimit o ofertă exactă.\n\n" +
    "Ce este cel mai important pentru dumneavoastră la acest proiect?"
  );
}

/** Personalizează șablonul Auto Bid aprobat de prestator. Fără AI, doar înlocuiește variabilele. */
export async function personalizeTemplate(
  template: string,
  ctx: ProposalContext & { clientFirstName: string; categoryName: string },
  useAi: boolean,
  userId?: string | null,
): Promise<string> {
  const filled = template
    .replaceAll("{client}", ctx.clientFirstName)
    .replaceAll("{proiect}", ctx.project.title)
    .replaceAll("{categorie}", ctx.categoryName)
    .replaceAll("{localitate}", ctx.project.localityName ?? "zona dumneavoastră");
  if (!useAi) return filled;
  return withFallback(
    () =>
      aiText({
        feature: "autobid-personalize",
        userId,
        maxOutputTokens: 700,
        system:
          `${SYSTEM_BASE}\nAdaptezi ușor un mesaj aprobat de prestator la un proiect concret. ` +
          "Păstrezi sensul, tonul, prețurile și promisiunile EXACT ca în mesajul original; nu adaugi angajamente noi. " +
          "Poți adăuga o propoziție care arată că ai citit cererea. Max 170 cuvinte.",
        user: JSON.stringify({ mesaj_aprobat: filled, proiect: ctx.project }),
      }),
    () => filled,
  );
}

/* -------------------------------------------------------------------------- */
/*                        Distribution & client helpers                       */
/* -------------------------------------------------------------------------- */

export async function generateShareText(
  p: { title: string; summary: string; categoryName: string; workMode: string; localityName?: string | null; budgetMax: number | null; url: string },
  userId?: string | null,
): Promise<string> {
  const fallback = () => {
    const where = p.workMode === "remote" ? "Remote" : (p.localityName ?? "");
    const budget = p.budgetMax ? ` · buget până la ${p.budgetMax.toLocaleString("ro-RO")} lei` : "";
    return `🔎 Caut ${p.categoryName.toLowerCase()}: ${p.title}\n${where}${budget}\n\n${truncate(p.summary, 220)}\n\nDetalii și aplicare: ${p.url}`;
  };
  return withFallback(
    () =>
      aiText({
        feature: "share-text",
        userId,
        maxOutputTokens: 500,
        system:
          `${SYSTEM_BASE}\nScrii o postare scurtă pentru grupuri de Facebook (max 70 cuvinte, 1-2 emoji), ` +
          "din partea clientului, care invită prestatorii să aplice prin link. Include linkul exact o dată, la final.",
        user: JSON.stringify(p),
      }),
    fallback,
  );
}

const compareSchema = z.object({
  summary: z.string().describe("Comparație scurtă, 2-4 propoziții"),
  items: z.array(
    z.object({
      applicationId: z.string(),
      strengths: z.array(z.string()),
      concerns: z.array(z.string()),
      matchesCriteria: z.boolean().describe("Dacă respectă criteriile clientului"),
    }),
  ),
});
export type ApplicationComparison = z.infer<typeof compareSchema>;

/** Ajută clientul să compare ofertele (și să le filtreze după criterii în limbaj natural). */
export async function compareApplications(
  project: { title: string; description: string; budgetMax: number | null },
  apps: { applicationId: string; provider: string; message: string; price: string; rating: number | null; issuesInvoice: boolean; distanceKm: number | null; completed: number }[],
  criteria: string | null,
  userId?: string | null,
): Promise<ApplicationComparison | null> {
  if (apps.length === 0) return null;
  return withFallback<ApplicationComparison | null>(
    () =>
      aiStructured({
        feature: "compare-applications",
        userId,
        schema: compareSchema,
        maxOutputTokens: 1_800,
        system:
          `${SYSTEM_BASE}\nAjuți un client să compare ofertele primite. Fii obiectiv, bazează-te doar pe datele primite. ` +
          "Nu recomanda pe cineva pe baza unor atribute personale.",
        user: JSON.stringify({ proiect: project, criterii_client: criteria, oferte: apps }),
      }),
    () => null,
  );
}

export async function suggestProviderSkills(
  input: { headline: string; bio: string; services: string[]; categoryIds: number[] },
  userId?: string | null,
): Promise<string[]> {
  const catalog = await getCatalog();
  const candidates = input.categoryIds.flatMap((id) => skillsForCategory(catalog, id)).map((s) => s.name);
  const text = normalizeText([input.headline, input.bio, ...input.services].join(" "));
  const fallback = () => candidates.filter((c) => text.includes(normalizeText(c))).slice(0, 12);
  if (candidates.length === 0) return [];
  return withFallback(
    async () => {
      const r = await aiStructured({
        feature: "provider-skills",
        userId,
        schema: z.object({ skills: z.array(z.string()) }),
        maxOutputTokens: 500,
        system: `${SYSTEM_BASE}\nAlegi din lista dată competențele care se potrivesc profilului. Returnezi doar elemente din listă, max 12.`,
        user: JSON.stringify({ profil: input, lista: candidates }),
      });
      const allowed = new Set(candidates);
      return r.skills.filter((s) => allowed.has(s));
    },
    fallback,
  );
}

export { describeBudget } from "@/lib/format";
