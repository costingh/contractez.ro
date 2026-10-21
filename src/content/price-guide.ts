/**
 * Datele pentru /ghid-preturi: toate tabelele de prețuri din ghidurile de categorie, grupate pe categoria principală,
 * în ordinea din taxonomie. Rândurile din ghidul categoriei principale care repetă exact un rând dintr-o subcategorie
 * nu se mai afișează a doua oară.
 */
import { taxonomy } from "../../db/seed-data/taxonomy";
import { getCategoryGuide, type CategoryGuide } from "./category-guides";

export type PriceRow = NonNullable<CategoryGuide["prices"]>[number];
export type PriceTable = { slug: string; name: string; rows: PriceRow[] };
export type PriceGroup = {
  slug: string;
  name: string;
  description: string;
  /** Rândurile proprii ale categoriei principale, care nu apar deja la subcategorii. */
  general: PriceRow[];
  subs: PriceTable[];
};

const key = (r: PriceRow) => `${r.item}|${r.range}`;

export function priceGuideGroups(): PriceGroup[] {
  return taxonomy
    .map((root) => {
      const subs = root.subs
        .map((s) => ({ slug: s.slug, name: s.name, rows: getCategoryGuide(s.slug)?.prices ?? [] }))
        .filter((t) => t.rows.length > 0);
      const seen = new Set(subs.flatMap((t) => t.rows.map(key)));
      const general = (getCategoryGuide(root.slug)?.prices ?? []).filter((r) => !seen.has(key(r)));
      return { slug: root.slug, name: root.name, description: root.description, general, subs };
    })
    .filter((g) => g.general.length > 0 || g.subs.length > 0);
}

export function priceGuideStats(groups = priceGuideGroups()) {
  return {
    groups: groups.length,
    services: groups.reduce((n, g) => n + g.subs.length, 0),
    rows: groups.reduce((n, g) => n + g.general.length + g.subs.reduce((m, t) => m + t.rows.length, 0), 0),
  };
}
