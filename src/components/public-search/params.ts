export type RawParams = Record<string, string | string[] | undefined>;

/** Aplatizează searchParams; cheile repetate (checkbox-uri) devin listă separată prin virgulă. */
export function flattenParams(raw: RawParams): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(raw)) out[k] = Array.isArray(v) ? v.join(",") : v;
  return out;
}

export function toQuery(params: Record<string, string | number | boolean | null | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "" || v === false) continue;
    sp.set(k, v === true ? "1" : String(v));
  }
  return sp.toString();
}
