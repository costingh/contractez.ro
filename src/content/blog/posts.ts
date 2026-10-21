/**
 * Articolele de blog. Conținutul stă în `src/content/blog/<slug>.mdx`; aici sunt metadatele
 * (folosite de /blog, sitemap, JSON-LD și legăturile din paginile de categorie).
 */
import { plans } from "@/config/site";

const [freePlan, proPlan, businessPlan] = plans;

export type Post = {
  slug: string;
  title: string;
  /** Meta description, 120–155 de caractere. */
  description: string;
  /** Data publicării, ISO (YYYY-MM-DD). */
  date: string;
  updated?: string;
  /**
   * „Pe scurt”: 2–3 fraze care răspund direct la întrebarea principală, cu cifre.
   * Apare în caseta de la începutul articolului și în /llms.txt.
   */
  summary?: string;
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
    summary:
      "O baie de bloc de 4 mp costă în 2026, orientativ, 9.000–19.000 lei la cheie, cu manoperă, materiale și obiecte sanitare de gamă economică sau medie; din această sumă, manopera înseamnă de obicei 5.000–9.000 lei. O baie standard de 5–6 mp ajunge la 12.000–25.000 lei, iar varianta premium pornește de la circa 28.000 lei. Prețul depinde mai ales de refacerea instalațiilor, de plăcile și obiectele sanitare alese și de oraș.",
    readingMinutes: 9,
    categories: ["renovari-complete", "gresie-faianta", "instalatii-sanitare"],
  },
  {
    slug: "platforme-freelancing-romania",
    title: "Platforme freelancing România 2026: comisioane și clienți",
    description:
      "Compară platformele de freelancing din România și străinătate: comisioane verificate în 2026, Upwork vs site-uri românești și cum găsești clienți singur.",
    date: "2026-10-21",
    summary: `Platformele internaționale (Upwork, Fiverr, Freelancer.com) au cel mai mare volum de proiecte remote, dar iau comision: 0–15% pe contract la Upwork, circa 20% la Fiverr și 10% la Freelancer.com (verificat în octombrie 2026). Pentru clienți din România și lucrări la fața locului, platformele de cereri de ofertă (HomeRun, Daibau, CautAjutor.ro, Contractez) taxează pe ofertă sau prin abonament, nu cu un procent din lucrare. Contractez are un plan ${freePlan.name} cu ${freePlan.monthlyApplications} aplicări pe lună, ${proPlan.name} la ${proPlan.priceLei} lei și ${businessPlan.name} la ${businessPlan.priceLei} lei pe lună, fără comision.`,
    readingMinutes: 10,
    categories: ["dezvoltare-web", "contabilitate"],
  },
  {
    slug: "traducere-autorizata-vs-legalizata",
    title: "Traducere autorizată vs legalizată: diferențe, preț, apostilă",
    description:
      "Ce e traducerea autorizată și ce e cea legalizată, când îți trebuie apostila de la Haga sau supralegalizarea, cât costă pe pagină în 2026 și cât durează.",
    date: "2026-10-21",
    summary:
      "Traducerea autorizată este făcută, semnată și ștampilată de un traducător autorizat de Ministerul Justiției, iar cea legalizată este aceeași traducere, la care un notar legalizează semnătura traducătorului. În 2026, traducerea autorizată costă orientativ 40–70 lei pe pagină pentru engleză, franceză, italiană sau spaniolă, iar legalizarea la notar adaugă 50–120 lei pe document. Pentru actele folosite într-un stat parte la Convenția de la Haga se cere adesea și apostila, aplicată de Camera Notarilor Publici.",
    readingMinutes: 8,
    categories: ["traduceri", "corectura", "consultanta-juridica"],
  },
  {
    slug: "cat-costa-o-mutare",
    title: "Cât costă o mutare în 2026: prețuri pe apartament și pe km",
    description:
      "Cât costă o mutare în 2026: prețuri pentru garsonieră, 2 sau 3 camere și casă, tarif pe km în alt oraș, costuri extra și cum alegi firma de mutări.",
    date: "2026-10-21",
    summary:
      "În 2026, o mutare în același oraș costă orientativ 400–900 lei pentru o garsonieră, 700–1.600 lei pentru un apartament de 2 camere și 1.200–3.000 lei pentru 3 camere sau o casă. La oră, o dubă cu șofer și 2 hamali costă în jur de 180–310 lei, iar în alt oraș transportul se adaugă cu circa 2–3,5 lei/km. Etajele fără lift, ambalarea și demontarea mobilei se plătesc separat.",
    readingMinutes: 9,
    categories: ["mutari", "transport-marfa", "debarasare"],
  },
  {
    slug: "cadastru-intabulare-acte-necesare-cost",
    title: "Acte necesare cadastru și intabulare: costuri și termene 2026",
    description:
      "Ce acte îți trebuie pentru cadastru și intabulare la cumpărare, moștenire, casă nouă sau teren, cât costă în 2026 (topograf și OCPI) și cât durează.",
    date: "2026-10-21",
    summary:
      "Cadastrul înseamnă măsurarea imobilului și documentația făcută de un topograf autorizat ANCPI, iar intabularea înseamnă înscrierea proprietății în cartea funciară, la OCPI. În 2026, documentația topografului costă orientativ 500–1.100 lei la un apartament și 1.600–3.000 lei la o casă cu teren; prima înscriere este gratuită pentru proprietari din aprilie 2025, iar intabularea după o vânzare costă 0,15% din valoarea din act, minimum 60 lei. OCPI soluționează intabularea în 7 zile lucrătoare (2 zile în regim de urgență).",
    readingMinutes: 9,
    categories: ["topografie-cadastru", "evaluari-imobiliare"],
  },
  {
    slug: "model-contract-renovare-avans-mesterias",
    title: "Model contract renovare apartament: clauze și cât avans dai",
    description:
      "Model gratuit de contract de renovare apartament: clauze obligatorii, cât avans dai meseriașului, plata pe etape și ce faci dacă dispare cu banii.",
    date: "2026-10-21",
    summary:
      "Pentru renovarea unui apartament semnezi un contract de antrepriză (Codul civil, art. 1.851–1.880), cu deviz anexat, plată pe etape și proces-verbal de recepție. Un avans rezonabil este de 10–20% din manoperă sau doar banii pentru materialele primei etape, plătiți pe factură sau bon. Restul îl plătești după ce verifici fiecare etapă terminată; cererea de a plăti jumătate sau tot dinainte, fără documente, e cel mai clar semnal de risc.",
    readingMinutes: 11,
    categories: ["renovari-complete", "gresie-faianta", "contracte"],
  },
  {
    slug: "verificare-iscir-revizie-centrala-termica",
    title: "Verificare ISCIR centrală termică: termene și prețuri 2026",
    description:
      "Verificarea ISCIR a centralei se face la 2 ani. Vezi diferența față de revizia anuală și verificarea gazelor ANRE, ce acte primești și cât costă în 2026.",
    date: "2026-10-21",
    summary:
      "Verificarea ISCIR (verificarea tehnică periodică, VTP) este obligatorie la 2 ani pentru centralele termice de până la 400 kW, inclusiv cele de apartament, și o face o firmă autorizată ISCIR; costă orientativ 200–400 lei în 2026. Revizia anuală recomandată de producător (200–450 lei) este separată, la fel ca verificarea instalației de gaze la cel mult 2 ani și revizia la cel mult 10 ani, cerute de ANRE. Un pachet revizie plus VTP costă de regulă 300–550 lei.",
    readingMinutes: 8,
    categories: ["instalatii-termice"],
  },
  {
    slug: "cat-costa-refacere-instalatie-electrica-apartament",
    title: "Cât costă refacerea instalației electrice într-un apartament",
    description:
      "Refacerea instalației electrice la 2 camere costă 5.000–9.000 lei în 2026. Prețuri pe apartament, tablou, priză, PRAM și cum verifici electricianul ANRE.",
    date: "2026-10-21",
    summary:
      "Refacerea completă a instalației electrice într-un apartament de 2 camere costă în 2026, orientativ, 5.000–9.000 lei cu manoperă și materiale standard; o garsonieră costă 3.500–6.000 lei, iar un apartament de 3 camere 7.000–12.000 lei. Un tablou electric nou costă 500–2.600 lei, iar refacerea tencuielii și zugrăvitul după șlițuire se adaugă de obicei separat (1.000–3.000 lei la 2 camere). Lucrarea trebuie făcută de un electrician autorizat ANRE, pe care îl verifici pe spv.anre.ro.",
    readingMinutes: 8,
    categories: ["instalatii-electrice", "renovari-complete"],
  },
];

export const postsBySlug = new Map(posts.map((p) => [p.slug, p]));

export function postsForCategory(slug: string) {
  return posts.filter((p) => p.categories.includes(slug));
}
