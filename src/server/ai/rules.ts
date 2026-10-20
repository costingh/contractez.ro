// Reguli deterministe folosite când AI-ul nu este disponibil și ca prim filtru de calitate.
import { normalizeText } from "@/lib/text";

const PHONE_RE = /(?:\+?4?0|\b0)\s?7\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b/g;
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

/** Date de contact în descrieri publice (înainte de aplicare). */
export function detectContactInfo(text: string): { phones: string[]; emails: string[] } {
  return { phones: text.match(PHONE_RE) ?? [], emails: text.match(EMAIL_RE) ?? [] };
}

export function stripContactInfo(text: string): string {
  return text.replace(PHONE_RE, "[telefon ascuns]").replace(EMAIL_RE, "[email ascuns]");
}

/** Extrage un buget din text liber: „buget 2000-3000 lei”, „max 200 euro/lună”. */
export function extractBudget(text: string): { min: number | null; max: number | null; currency: "lei" | "eur"; monthly: boolean; hourly: boolean } {
  const t = normalizeText(text).replace(/(\d)[.\s](\d{3})\b/g, "$1$2");
  const monthly = /\b(pe luna|\/luna|lunar)\b/.test(t);
  const hourly = /\b(pe ora|\/ora|ora)\b/.test(t) && /\d+\s*(lei|ron)\s*\/?\s*(pe )?ora/.test(t);
  const currency = /\b(eur|euro|€)/.test(t) ? "eur" : "lei";
  const range = t.match(/(\d{2,7})\s*(?:-|–|pana la|si)\s*(\d{2,7})\s*(lei|ron|eur|euro|€)?/);
  const rate = currency === "eur" ? 5 : 1;
  if (range) {
    return { min: Math.round(Number(range[1]) * rate), max: Math.round(Number(range[2]) * rate), currency, monthly, hourly };
  }
  const single = t.match(/(?:buget|maxim|max\.?|pana la|aproximativ|cca\.?|~)?\s*(\d{2,7})\s*(lei|ron|eur|euro|€)/);
  if (single) {
    const v = Math.round(Number(single[1]) * rate);
    const isMax = /(maxim|max|pana la)\s*\d/.test(t);
    return { min: isMax ? null : v, max: v, currency, monthly, hourly };
  }
  return { min: null, max: null, currency, monthly, hourly };
}

export function guessUrgency(text: string): "urgent" | "this_week" | "this_month" | "flexible" {
  const t = normalizeText(text);
  if (/\b(urgent|asap|azi|astazi|maine|cat mai repede)\b/.test(t)) return "urgent";
  if (/\b(saptamana asta|saptamana aceasta|in cateva zile)\b/.test(t)) return "this_week";
  if (/\b(luna asta|luna aceasta|in 2 saptamani|doua saptamani)\b/.test(t)) return "this_month";
  return "flexible";
}

export function guessInvoice(text: string): "required" | "preferred" | "not_needed" {
  const t = normalizeText(text);
  if (/\b(cu factura|factura obligatori|emite factura|firma|pfa|srl)\b/.test(t)) return "required";
  if (/\b(fara factura|nu e nevoie de factura)\b/.test(t)) return "not_needed";
  return "preferred";
}

export function guessWorkMode(text: string, fallback: "remote" | "on_site" | "hybrid"): "remote" | "on_site" | "hybrid" {
  const t = normalizeText(text);
  if (/\b(remote|online|de la distanta)\b/.test(t)) return "remote";
  if (/\b(la domiciliu|la fata locului|deplasare|in locatie|la sediu|vin la|sa vina)\b/.test(t)) return "on_site";
  return fallback;
}

export type QualityInput = {
  title: string;
  description: string;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetType: string;
  workMode: string;
  localityId: number | null;
  urgency: string;
  skillsCount: number;
};

/** Scor de claritate (0-100) și lista de informații lipsă, fără AI. */
export function ruleQuality(p: QualityInput) {
  const missing: string[] = [];
  const questions: string[] = [];
  let score = 100;
  const words = p.description.trim().split(/\s+/).filter(Boolean).length;
  if (p.title.trim().length < 12) {
    score -= 10;
    missing.push("Un titlu mai descriptiv");
  }
  if (words < 25) {
    score -= 25;
    missing.push("O descriere mai detaliată (ce trebuie făcut, rezultat dorit)");
    questions.push("Ce rezultat concret aștepți la finalul colaborării?");
  } else if (words < 60) {
    score -= 10;
  }
  if (!p.budgetMax && p.budgetType !== "unknown") {
    score -= 20;
    missing.push("Bugetul estimat");
    questions.push("Ce buget aproximativ ai alocat?");
  } else if (p.budgetType === "unknown") {
    score -= 12;
    missing.push("Un interval de buget, chiar orientativ");
  }
  if (p.workMode !== "remote" && !p.localityId) {
    score -= 20;
    missing.push("Localitatea lucrării");
  }
  if (p.urgency === "flexible") score -= 3;
  if (p.skillsCount === 0) {
    score -= 7;
    missing.push("Competențele necesare");
  }
  return { score: Math.max(0, Math.min(100, score)), missing, questions, budgetInsight: null as string | null };
}
