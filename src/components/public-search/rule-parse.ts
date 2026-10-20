import "server-only";
import { normalizeText } from "@/lib/text";
import { extractBudget } from "@/server/ai/rules";
import { findLocalityByName } from "@/server/catalog/localities";
import { getCatalog } from "@/server/catalog/taxonomy";
import { db } from "@/server/db";
import { localities } from "@/server/db/schema";
import { and, desc, eq, gte } from "drizzle-orm";

const ALIASES: Record<string, string> = { cluj: "cluj-napoca", bucuresti: "municipiul bucuresti", "targu mures": "targu mures" };

const STOP = new Set(
  "caut cauta vreau am nevoie de un o unei unui pentru si sau cu fara din in la zona care ce sa se mai foarte peste sub pana intre lei ron eur euro ora luna remote online distanta factura firma srl pfa urgent azi maine buget maxim max minim min aproximativ proiect proiecte prestator prestatori cineva".split(" "),
);

/** Oraș menționat fără prepoziție („electrician cluj”): potrivire exactă pe orașe mari. */
async function cityFromTokens(t: string) {
  const words = t.split(/[^a-z-]+/).filter((w) => w.length >= 3);
  const candidates = [...words.slice(0, -1).map((w, i) => `${w} ${words[i + 1]}`), ...words];
  for (const c of candidates) {
    const name = ALIASES[c] ?? c;
    const [row] = await db
      .select({ id: localities.id, name: localities.name })
      .from(localities)
      .where(and(eq(localities.searchName, name), gte(localities.population, 15_000)))
      .orderBy(desc(localities.population))
      .limit(1);
    if (row) return { ...row, token: c };
  }
  return null;
}

/** Interpretare simplă a unei căutări în limbaj natural, folosită când AI-ul nu e disponibil. */
export async function ruleParseQuery(text: string) {
  const catalog = await getCatalog();
  const t = normalizeText(text);
  let cat: number | undefined;
  let best = 0;
  for (const root of catalog.tree) {
    for (const sub of root.children) {
      const name = normalizeText(sub.name);
      if (t.includes(name) && name.length > best) {
        cat = sub.id;
        best = name.length;
      }
    }
  }
  let matchedSkill: string | undefined;
  if (!cat) {
    const skill = catalog.skills.find((s) => s.categoryId && normalizeText(s.name).length > 3 && t.includes(normalizeText(s.name)));
    if (skill?.categoryId) {
      cat = skill.categoryId;
      matchedSkill = skill.name;
    }
  }
  const locMatch = t.match(/\b(?:din|in|la|zona)\s+([a-z-]+(?:\s[a-z-]+)?)/);
  let loc: { id: number } | null = locMatch ? await findLocalityByName(ALIASES[locMatch[1]] ?? locMatch[1]) : null;
  if (!loc && locMatch) loc = await findLocalityByName(ALIASES[locMatch[1].split(" ")[0]] ?? locMatch[1].split(" ")[0]);
  const city = loc ? null : await cityFromTokens(t);
  if (city) loc = city;
  // Cuvintele rămase (fără termeni deja transformați în filtre) devin căutare text.
  const consumed = new Set([...(matchedSkillTokens(t, catalog) ?? []), ...(city ? city.token.split(" ") : []), ...(locMatch ? locMatch[1].split(" ") : [])]);
  const keywords = t
    .split(/[^a-z0-9-]+/)
    .filter((w) => w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w) && !consumed.has(w))
    .slice(0, 3)
    .join(" ");
  const rateMatch = t.match(/(\d{2,4})\s*(?:lei|ron)\s*\/?\s*(?:pe\s)?or/);
  const budget = extractBudget(text);
  return {
    cat,
    matchedSkill,
    loc: loc?.id,
    invoice: /factur/.test(t),
    legal: /\bsrl\b/.test(t) ? "srl" : /\bpfa\b/.test(t) ? "pfa" : /\bfirma\b/.test(t) ? "company" : undefined,
    rate: rateMatch ? Number(rateMatch[1]) : undefined,
    budgetMin: budget.min ?? undefined,
    budgetMax: budget.max ?? undefined,
    remote: /\b(remote|online|de la distanta)\b/.test(t),
    urgent: /\b(urgent|azi|maine)\b/.test(t),
    keywords: keywords || undefined,
  };
}

function matchedSkillTokens(t: string, catalog: Awaited<ReturnType<typeof getCatalog>>) {
  const out: string[] = [];
  for (const root of catalog.tree) for (const sub of root.children) {
    const n = normalizeText(sub.name);
    if (t.includes(n)) out.push(...n.split(" "));
  }
  return out;
}
