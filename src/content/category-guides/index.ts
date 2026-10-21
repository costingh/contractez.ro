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
