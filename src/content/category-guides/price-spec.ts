/**
 * Intervalele din tabelele de prețuri („70–130 lei/mp”, „5.000–10.000 lei”, „de la 300 lei”) ca numere,
 * pentru datele structurate (UnitPriceSpecification). Rândurile în procente sau „salarii” se ignoră.
 */
export type PriceSpec = { min: number; max: number | null; unit: string | null };

function num(s: string) {
  return Number(s.replace(/\./g, "").replace(",", "."));
}

export function parsePriceRange(range: string): PriceSpec | null {
  const m = range.trim().match(/^(?:de la\s+)?(\d[\d.]*(?:,\d+)?)(?:\s*[–-]\s*(\d[\d.]*(?:,\d+)?))?\s*lei(?:\/(.+))?$/);
  if (!m) return null;
  const min = num(m[1]);
  const max = m[2] ? num(m[2]) : null;
  if (!Number.isFinite(min) || (max !== null && (!Number.isFinite(max) || max < min))) return null;
  return { min, max, unit: m[3]?.trim() ?? null };
}
