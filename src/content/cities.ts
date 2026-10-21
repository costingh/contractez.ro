/**
 * Orașele cu pagini dedicate categorie × oraș (/categorii/[slug]/[oras]).
 * Se indexează din start doar combinațiile din `indexedCityPages` (cerere locală + concurență slabă,
 * vezi docs/SEO-KEYWORDS.md); restul devin indexabile când au prestatori sau proiecte reale în zonă.
 */
export type City = {
  slug: string;
  name: string;
  /** Județul, cu diacritice, pentru texte. */
  county: string;
  /** Codul județului din tabela localities (pentru potrivirea localității). */
  countyCode: string;
  /** Operatorul de distribuție a energiei electrice din zonă (avize, branșamente, mărirea puterii). */
  powerDistributor: string;
  /** Prețurile tind spre partea de sus a intervalului (orașe mari, cerere mare). */
  highPrices?: boolean;
};

const DEER = "Distribuție Energie Electrică Romania (DEER)";

export const cities: City[] = [
  { slug: "bucuresti", name: "București", county: "București", countyCode: "B", powerDistributor: "Rețele Electrice Muntenia", highPrices: true },
  { slug: "cluj-napoca", name: "Cluj-Napoca", county: "Cluj", countyCode: "CJ", powerDistributor: DEER, highPrices: true },
  { slug: "timisoara", name: "Timișoara", county: "Timiș", countyCode: "TM", powerDistributor: "Rețele Electrice Banat", highPrices: true },
  { slug: "iasi", name: "Iași", county: "Iași", countyCode: "IS", powerDistributor: "Delgaz Grid" },
  { slug: "constanta", name: "Constanța", county: "Constanța", countyCode: "CT", powerDistributor: "Rețele Electrice Dobrogea" },
  { slug: "brasov", name: "Brașov", county: "Brașov", countyCode: "BV", powerDistributor: DEER, highPrices: true },
  { slug: "craiova", name: "Craiova", county: "Dolj", countyCode: "DJ", powerDistributor: "Distribuție Energie Oltenia" },
  { slug: "galati", name: "Galați", county: "Galați", countyCode: "GL", powerDistributor: DEER },
  { slug: "ploiesti", name: "Ploiești", county: "Prahova", countyCode: "PH", powerDistributor: DEER },
  { slug: "oradea", name: "Oradea", county: "Bihor", countyCode: "BH", powerDistributor: DEER },
  { slug: "sibiu", name: "Sibiu", county: "Sibiu", countyCode: "SB", powerDistributor: DEER },
  { slug: "arad", name: "Arad", county: "Arad", countyCode: "AR", powerDistributor: "Rețele Electrice Banat" },
  { slug: "pitesti", name: "Pitești", county: "Argeș", countyCode: "AG", powerDistributor: "Distribuție Energie Oltenia" },
  { slug: "bacau", name: "Bacău", county: "Bacău", countyCode: "BC", powerDistributor: "Delgaz Grid" },
  { slug: "braila", name: "Brăila", county: "Brăila", countyCode: "BR", powerDistributor: DEER },
  { slug: "targu-mures", name: "Târgu Mureș", county: "Mureș", countyCode: "MS", powerDistributor: DEER },
  { slug: "baia-mare", name: "Baia Mare", county: "Maramureș", countyCode: "MM", powerDistributor: DEER },
  { slug: "buzau", name: "Buzău", county: "Buzău", countyCode: "BZ", powerDistributor: DEER },
  { slug: "suceava", name: "Suceava", county: "Suceava", countyCode: "SV", powerDistributor: "Delgaz Grid" },
  { slug: "satu-mare", name: "Satu Mare", county: "Satu Mare", countyCode: "SM", powerDistributor: DEER },
];

export const citiesBySlug = new Map(cities.map((c) => [c.slug, c]));

/**
 * Serviciile care au sens căutate „+ oraș”, cu termenul pe care îl folosesc oamenii.
 * `noun`: forma din titlu („Electrician Cluj-Napoca”), `plural`: „electricieni verificați”.
 */
export type CityService = { noun: string; plural: string };

