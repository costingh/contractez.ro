import type { CategoryOption } from "@/components/shared/category-select";
import type { labels } from "@/config/site";
import { getCategoryGuide } from "@/content/category-guides";
import { getCatalog } from "./taxonomy";

export type PriceUnit = keyof typeof labels.priceUnit;
export type ServiceCategoryOption = { id: number; name: string; defaultUnit: PriceUnit };

const UNIT_SUFFIXES: [RegExp, PriceUnit][] = [
  [/\/\s*or[ăa](?!\p{L})/iu, "hour"],
  [/\/\s*mp\b/i, "sqm"],
  [/\/\s*zi\b/i, "day"],
  [/\/\s*(?:\S+\/)?lun[ăa](?!\p{L})/iu, "month"],
  [/\/\s*buc/i, "unit"],
];

/** Unitatea dintr-un preț orientativ („1.500–4.000 lei” → proiect, „120–200 lei/oră” → oră); null pentru alte unități. */
export function unitFromPriceRange(range: string): PriceUnit | null {
  for (const [re, unit] of UNIT_SUFFIXES) if (re.test(range)) return unit;
  return range.includes("/") || range.includes("%") ? null : "project";
}

/**
 * Unitatea de preț tipică pentru o categorie, din prețurile orientative ale ghidului ei (sau al categoriei-părinte):
 * cea mai frecventă unitate din tabel. Implicit „proiect” — niciodată „oră” din oficiu.
 */
export function typicalPriceUnit(slugs: (string | undefined)[]): PriceUnit {
  for (const slug of slugs) {
    const prices = slug ? getCategoryGuide(slug)?.prices : undefined;
    if (!prices?.length) continue;
    const counts = new Map<PriceUnit, number>();
    for (const p of prices) {
      const u = unitFromPriceRange(p.range);
      if (u) counts.set(u, (counts.get(u) ?? 0) + 1);
    }
    let best: PriceUnit | null = null;
    for (const [u, n] of counts) if (!best || n > counts.get(best)!) best = u;
    if (best) return best;
  }
  return "project";
}

/** Categoriile pentru formularul de servicii, cu unitatea de preț sugerată. */
export async function serviceCategoryOptions(ids: number[]): Promise<ServiceCategoryOption[]> {
  const c = await getCatalog();
  return ids.flatMap((id) => {
    const cat = c.byId.get(id);
    if (!cat) return [];
    const parent = cat.parentId ? c.byId.get(cat.parentId) : undefined;
    return [{ id, name: cat.name, defaultUnit: typicalPriceUnit([cat.slug, parent?.slug]) }];
  });
}

/** Categoriile serializate pentru componentele client. */
export async function categoryOptions(): Promise<CategoryOption[]> {
  const c = await getCatalog();
  return c.tree.map((t) => ({ id: t.id, name: t.name, children: t.children.map((ch) => ({ id: ch.id, name: ch.name })) }));
}
