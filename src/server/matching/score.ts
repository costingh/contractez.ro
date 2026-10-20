// Scorul de compatibilitate este determinist și explicabil. AI-ul nu inventează procente:
// el doar ajută la structurarea cererilor (competențe, categorie), iar aici calculăm scorul.
import type { MatchReason } from "../db/schema";

export type ProjectForMatch = {
  categoryId: number;
  rootCategoryId: number;
  skillIds: number[];
  keywords: string[];
  budgetType: "fixed" | "hourly" | "monthly" | "unknown";
  budgetMin: number | null;
  budgetMax: number | null;
  estimatedHours: number | null;
  workMode: "remote" | "on_site" | "hybrid";
  radiusKm: number;
};

export type ProviderForMatch = {
  categoryIds: number[];
  rootCategoryIds: number[];
  skillIds: number[];
  searchText: string;
  hourlyRate: number | null;
  minProjectBudget: number | null;
  remote: boolean;
  onSite: boolean;
  travelRadiusKm: number;
  distanceKm: number | null;
  ratingAvg: number | null;
  ratingCount: number;
  completedCount: number;
  availability: "available" | "busy" | "unavailable";
  responseTimeMinutes: number | null;
};

export type ScoreResult = { score: number; reasons: MatchReason[]; eligible: boolean; ineligibleReason?: string };

/** Stratul 1: filtre obligatorii. */
export function checkEligibility(p: ProjectForMatch, v: ProviderForMatch): string | null {
  if (v.availability === "unavailable") return "Indisponibil";
  const sameCategory = v.categoryIds.includes(p.categoryId) || v.categoryIds.includes(p.rootCategoryId);
  const sameRoot = v.rootCategoryIds.includes(p.rootCategoryId);
  if (!sameCategory && !sameRoot) return "Categorie diferită";

  const withinRadius =
    v.distanceKm !== null && v.distanceKm <= v.travelRadiusKm && v.distanceKm <= Math.max(p.radiusKm, 1);
  if (p.workMode === "remote" && !v.remote) return "Nu lucrează remote";
  if (p.workMode === "on_site" && !(v.onSite && withinRadius)) return "În afara zonei de deplasare";
  if (p.workMode === "hybrid" && !(v.remote || (v.onSite && withinRadius))) return "În afara zonei și fără remote";
  return null;
}

