// Clasificator determinist pentru lead-uri (folosit fără cheie OpenAI sau când AI-ul eșuează). Fără DB.
import { normalizeText } from "@/lib/text";
import { extractBudget, guessUrgency } from "../ai/rules";

export type LeadType = "client" | "provider" | "irrelevant";

export type RuleCategory = { slug: string; name: string; terms: string[] };

export type RuleResult = {
  type: LeadType;
  categorySlug: string | null;
  locality: string | null;
  score: number;
  reason: string;
};

// Pe text normalizat (fără diacritice, lowercase).
const CLIENT_PATTERNS: [RegExp, string][] = [
  [/\b(caut|cautam)\b(?! (clienti|colaborari|proiecte|job|joburi|de lucru|munca))/, "caut"],
  [/\b(am|avem|as avea|am avea) nevoie\b/, "am nevoie"],
  [/\brecomand(ati|ari|are|a-mi|ati-mi)\b/, "recomandați"],
  [/\b(imi|ne|mi-ar) trebui[ea]?\b/, "îmi trebuie"],
  [/\b(cine (ma|ne) poate ajuta|cine se ocupa|stie cineva|cunoaste cineva|cine poate)\b/, "cine poate"],
  [/\b(doresc|dorim|vreau sa (fac|imi|am))\b/, "doresc"],
  [/\b(angajez|angajam|colaborator pentru)\b/, "angajez"],
  [/\b(astept|asteptam) (oferte|mesaje|propuneri|portofolii)\b|\btrimite(ti)?(-mi|-ne)? (portofoliu|oferte|oferta)\b/, "aștept oferte"],
];

const PROVIDER_PATTERNS: [RegExp, string][] = [
  [/\b(ofer|oferim|ofera)\b/, "ofer"],
  [/\b(realizez|realizam|creez|cream|dezvolt|dezvoltam)\b/, "realizez"],
  [/(?<!\b(cu|trimite|trimiteti|trimiteti-mi|astept|asteptam) )\bportofoliu\b(?! (va rog|pls|in pm|la))/, "portofoliu"],
  [/\b(va|te) (pot|putem) ajuta\b/, "te pot ajuta"],
  [/\b(ma|ne) ocup(am)? (de|cu)\b/, "mă ocup de"],
  [/\b(disponibil|disponibila|disponibili) pentru\b/, "disponibil"],
  [/\bcaut (clienti|colaborari|proiecte|job|joburi)\b/, "caut clienți"],
  [/\b(servicii (de|profesionale)|preturi accesibile|tarife)\b/, "servicii"],
  [/\b(am|avem) experienta\b/, "am experiență"],
  [/(^|\s)(pm|dm|inbox|interesat|interesata)([\s.!,]|$)/, "PM/interesat"],
];

const SPAM = /\b(castiga bani|investitii crypto|bitcoin|forex|casino|pariuri|imprumut rapid)\b/;

function hits(t: string, patterns: [RegExp, string][]) {
  return patterns.filter(([re]) => re.test(t)).map(([, label]) => label);
}

/** Construiește termenii de căutare pentru categorii (nume subcategorie + competențe). */
export function ruleCategories(subs: { slug: string; name: string; skills: string[] }[]): RuleCategory[] {
  return subs.map((s) => ({
    slug: s.slug,
    name: s.name,
    terms: [s.name, ...s.skills, ...(EXTRA_TERMS[s.slug] ?? [])]
      .flatMap((x) => x.split(/\s*[/&]\s*/))
      .map((x) => normalizeText(x))
      .filter((x) => x.length >= 3),
  }));
}

/** Sinonime frecvente în grupuri, pe lângă numele competențelor din taxonomie. */
const EXTRA_TERMS: Record<string, string[]> = {
  "social-media": ["social media", "smm", "social media manager", "administrare pagina", "postari"],
  "site-prezentare": ["site de prezentare", "website", "site web"],
  "magazin-online": ["magazin online", "e-commerce", "ecommerce"],
  "logo-identitate": ["logo", "identitate vizuala"],
  "reclame-online": ["reclame", "ads", "campanii"],
  "aplicatii-mobile": ["aplicatie mobila", "aplicatie android", "aplicatie ios"],
};

function matchCategory(t: string, cats: RuleCategory[]): RuleCategory | null {
  let best: { c: RuleCategory; w: number } | null = null;
  for (const c of cats) {
    let w = 0;
    for (const term of c.terms) {
      const re = new RegExp(`(^|[^a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`);
      if (re.test(t)) w += term.length;
    }
    if (w > 0 && (!best || w > best.w)) best = { c, w };
  }
  return best?.c ?? null;
}

/**
 * Clasificare după cuvinte-cheie: „caut”, „am nevoie”, „recomandați” → client; „ofer”, „realizez”, „portofoliu” → prestator.
 * Pentru comentarii, `parentText` (postarea) ajută doar la categorie.
 */
export function ruleClassify(input: { text: string; kind?: "post" | "comment"; parentText?: string | null }, cats: RuleCategory[] = []): RuleResult {
  const t = normalizeText(input.text);
  if (t.length < 3 || SPAM.test(t)) {
    return { type: "irrelevant", categorySlug: null, locality: null, score: 0, reason: "Text gol sau spam." };
  }
  const c = hits(t, CLIENT_PATTERNS);
  const p = hits(t, PROVIDER_PATTERNS);
  // „caut clienți/proiecte” este exclus din tiparele de client (e prestator).
  const clientHits = c.length;
  const providerHits = p.length;
  let type: LeadType;
  if (clientHits === 0 && providerHits === 0) type = "irrelevant";
  else if (clientHits > providerHits) type = "client";
  else if (providerHits > clientHits) type = "provider";
  // La egalitate: postările sunt mai des cereri (sau întrebări), comentariile mai des oferte.
  else type = /\?/.test(t) || input.kind !== "comment" ? "client" : "provider";

  if (type === "irrelevant") {
    return { type, categorySlug: null, locality: null, score: 5, reason: "Nu caută și nu oferă servicii (reguli)." };
  }

  const cat = matchCategory(t, cats) ?? (input.parentText ? matchCategory(normalizeText(input.parentText), cats) : null);
  let score = type === "client" ? 55 : 45;
  const notes: string[] = [type === "client" ? `caută prestator („${c[0]}”)` : `oferă servicii („${p[0]}”)`];
  if (cat) {
    score += 15;
    notes.push(cat.name);
  }
  if (type === "client") {
    const budget = extractBudget(input.text);
    if (budget.max || budget.min) {
      score += 10;
      notes.push("buget menționat");
    }
    if (guessUrgency(input.text) === "urgent") {
      score += 5;
      notes.push("urgent");
    }
  }
  if (t.length >= 120) score += 10;
  else if (t.length < 25) score -= 15;
  const reason = `${notes.join(" · ")} (reguli)`;
  return { type, categorySlug: cat?.slug ?? null, locality: null, score: Math.max(0, Math.min(95, score)), reason: reason.charAt(0).toUpperCase() + reason.slice(1) };
}
