// Configurația de business. Prețurile și regulile sunt aici, nu în baza de date,
// ca să fie versionate și testate.

export const site = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "Contractez",
  tagline: "Găsești rapid prestatorul potrivit. Sau următorul proiect.",
  description:
    "Marketplace românesc pentru servicii: publici gratuit un proiect, primești oferte de la prestatori verificați, compatibili cu cerințele tale.",
  supportEmail: "contact@contractez.ro",
  /** Cine operează platforma (apare în Termeni, Confidențialitate și footer). */
  operator: "Gheorghe Constantin, persoană fizică",
  /** Platforma ANPC de soluționare alternativă a litigiilor (Ordinul ANPC 449/2022, modificat prin Ordinul 270/2026). */
  anpcSalUrl: "https://reclamatiisal.anpc.ro/",
  /** Numele operatorului (fondator), pentru datele structurate. */
  founder: "Gheorghe Constantin",
  /** Autorul articolelor de pe blog (fondatorul), cu numele în ordinea obișnuită. */
  author: "Constantin Gheorghe",
  /** Lansarea publică a platformei: ISO (pentru JSON-LD) și textul afișat. */
  launched: { iso: "2026-10", label: "octombrie 2026" },
} as const;

export const rules = {
  /** Locuri de aplicare implicite per proiect. */
  defaultMaxApplications: 5,
  /** Câte dintre locuri pot fi ocupate de aplicări automate. */
  defaultMaxAutoApplications: 2,
  /** Cu cât poate clientul extinde selecția, o dată. */
  reopenIncrement: 5,
  maxApplicationsCap: 15,
  /** Fereastra în care doar oamenii pot aplica, înainte de Auto Bid (minute). */
  autoBidDelayMinutes: 30,
  /** Durata implicită a unui proiect deschis (zile). */
  projectLifetimeDays: 30,
  /** Câți prestatori notificăm instant pentru un proiect nou. */
  maxInstantNotifications: 40,
  /** Procent rezervat profilurilor noi în distribuția oportunităților. */
  newcomerShare: 0.2,
  /** Scor minim pentru a considera un prestator compatibil. */
  minMatchScore: 45,
  /** Dacă clientul nu vede aplicarea în atâtea zile, ea nu se mai socotește în limita lunară. */
  unseenRefundDays: 7,
  /** Recompensa pentru o recomandare: zile de Pro gratuit. */
  referralProDays: 30,
  maxUploadBytes: 5 * 1024 * 1024,
} as const;

/*
 * Abonamente pentru prestatori. Clienții nu plătesc nimic.
 * Fiecare plan are o limită lunară de aplicări (manuale + automate), resetată la începutul
 * perioadei: luna calendaristică pentru Gratuit, perioada de facturare pentru planurile plătite.
 */
export type PlanId = "free" | "pro" | "business";

export type Plan = {
  id: PlanId;
  name: string;
  priceLei: number;
  tagline: string;
  monthlyApplications: number;
  /** Aplicări automate (Auto Bid). */
  autoBid: boolean;
  /** Ofertele apar evidențiate în lista clientului. */
  highlightApplications: boolean;
  /** Profil în secțiunea „Promovat” și insigna „Recomandat”. */
  promotedProfile: boolean;
  features: string[];
  highlight?: boolean;
};

export const plans: Plan[] = [
  {
    id: "free",
    name: "Gratuit",
    priceLei: 0,
    tagline: "Pentru început și prestatori ocazionali",
    monthlyApplications: 5,
    autoBid: false,
    highlightApplications: false,
    promotedProfile: false,
    features: ["5 aplicări pe lună", "Profil public și card cu cod QR", "Alerte pentru proiecte compatibile", "Chat nelimitat cu clienții"],
  },
  {
    id: "pro",
    name: "Pro",
    priceLei: 49,
    tagline: "Pentru cei care lucrează constant",
    monthlyApplications: 40,
    autoBid: true,
    highlightApplications: true,
    promotedProfile: false,
    features: ["40 de aplicări pe lună", "Auto Bid: aplicări automate după regulile tale", "Ofertele tale apar evidențiate la client", "Tot ce include Gratuit"],
    highlight: true,
  },
  {
    id: "business",
    name: "Business",
    priceLei: 149,
    tagline: "Pentru firme și echipe",
    monthlyApplications: 200,
    autoBid: true,
    highlightApplications: true,
    promotedProfile: true,
    features: ["200 de aplicări pe lună", "Profil promovat în căutări", "Insigna „Recomandat” în categorie", "Tot ce include Pro"],
  },
];

export const freePlan = plans[0];

export function getPlan(id: string | null | undefined) {
  return plans.find((p) => p.id === id);
}

export const paidPlans = plans.filter((p) => p.priceLei > 0);

export const labels = {
  workMode: { remote: "Remote", on_site: "La fața locului", hybrid: "Hibrid" },
  invoice: { required: "Factură obligatorie", preferred: "Preferabil cu factură", not_needed: "Factura nu e necesară" },
  urgency: { flexible: "Flexibil", this_month: "Luna aceasta", this_week: "Săptămâna aceasta", urgent: "Urgent" },
  budgetType: { fixed: "Preț fix", hourly: "Tarif orar", monthly: "Lunar", unknown: "De discutat" },
  priceType: { fixed: "Preț fix", hourly: "Pe oră", monthly: "Pe lună", to_discuss: "De discutat" },
  legalEntity: { none: "Persoană fizică", pfa: "PFA", ii: "Întreprindere individuală", srl: "SRL", other: "Altă formă" },
  availability: { available: "Disponibil", busy: "Ocupat parțial", unavailable: "Indisponibil" },
  pricingModel: { hourly: "Tarif orar", fixed: "Preț pe proiect", quote: "Ofertă personalizată" },
  priceUnit: { hour: "oră", project: "proiect", day: "zi", sqm: "mp", unit: "bucată", month: "lună" },
  projectStatus: {
    draft: "Ciornă",
    pending_review: "În verificare",
    open: "Deschis",
    in_progress: "În desfășurare",
    closed: "Închis",
    cancelled: "Anulat",
    removed: "Eliminat",
  },
  applicationStatus: {
    submitted: "Trimisă",
    viewed: "Citită",
    shortlisted: "Pe lista scurtă",
    rejected: "Respinsă",
    hired: "Aleasă",
    withdrawn: "Retrasă",
    refunded: "Restituită",
  },
} as const;