/** Stratul 2: scor de relevanță (0-100). */
export function scoreMatch(p: ProjectForMatch, v: ProviderForMatch): ScoreResult {
  const ineligible = checkEligibility(p, v);
  if (ineligible) return { score: 0, reasons: [], eligible: false, ineligibleReason: ineligible };

  const reasons: MatchReason[] = [];
  let score = 0;
  const add = (label: string, points: number, positive = true) => {
    score += points;
    reasons.push({ label, points, positive });
  };

  // Categorie (max 30)
  if (v.categoryIds.includes(p.categoryId)) add("Oferă exact acest serviciu", 30);
  else if (v.categoryIds.includes(p.rootCategoryId)) add("Lucrează în această categorie", 22);
  else add("Lucrează într-un domeniu apropiat", 12);

  // Competențe (max 25)
  if (p.skillIds.length > 0) {
    const overlap = p.skillIds.filter((id) => v.skillIds.includes(id)).length;
    const pts = Math.round((25 * overlap) / p.skillIds.length);
    if (overlap > 0) add(`${overlap} din ${p.skillIds.length} competențe cerute`, pts);
    else add("Nicio competență cerută declarată", 0, false);
  } else if (p.keywords.length > 0) {
    const hits = p.keywords.filter((k) => v.searchText.includes(k)).length;
    const pts = Math.min(18, Math.round((18 * hits) / Math.min(p.keywords.length, 6)));
    if (pts > 0) add("Profilul conține termenii cererii", pts);
    else score += 6; // neutral: proiectul nu cere competențe specifice
  } else {
    score += 12;
  }

  // Buget (max 15)
  const budget = p.budgetMax ?? p.budgetMin;
  if (p.budgetType === "unknown" || !budget) {
    score += 8;
  } else if (p.budgetType === "hourly" && v.hourlyRate) {
    if (v.hourlyRate <= budget) add("Tariful se încadrează în buget", 15);
    else if (v.hourlyRate <= budget * 1.2) add("Tarif puțin peste buget", 7, false);
    else add("Tarif peste buget", 0, false);
  } else if (p.budgetType !== "hourly" && v.minProjectBudget) {
    if (v.minProjectBudget <= budget) add("Bugetul acoperă minimul prestatorului", 15);
    else add("Bugetul este sub minimul prestatorului", 0, false);
  } else if (p.budgetType !== "hourly" && v.hourlyRate && p.estimatedHours) {
    const cost = v.hourlyRate * p.estimatedHours;
    if (cost <= budget) add("Estimarea se încadrează în buget", 15);
    else if (cost <= budget * 1.25) add("Estimare apropiată de buget", 8, false);
    else add("Estimare peste buget", 2, false);
  } else {
    score += 9;
  }

  // Distanță (max 10)
  if (p.workMode === "remote") score += 10;
  else if (v.distanceKm !== null) {
    const limit = Math.max(1, Math.min(v.travelRadiusKm, p.radiusKm));
    const pts = Math.max(0, Math.round(10 * (1 - v.distanceKm / limit)));
    if (v.distanceKm <= 10) add(`La ${Math.round(v.distanceKm)} km`, Math.max(pts, 8));
    else add(`La ${Math.round(v.distanceKm)} km`, pts);
  } else if (v.remote) score += 6;

  // Reputație (max 10)
  if (v.ratingCount > 0 && v.ratingAvg) {
    const pts = Math.round((v.ratingAvg / 5) * 6);
    add(`Rating ${v.ratingAvg.toFixed(1)} (${v.ratingCount})`, pts);
  } else score += 3;
  if (v.completedCount > 0) add(`${v.completedCount} colaborări confirmate`, Math.min(4, v.completedCount));

  // Disponibilitate & răspuns (max 10)
  score += v.availability === "available" ? 6 : 3;
  if (v.availability === "busy") reasons.push({ label: "Ocupat parțial", points: 3, positive: false });
  if (v.responseTimeMinutes !== null && v.responseTimeMinutes <= 120) add("Răspunde rapid", 4);
  else if (v.responseTimeMinutes !== null && v.responseTimeMinutes <= 1_440) score += 2;
  else score += 2;

  return { score: Math.max(0, Math.min(100, Math.round(score))), reasons, eligible: true };
}

/**
 * Stratul 3: distribuție echitabilă. Păstrăm cei mai relevanți, dar rezervăm o parte din locuri
 * pentru profiluri noi și penalizăm prestatorii deja suprasolicitați azi.
 */
export function distribute<T extends { score: number; isNewcomer: boolean; notifiedToday: number }>(
  candidates: T[],
  limit: number,
  newcomerShare: number,
): T[] {
  const adjusted = candidates
    .map((c) => ({ c, s: c.score - Math.max(0, c.notifiedToday - 10) }))
    .sort((a, b) => b.s - a.s);
  const reserved = Math.floor(limit * newcomerShare);
  const newcomers = adjusted.filter((x) => x.c.isNewcomer).slice(0, reserved);
  const picked = new Set(newcomers.map((x) => x.c));
  for (const x of adjusted) {
    if (picked.size >= limit) break;
    picked.add(x.c);
  }
  return adjusted.filter((x) => picked.has(x.c)).map((x) => x.c);
}

const STOPWORDS = new Set(
  "pentru care este sunt avem vreau caut nevoie doresc foarte mult putin acest aceasta acesta fara despre dupa intre unde cand cine cum orice poate trebuie bine buna ziua multumesc lucru lucrare proiect".split(
    " ",
  ),
);

export function keywordsFrom(text: string): string[] {
  return [...new Set(text.split(/[^a-z0-9]+/).filter((w) => w.length >= 5 && !STOPWORDS.has(w)))].slice(0, 20);
}
