// Șabloanele mesajelor de outreach (docs/OUTREACH.md). AI-ul le adaptează la postarea fiecărei persoane;
// fără AI se folosesc ca atare, cu linkul scurt al grupului.
import { plans, rules } from "@/config/site";
import { env } from "../env";

export type OutreachAudience = "client" | "provider";

/** Domeniul public din șabloane, înlocuit cu linkul scurt. */
const SITE_PLACEHOLDER = "https://contractez.ro";

const maxOffers = rules.defaultMaxApplications;
const freeApplications = plans.find((p) => p.id === "free")?.monthlyApplications ?? 0;

/**
 * Cold DM, nu cerere de feedback: o frază despre postarea persoanei, ce câștigă ea concret, un singur pas cu linkul.
 * Cifrele vin din config, ca mesajele să nu promită altceva decât face platforma.
 */
export const OUTREACH_TEMPLATES: Record<OutreachAudience, string> = {
  provider: `Salut! Am văzut că oferi servicii în grup. Pe Contractez clienții publică proiecte și primesc cel mult ${maxOffers} oferte, deci oferta ta nu se pierde printre zeci de comentarii. Profilul e gratuit, ai ${freeApplications} aplicări gratuite pe lună și nu luăm comision din lucrare. Îți faci profilul în câteva minute: https://contractez.ro`,
  client: `Salut! Am văzut că cauți pe cineva pentru un proiect. Dacă n-ai găsit încă, îl poți publica gratuit pe Contractez: primești cel mult ${maxOffers} oferte de la prestatori, le compari și alegi tu. Telefonul nu apare public și nu plătești comision. Îl publici aici: https://contractez.ro`,
};

/** Linkul scurt din mesaj (/fb/p|c/<grup>); redirecționează la înregistrare cu UTM-ul grupului. */
export function outreachLink(audience: OutreachAudience, groupId: string): string {
  const base = env.APP_URL.replace(/\/+$/, "");
  return `${base}/fb/${audience === "provider" ? "p" : "c"}/${encodeURIComponent(groupId)}`;
}

/** Șablonul original, cu linkul scurt în locul domeniului (fallback fără AI). */
export function templateMessage(audience: OutreachAudience, groupId: string): string {
  return OUTREACH_TEMPLATES[audience].replace(SITE_PLACEHOLDER, outreachLink(audience, groupId));
}

/** Faptele pe care mesajul are voie să le folosească (nimic în afara lor). */
const FACTS = [
  `clienții publică gratuit un proiect și primesc cel mult ${maxOffers} oferte de la prestatori compatibili`,
  "telefonul, emailul și adresa exactă ale clientului nu apar în anunț",
  `prestatorii își fac profil gratuit și au ${freeApplications} aplicări gratuite pe lună; primesc alerte pentru proiectele compatibile din categoria lor`,
  "nu se ia comision din lucrare, nici de la client, nici de la prestator; plata se face direct între ei",
  "firmele pot primi insigna „Firmă verificată ANAF”; recenziile apar doar după o colaborare confirmată",
];

/** Instrucțiunile de stil pentru AI (aceleași pentru ambele tipuri). */
export const MESSAGE_GUIDELINES = [
  "Scopul e o acțiune, nu o părere: prestatorul să-și facă profilul, clientul să-și publice proiectul. NU ceri feedback, păreri sau „să arunce o privire” și nu spui că platforma e nouă sau la început.",
  "Structura, în 3–4 propoziții scurte: (1) referire concretă la postarea/comentariul persoanei, cu serviciul sau categoria ei (ex: „Am văzut că faci montaj video pentru TikTok”); (2) beneficiul direct pentru ea, ales din faptele de mai jos și legat de ce face; (3) un singur îndemn clar, cu linkul la final.",
  "Pentru prestatori, beneficiul principal: fiecare proiect primește cel mult " + maxOffers + " oferte, deci concurează cu puțini, nu cu zeci de comentarii; profil gratuit, fără comision. Atenție: prestatorul NU primește oferte de la clienți; el primește alerte pentru proiecte și aplică cu o ofertă. Ofertele le primește clientul. Pentru clienți: publică gratuit, primește cel mult " + maxOffers + " oferte, compară și alege, fără să-și lase telefonul public.",
  "Scrii ca un om, nu ca o reclamă: prima propoziție nu începe cu „Am lansat” sau cu numele platformei, fără superlative, fără „revoluționar”, „oportunitate”, „ofertă limitată”, „garantat”, „click aici”.",
  "Între 250 și 450 de caractere, persoana a II-a singular, diacritice corecte (ș, ț). Cel mult un emoji. Fără liste, bife sau majuscule.",
  "Incluzi exact linkul primit, o singură dată, neschimbat, la finalul mesajului.",
  "Variază formularea de la un mesaj la altul (salut, ordinea, încheierea), ca mesajele să nu pară copiate.",
  "Nu promiți clienți, proiecte sau câștiguri, nu spui câți utilizatori sau proiecte sunt pe platformă și nu inventezi funcții. Faptele permise: " + FACTS.join("; ") + ".",
].join("\n- ");
