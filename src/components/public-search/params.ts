import { stripControlChars } from "@/lib/text";

export type RawParams = Record<string, string | string[] | undefined>;

/** Lungimea maximă a unei căutări în limbaj natural trimise la AI. */
export const AI_QUERY_MAX = 300;

/**
 * Aplatizează searchParams; cheile repetate (checkbox-uri) devin listă separată prin virgulă.
 * Caracterele de control (ex. `%00`) sunt eliminate: Postgres refuză `\u0000` și pagina ar răspunde cu 500.
 */
export function flattenParams(raw: RawParams): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(raw)) {
    const value = Array.isArray(v) ? v.join(",") : v;
    out[k] = value === undefined ? undefined : stripControlChars(value);
  }
  return out;
}

/** Textul căutării AI: curățat, tăiat la `AI_QUERY_MAX` caractere; `null` dacă e prea scurt pentru a fi interpretat. */
export function cleanAiQuery(raw: string | undefined): string | null {
  const text = stripControlChars(raw ?? "").replace(/\s+/g, " ").trim().slice(0, AI_QUERY_MAX).trim();
  return text.length > 2 ? text : null;
}

export function toQuery(params: Record<string, string | number | boolean | null | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "" || v === false) continue;
    sp.set(k, v === true ? "1" : String(v));
  }
  return sp.toString();
}
