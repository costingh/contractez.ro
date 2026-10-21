// Șabloanele mesajelor de outreach (docs/OUTREACH.md). AI-ul le adaptează la postarea fiecărei persoane;
// fără AI se folosesc ca atare, cu linkul UTM al grupului.
import { env } from "../env";

export type OutreachAudience = "client" | "provider";

/** Domeniul public din șabloane, înlocuit cu linkul UTM. */
const SITE_PLACEHOLDER = "https://contractez.ro";

export const OUTREACH_TEMPLATES: Record<OutreachAudience, string> = {
  provider:
    "Salut! Am văzut că ești activ în grupul de freelancing și că oferi servicii. Am lansat recent https://contractez.ro, o platformă care conectează prestatorii de servicii cu persoane care au nevoie de ajutor pentru diverse proiecte. Momentan sunt în etapa de lansare și caut primii prestatori care vor să își promoveze serviciile și să ajungă la potențiali clienți. Mi-ar plăcea să arunci o privire și să îmi spui ce părere ai. Orice feedback m-ar ajuta enorm! 😁 Sper să te ajute în a găsi constant clienți/proiecte.",
  client:
    "Salut! 👋 Am văzut că ești activ în grupul de freelancing și că ești în căutarea unui prestator pentru un proiect și m-am gândit că ți-ar putea fi util. Am lansat recent https://contractez.ro, o platformă unde poți publica gratuit proiecte și poți primi oferte direct de la freelanceri și prestatori de servicii. ✅ 100% gratuit pentru cei care caută servicii ✅ Publici proiectul și prestatorii pot aplica direct ✅ Compari ofertele și alegi cu cine vrei să colaborezi ✅ Discuți direct cu prestatorii prin chat ✅ Fără comisioane din valoarea lucrării. Platforma este la început, așa că orice feedback m-ar ajuta mult. Dacă încă ești în căutarea cuiva, te invit să o încerci! 😁",
};

/** Linkul din mesaj, cu UTM per grup (campania = id-ul grupului de Facebook). */
export function outreachLink(audience: OutreachAudience, groupId: string): string {
  const base = env.APP_URL.replace(/\/+$/, "");
  const utm = new URLSearchParams({ utm_source: "facebook", utm_medium: "dm", utm_campaign: groupId });
  return audience === "provider"
    ? `${base}/inregistrare?rol=prestator&${utm}`
    : `${base}/proiecte/nou?${utm}`;
}

/** Șablonul original, cu linkul UTM în locul domeniului (fallback fără AI). */
export function templateMessage(audience: OutreachAudience, groupId: string): string {
  return OUTREACH_TEMPLATES[audience].replace(SITE_PLACEHOLDER, outreachLink(audience, groupId));
}

/** Instrucțiunile de stil pentru AI (aceleași pentru ambele tipuri). */
export const MESSAGE_GUIDELINES = [
  "Pornești de la șablonul de mai jos, dar îl rescrii pentru persoana respectivă.",
  "Prima frază face referire concretă la postarea/comentariul ei (ex: „Am văzut că cauți un social media manager pentru centrul educațional…”), fără să citezi lung și fără detalii sensibile.",
  "Maxim ~500 de caractere, ton cald și natural, la persoana a II-a singular, cu diacritice corecte (ș, ț).",
  "Spui sincer că platforma e nouă/la început și ceri părerea sau feedback-ul persoanei.",
  "Incluzi exact linkul primit, o singură dată, neschimbat.",
  "Cel mult un emoji. Fără liste cu bife, fără majuscule, fără „ofertă limitată”, „garantat”, „click aici” sau alte formule de spam.",
  "Variază formularea de la un mesaj la altul (salut, structură, încheiere), ca mesajele să nu pară copiate.",
  "Nu promiți clienți sau câștiguri, nu inventezi funcții.",
].join("\n- ");