export const cityServices: Record<string, CityService> = {
  "renovari-complete": { noun: "Renovare apartament", plural: "firme de renovări" },
  finisaje: { noun: "Finisaje interioare", plural: "meseriași pentru finisaje" },
  "gresie-faianta": { noun: "Montaj gresie și faianță", plural: "faianțari" },
  constructii: { noun: "Firmă de construcții", plural: "constructori" },
  acoperisuri: { noun: "Acoperișuri", plural: "firme de acoperișuri" },
  termoizolatii: { noun: "Termoizolație", plural: "firme de termoizolații" },
  "instalatii-sanitare": { noun: "Instalator", plural: "instalatori" },
  "instalatii-electrice": { noun: "Electrician", plural: "electricieni" },
  "instalatii-termice": { noun: "Instalator centrale termice", plural: "instalatori autorizați" },
  "aer-conditionat": { noun: "Montaj aer condiționat", plural: "montatori de aer condiționat" },
  "panouri-solare": { noun: "Panouri fotovoltaice", plural: "instalatori de panouri fotovoltaice" },
  "smart-home": { noun: "Sisteme de securitate", plural: "instalatori de sisteme de securitate" },
  curatenie: { noun: "Firmă de curățenie", plural: "firme de curățenie" },
  mobila: { noun: "Mobilă la comandă", plural: "tâmplari" },
  gradinarit: { noun: "Grădinar", plural: "grădinari" },
  "reparatii-casa": { noun: "Handyman", plural: "meseriași" },
  electrocasnice: { noun: "Reparații electrocasnice", plural: "tehnicieni" },
  dezinsectie: { noun: "Dezinsecție și deratizare", plural: "firme DDD" },
  mutari: { noun: "Firmă de mutări", plural: "firme de mutări" },
  "transport-marfa": { noun: "Transport marfă", plural: "transportatori" },
  debarasare: { noun: "Debarasare", plural: "firme de debarasare" },
  soferi: { noun: "Șofer", plural: "șoferi" },
  mecanica: { noun: "Mecanic auto", plural: "mecanici auto" },
  "tinichigerie-vopsitorie": { noun: "Tinichigerie auto", plural: "tinichigii" },
  detailing: { noun: "Detailing auto", plural: "ateliere de detailing" },
  "electrica-auto": { noun: "Electrician auto", plural: "electricieni auto" },
  "organizare-evenimente": { noun: "Organizator evenimente", plural: "organizatori de evenimente" },
  "muzica-dj": { noun: "DJ", plural: "DJ" },
  catering: { noun: "Catering", plural: "firme de catering" },
  decor: { noun: "Decor evenimente", plural: "decoratori" },
  animatori: { noun: "Animatori petreceri copii", plural: "animatori" },
  "coafura-makeup": { noun: "Make-up artist", plural: "make-up artiști" },
  manichiura: { noun: "Manichiură", plural: "manichiuriste" },
  masaj: { noun: "Masaj", plural: "terapeuți" },
  "fitness-nutritie": { noun: "Antrenor personal", plural: "antrenori" },
  "pet-sitting": { noun: "Pet sitter", plural: "pet sitteri" },
  dresaj: { noun: "Dresaj câini", plural: "dresori" },
  toaletaj: { noun: "Toaletaj câini", plural: "groomeri" },
  fotografie: { noun: "Fotograf", plural: "fotografi" },
  filmare: { noun: "Videograf", plural: "videografi" },
  meditatii: { noun: "Meditații", plural: "profesori" },
  "limbi-straine": { noun: "Cursuri de limbi străine", plural: "profesori" },
  "muzica-arte": { noun: "Lecții de muzică", plural: "profesori" },
  "consultanta-juridica": { noun: "Avocat", plural: "avocați" },
  contabilitate: { noun: "Contabil", plural: "contabili" },
  arhitectura: { noun: "Arhitect", plural: "arhitecți" },
  "design-interior": { noun: "Designer de interior", plural: "designeri de interior" },
  "topografie-cadastru": { noun: "Cadastru și topografie", plural: "topografi autorizați" },
  "evaluari-imobiliare": { noun: "Evaluator imobiliar", plural: "evaluatori" },
  traduceri: { noun: "Traduceri autorizate", plural: "traducători autorizați" },
};

/** Combinațiile indexate din start: `categorie/oras`. */
export const indexedCityPages = new Set([
  "instalatii-electrice/craiova",
  "instalatii-electrice/brasov",
  "instalatii-electrice/ploiesti",
  "instalatii-electrice/iasi",
  "instalatii-electrice/constanta",
  "instalatii-electrice/oradea",
  "instalatii-electrice/sibiu",
  "instalatii-sanitare/sibiu",
  "instalatii-sanitare/arad",
  "instalatii-sanitare/craiova",
  "instalatii-sanitare/brasov",
  "instalatii-sanitare/iasi",
  "renovari-complete/pitesti",
  "renovari-complete/brasov",
  "renovari-complete/craiova",
  "renovari-complete/iasi",
  "renovari-complete/constanta",
  "instalatii-termice/iasi",
  "instalatii-termice/craiova",
  "instalatii-termice/brasov",
  "instalatii-termice/ploiesti",
  "topografie-cadastru/sibiu",
  "topografie-cadastru/brasov",
  "topografie-cadastru/iasi",
  "topografie-cadastru/arad",
  "electrocasnice/constanta",
  "mutari/iasi",
  "mutari/brasov",
  "curatenie/oradea",
  "dezinsectie/galati",
]);

export function isCityPageIndexedByDefault(categorySlug: string, city: City) {
  return indexedCityPages.has(`${categorySlug}/${city.slug}`);
}

/** Servicii pentru care contează distribuitorul de energie (avize, branșamente, PRAM). */
export const powerRelatedServices = new Set(["instalatii-electrice", "panouri-solare", "aer-conditionat", "instalatii-termice", "renovari-complete"]);
