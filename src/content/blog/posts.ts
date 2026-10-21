/**
 * Articolele de blog. Conținutul stă în `src/content/blog/<slug>.mdx`; aici sunt metadatele
 * (folosite de /blog, sitemap, JSON-LD și legăturile din paginile de categorie).
 */
export type Post = {
  slug: string;
  title: string;
  /** Meta description, 120–155 de caractere. */
  description: string;
  /** Data publicării, ISO (YYYY-MM-DD). */
  date: string;
  updated?: string;
  readingMinutes: number;
  /** Categoriile la care trimite articolul (și în paginile cărora apare). */
  categories: string[];
};

export const posts: Post[] = [
  {
    slug: "cat-costa-renovare-baie",
    title: "Cât costă renovarea unei băi în 2026: prețuri și etape",
    description:
      "Cât costă renovarea unei băi de 4 mp la bloc în 2026: prețuri pe nivel de finisaj, manopera pe fiecare lucrare, etapele, durata și ce conține oferta.",
    date: "2026-10-21",
    readingMinutes: 9,
    categories: ["renovari-complete", "gresie-faianta", "instalatii-sanitare"],
  },
  {
    slug: "platforme-freelancing-romania",
    title: "Platforme freelancing România 2026: comisioane și clienți",
    description:
      "Compară platformele de freelancing din România și străinătate: comisioane verificate în 2026, Upwork vs site-uri românești și cum găsești clienți singur.",
    date: "2026-10-21",
    readingMinutes: 10,
    categories: ["dezvoltare-web", "contabilitate"],
  },
  {
    slug: "traducere-autorizata-vs-legalizata",
    title: "Traducere autorizată vs legalizată: diferențe, preț, apostilă",
    description:
      "Ce e traducerea autorizată și ce e cea legalizată, când îți trebuie apostila de la Haga sau supralegalizarea, cât costă pe pagină în 2026 și cât durează.",
    date: "2026-10-21",
    readingMinutes: 8,
    categories: ["traduceri", "corectura", "consultanta-juridica"],
  },
  {
    slug: "cat-costa-o-mutare",
    title: "Cât costă o mutare în 2026: prețuri pe apartament și pe km",
    description:
      "Cât costă o mutare în 2026: prețuri pentru garsonieră, 2 sau 3 camere și casă, tarif pe km în alt oraș, costuri extra și cum alegi firma de mutări.",
    date: "2026-10-21",
    readingMinutes: 9,
    categories: ["mutari", "transport-marfa", "debarasare"],
  },
  {
    slug: "cadastru-intabulare-acte-necesare-cost",
    title: "Acte necesare cadastru și intabulare: costuri și termene 2026",
    description:
      "Ce acte îți trebuie pentru cadastru și intabulare la cumpărare, moștenire, casă nouă sau teren, cât costă în 2026 (topograf și OCPI) și cât durează.",
    date: "2026-10-21",
    readingMinutes: 9,
    categories: ["topografie-cadastru", "evaluari-imobiliare"],
  },
  {
    slug: "model-contract-renovare-avans-mesterias",
    title: "Model contract renovare apartament: clauze și cât avans dai",
    description:
      "Model gratuit de contract de renovare apartament: clauze obligatorii, cât avans dai meseriașului, plata pe etape și ce faci dacă dispare cu banii.",
    date: "2026-10-21",
    readingMinutes: 11,
    categories: ["renovari-complete", "gresie-faianta", "contracte"],
  },
  {
    slug: "verificare-iscir-revizie-centrala-termica",
    title: "Verificare ISCIR centrală termică: termene și prețuri 2026",
    description:
      "Verificarea ISCIR a centralei se face la 2 ani. Vezi diferența față de revizia anuală și verificarea gazelor ANRE, ce acte primești și cât costă în 2026.",
    date: "2026-10-21",
    readingMinutes: 8,
    categories: ["instalatii-termice"],
  },
  {
    slug: "cat-costa-refacere-instalatie-electrica-apartament",
    title: "Cât costă refacerea instalației electrice într-un apartament",
    description:
      "Refacerea instalației electrice la 2 camere costă 5.000–9.000 lei în 2026. Prețuri pe apartament, tablou, priză, PRAM și cum verifici electricianul ANRE.",
    date: "2026-10-21",
    readingMinutes: 8,
    categories: ["instalatii-electrice", "renovari-complete"],
  },
];

export const postsBySlug = new Map(posts.map((p) => [p.slug, p]));

export function postsForCategory(slug: string) {
  return posts.filter((p) => p.categories.includes(slug));
}
