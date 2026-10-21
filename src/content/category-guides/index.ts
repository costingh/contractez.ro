import { autoEventsBeautyGuides } from "./auto-events-beauty";
import { buildInstallGuides } from "./build-install";
import { businessLegalGuides } from "./business-legal";
import { creativeTechGuides } from "./creative-tech";
import { homeTransportGuides } from "./home-transport";
import { mediaEducationGuides } from "./media-education";
import type { CategoryGuide, CategoryGuides } from "./types";

export type { CategoryGuide } from "./types";

const guides: CategoryGuides = {
  ...creativeTechGuides,
  ...mediaEducationGuides,
  ...buildInstallGuides,
  ...homeTransportGuides,
  ...autoEventsBeautyGuides,
  ...businessLegalGuides,
};

export function getCategoryGuide(slug: string): CategoryGuide | undefined {
  return guides[slug];
}

export const categoryGuideSlugs = Object.keys(guides);

/** Luna ultimei actualizări a prețurilor orientative (afișată sub tabele). */
export const guidesUpdated = "octombrie 2026";
/** Aceeași dată, ISO, pentru datele structurate. */
export const guidesUpdatedIso = "2026-10-21";

function lowerFirst(s: string) {
  // „PFA în sistem real” și „DJ nuntă” rămân așa; „Montaj gresie” devine „montaj gresie”.
  return /^\p{Lu}\p{Ll}/u.test(s) ? s[0].toLocaleLowerCase("ro-RO") + s.slice(1) : s;
}

/**
 * Răspunsul direct pentru partea de sus a paginii de categorie: prima frază din intro (ce este serviciul)
 * și primul preț orientativ din tabel. Se compune din textele existente, fără conținut nou.
 */
export function guideAnswer(guide: CategoryGuide): string {
  const first = guide.intro[0]?.split(/(?<=[.!?])\s+(?=[\p{Lu}„])/u)[0] ?? "";
  const p = guide.prices?.[0];
  if (!p) return first;
  return `${first} Preț orientativ în ${guidesUpdated}: ${lowerFirst(p.item)}, ${p.range}${p.note ? ` (${p.note})` : ""}.`;
}
