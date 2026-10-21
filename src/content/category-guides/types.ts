/**
 * Conținut editorial pentru paginile de categorie (/categorii/[slug]): texte, prețuri orientative, întrebări frecvente.
 * Cheia este slug-ul categoriei din db/seed-data/taxonomy.ts.
 */
export type CategoryGuide = {
  /** <title> fără numele site-ului, max ~60 de caractere. */
  seoTitle: string;
  /** Meta description, 120–155 de caractere. */
  metaDescription: string;
  /** 2–3 paragrafe scurte despre serviciu: ce include, când ai nevoie de el. */
  intro: string[];
  /** Prețuri orientative în lei (subcategorii; opțional la categoriile principale). */
  prices?: { item: string; range: string; note?: string }[];
  /** Ce influențează prețul. */
  priceFactors?: string[];
  /** Cum alegi prestatorul potrivit. */
  checklist?: string[];
  faq: { q: string; a: string }[];
};

export type CategoryGuides = Record<string, CategoryGuide>;
