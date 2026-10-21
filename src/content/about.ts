/**
 * Faptele despre platformă, într-un singur loc: pagina /despre, /llms.txt și /llms-full.txt le folosesc pe aceleași.
 * Cifrele vin din src/config/site.ts, ca să nu existe copii care rămân în urmă.
 */
import { plans, rules, site, type Plan } from "@/config/site";
import { pluralRo } from "@/lib/text";
import { cities } from "./cities";

const max = rules.defaultMaxApplications;

/** Definiția într-o frază, de citat ca atare. */
export const aboutDefinition = `${site.name} este o platformă românească de servicii, lansată în ${site.launched.label}, pe care clienții publică gratuit un proiect și primesc cel mult ${pluralRo(max, "ofertă", "oferte")} de la prestatori verificați, compatibili cu cerința lor, fără comision din lucrare.`;

export const clientSteps: string[] = [
  "Descrii lucrarea cu cuvintele tale; platforma o structurează (categorie, buget, localitate, termen, factură) și întreabă doar ce lipsește.",
  "Îți confirmi emailul și publici gratuit. Telefonul, emailul și adresa exactă nu apar în anunț, doar localitatea.",
  "Sunt anunțați doar prestatorii compatibili: oferă serviciul, acoperă zona, se încadrează în buget și emit factură dacă o ceri.",
  `Primești cel mult ${pluralRo(max, "ofertă", "oferte")}. Dacă vrei mai multe variante, extinzi selecția cu încă ${rules.reopenIncrement}, până la ${rules.maxApplicationsCap} în total. Proiectul rămâne deschis ${pluralRo(rules.projectLifetimeDays, "zi", "zile")}.`,
  "Compari tarife, portofolii și recenzii, discuți în chat și alegi. Prețul, termenele și plata le stabilești direct cu prestatorul.",
];

export const providerSteps: string[] = [
  "Îți faci gratuit profilul: servicii, tarif, localitate, raza în care te deplasezi și dacă emiți factură.",
  `Primești alerte pentru proiectele compatibile, cu un scor de compatibilitate din 100, calculat după aceeași formulă pentru toți (pragul minim este ${rules.minMatchScore}).`,
  `Aplici cu o ofertă și vezi ce se întâmplă cu ea: livrată, citită, pe lista scurtă, aleasă sau respinsă. Aplicările pe care clientul nu le vede în ${pluralRo(rules.unseenRefundDays, "zi", "zile")} nu se mai socotesc în limita lunară.`,
  `Pe planurile plătite, Auto Bid poate aplica pentru tine după regulile tale, doar după primele ${pluralRo(rules.autoBidDelayMinutes, "minut", "minute")} rezervate aplicărilor făcute de oameni și în cel mult ${rules.defaultMaxAutoApplications} din cele ${max} locuri.`,
  `Plătești doar abonamentul, dacă ai nevoie de mai multe aplicări. ${site.name} nu ia comision din lucrare.`,
];

export const verificationFacts: string[] = [
  "Emailul confirmat este obligatoriu: clienții îl confirmă înainte să publice, iar prestatorii, înainte să aplice și să apară în căutări.",
  "Firmele sunt verificate după CUI în serviciul web public ANAF: că firma există și este activă (nu e inactivă sau radiată), dacă e plătitoare de TVA și dacă e înregistrată în e-Factura. Profilul primește insigna „Firmă verificată ANAF”, iar verificarea se reface periodic: dacă firma nu mai apare activă, insigna se scoate.",
  "Un CUI poate fi confirmat pe un singur cont, iar folosirea abuzivă poate fi raportată.",
  "Recenziile apar doar după o colaborare confirmată de ambele părți.",
  "Proiectele duplicate sau suspecte sunt oprite și verificate de un moderator înainte de publicare.",
];

export const notDoing: string[] = [
  "Nu intermediază plata lucrării: clientul și prestatorul stabilesc și fac plata direct, fără escrow.",
  "Nu ia comision din lucrare, nici de la client, nici de la prestator.",
  "Nu este parte în contractul dintre client și prestator.",
  "Nu verifică identitatea persoanelor sau existența fondurilor clientului și nu garantează obținerea unui contract.",
  "Nu vinde poziții în scorul de compatibilitate: promovarea plătită este etichetată „Promovat” și nu schimbă scorul.",
];

/** „Pro: 49 lei/lună, 40 de aplicări pe lună, Auto Bid (aplicări automate), oferte evidențiate la client.” */
export function planSummary(plan: Plan): string {
  const price = plan.priceLei === 0 ? "0 lei" : `${plan.priceLei} lei/lună`;
  const extras = [
    plan.autoBid && "Auto Bid (aplicări automate)",
    plan.highlightApplications && "oferte evidențiate la client",
    plan.promotedProfile && "profil promovat și insigna „Recomandat”",
  ].filter(Boolean);
  return `${plan.name}: ${price}, ${pluralRo(plan.monthlyApplications, "aplicare", "aplicări")} pe lună${extras.length ? `, ${extras.join(", ")}` : ""}.`;
}

export const pricingFacts: string[] = [
  `Pentru clienți, ${site.name} este gratuit: publicarea proiectului și ofertele nu costă nimic.`,
  ...plans.map((p) => `Prestatori, planul ${planSummary(p)}`),
  "Limita lunară include aplicările manuale și pe cele automate și se resetează la începutul perioadei: luna calendaristică pentru Gratuit, perioada de facturare pentru planurile plătite.",
];

export const coverageText = `Toată România, pentru servicii la distanță și la fața locului, cu pagini dedicate pentru ${pluralRo(cities.length, "oraș", "orașe")}: ${cities.map((c) => c.name).join(", ")}.`;
