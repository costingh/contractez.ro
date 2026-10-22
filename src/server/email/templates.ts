import { site, type Plan } from "@/config/site";
import { pluralRo, truncate } from "@/lib/text";
import { env } from "../env";
import { renderEmail, type EmailBlock, type EmailInput, type RenderedEmail } from "./layout";

/*
 * Toate șabloanele de email, într-un singur loc. Le folosesc atât trimiterile reale (auth, notificări,
 * joburi programate), cât și previzualizarea din /admin/emailuri/previzualizare, ca să nu poată diverge.
 *
 * Două feluri:
 *  - emailuri trimise direct (`queueEmail`): întorc `{ subject, preheader, html, text }`;
 *  - emailuri de notificare (`notify({ email })`): întorc un `NotificationEmail`; `notify` adaugă butonul
 *    către linkul notificării și le randează cu `renderNotificationEmail`.
 */

export type EmailKind = "messages" | "applications" | "matches" | "autobid" | "account" | "system";

export type NotificationEmail = {
  kind: EmailKind;
  subject: string;
  heading?: string;
  eyebrow?: string;
  preheader?: string;
  blocks: EmailBlock[];
  /** Textul butonului către linkul notificării. */
  cta?: string;
  footerNote?: string;
};

export type ComposedEmail = RenderedEmail & { subject: string; preheader?: string };

const SIGNATURE: EmailBlock = { type: "signature" };

/** De ce primește omul emailul, după tipul notificării (apare în footer). */
export function footerReason(kind: EmailKind) {
  switch (kind) {
    case "messages":
      return `Primești acest email pentru că ai activat notificările pe email pentru mesajele noi de pe ${site.name}.`;
    case "applications":
      return `Primești acest email pentru că ai activat notificările despre ofertele și proiectele tale de pe ${site.name}.`;
    case "matches":
      return `Primești acest email pentru că ai activat alertele pentru proiectele compatibile cu profilul tău de pe ${site.name}.`;
    case "autobid":
      return `Primești acest email pentru că ai reguli Auto Bid active pe ${site.name}.`;
    default:
      return `Primești acest email pentru că ai un cont pe ${site.name}.`;
  }
}

function compose(subject: string, input: EmailInput): ComposedEmail {
  return { subject, preheader: input.preheader, ...renderEmail(input) };
}

/** Randează un email de notificare exact cum îl trimite `notify` (titlul/corpul notificării sunt rezerve). */
export function renderNotificationEmail(input: { title: string; body?: string; link?: string; email: NotificationEmail }): ComposedEmail {
  const { email } = input;
  const blocks = [...email.blocks];
  if (input.link) blocks.push({ type: "button", text: email.cta ?? "Vezi detalii", href: absoluteUrl(input.link) });
  return compose(email.subject, {
    eyebrow: email.eyebrow,
    heading: email.heading ?? input.title,
    preheader: email.preheader ?? input.body,
    blocks,
    footerNote: email.footerNote ?? footerReason(email.kind),
  });
}

export function absoluteUrl(path: string) {
  return path.startsWith("http") ? path : `${env.APP_URL}${path}`;
}

const pct = (n: number) => `${n}%`;
const quoted = (s: string) => `„${s}”`;

/* ------------------------------ Cont și securitate ------------------------------ */

export function verifyEmailTemplate(d: { firstName: string; link: string }) {
  return compose(`Confirmă adresa de email · ${env.APP_NAME}`, {
    eyebrow: "Bun venit",
    heading: `Bun venit, ${d.firstName}!`,
    preheader: "Un singur clic și contul tău este activ.",
    blocks: [
      { type: "p", text: `Mulțumim că te-ai alăturat ${site.name}. Confirmă adresa de email ca să poți publica proiecte și aplica la oportunități.` },
      { type: "button", text: "Confirmă adresa de email", href: d.link },
      { type: "muted", text: "Linkul este valabil 48 de ore." },
      { type: "link", href: d.link },
      { type: "divider" },
      { type: "muted", text: "Nu ți-ai creat tu un cont? Ignoră acest email: fără confirmare, contul nu se activează." },
      SIGNATURE,
    ],
    footerNote: `Primești acest email pentru că s-a creat un cont ${site.name} cu această adresă.`,
  });
}

export function passwordResetTemplate(d: { link: string }) {
  return compose(`Resetează-ți parola · ${env.APP_NAME}`, {
    eyebrow: "Securitatea contului",
    heading: "Setează o parolă nouă",
    preheader: "Linkul de resetare este valabil o oră.",
    blocks: [
      { type: "p", text: `Am primit o cerere de resetare a parolei pentru contul tău ${site.name}. Apasă butonul de mai jos ca să alegi o parolă nouă.` },
      { type: "button", text: "Setează o parolă nouă", href: d.link },
      {
        type: "callout",
        tone: "warning",
        title: "Nu ai cerut tu resetarea?",
        text: "Dacă nu ai cerut tu resetarea, ignoră acest email: parola ta rămâne neschimbată. Linkul expiră automat într-o oră.",
      },
      { type: "link", href: d.link },
      SIGNATURE,
    ],
    footerNote: `Primești acest email pentru că s-a cerut resetarea parolei pentru contul tău ${site.name}.`,
  });
}

/** Trimis la adresa NOUĂ: confirmă că omul o deține, apoi contul trece pe ea. */
export function emailChangeConfirmTemplate(d: { firstName: string; newEmail: string; link: string }) {
  return compose(`Confirmă noua adresă de email · ${env.APP_NAME}`, {
    eyebrow: "Securitatea contului",
    heading: "Confirmă noua adresă de email",
    preheader: "Un clic și contul tău folosește această adresă.",
    blocks: [
      { type: "p", text: `Salut, ${d.firstName}! Ai cerut ca, de acum, contul tău ${site.name} să folosească adresa ${d.newEmail}. Confirm-o cu butonul de mai jos.` },
      { type: "button", text: "Confirmă noua adresă", href: d.link },
      { type: "muted", text: "Linkul este valabil 24 de ore. Până la confirmare, contul folosește în continuare adresa veche." },
      { type: "link", href: d.link },
      { type: "divider" },
      { type: "muted", text: "Nu ai cerut tu schimbarea? Ignoră acest email: fără confirmare, nu se schimbă nimic." },
      SIGNATURE,
    ],
    footerNote: `Primești acest email pentru că s-a cerut folosirea acestei adrese pentru un cont ${site.name}.`,
  });
}

/** Trimis la adresa VECHE: la cererea schimbării (`requested`) și după confirmare (`changed`). */
export function emailChangeNoticeTemplate(d: { firstName: string; newEmail: string; stage: "requested" | "changed" }) {
  const changed = d.stage === "changed";
  return compose(changed ? `Adresa contului tău a fost schimbată · ${env.APP_NAME}` : `S-a cerut schimbarea adresei de email · ${env.APP_NAME}`, {
    eyebrow: "Securitatea contului",
    heading: changed ? "Adresa contului tău a fost schimbată" : "S-a cerut schimbarea adresei de email",
    preheader: changed ? `De acum te autentifici cu ${d.newEmail}.` : `Contul tău trece pe ${d.newEmail} după confirmare.`,
    blocks: [
      {
        type: "p",
        text: changed
          ? `Salut, ${d.firstName}! Contul tău ${site.name} folosește de acum adresa ${d.newEmail}. Emailurile și autentificarea merg la noua adresă; pe aceasta nu vei mai primi mesaje de la noi.`
          : `Salut, ${d.firstName}! Cineva conectat la contul tău ${site.name} a cerut mutarea lui pe adresa ${d.newEmail}. Schimbarea se face doar după ce linkul trimis la noua adresă este confirmat.`,
      },
      {
        type: "callout",
        tone: "warning",
        title: changed ? "Nu ai făcut tu schimbarea?" : "Nu ai cerut tu?",
        text: changed
          ? `Scrie-ne imediat la ${site.supportEmail}, de pe această adresă, ca să recuperăm contul.`
          : `Schimbă-ți parola acum (din „Ai uitat parola?”) și scrie-ne la ${site.supportEmail}. Cât timp linkul nu e confirmat, contul rămâne pe această adresă.`,
      },
      changed
        ? { type: "button", text: "Contactează-ne", href: absoluteUrl("/contact") }
        : { type: "button", text: "Schimbă parola", href: absoluteUrl("/parola-uitata") },
      SIGNATURE,
    ],
    footerNote: `Primești acest email pentru că este adresa contului tău ${site.name}${changed ? " până acum" : ""}.`,
  });
}

/* --------------------------------- Recomandări --------------------------------- */

export type DigestMatch = { title: string; href: string; score: number; budget: string; excerpt: string };

export function matchDigestTemplate(d: { frequency: "daily" | "weekly"; matches: DigestMatch[]; allHref: string }) {
  const n = d.matches.length;
  const best = Math.max(...d.matches.map((m) => m.score));
  const avg = Math.round(d.matches.reduce((s, m) => s + m.score, 0) / Math.max(1, n));
  const daily = d.frequency === "daily";
  return compose(n === 1 ? "Un proiect nou potrivit pentru tine" : `${pluralRo(n, "proiect", "proiecte")} noi potrivite pentru tine`, {
    eyebrow: daily ? "Rezumatul zilei" : "Rezumatul săptămânii",
    heading: daily ? "Recomandările zilei" : "Recomandările săptămânii",
    preheader: `${n === 1 ? "Un proiect compatibil" : `${pluralRo(n, "proiect", "proiecte")} compatibile`} cu profilul tău, până la ${best}% potrivire.`,
    blocks: [
      {
        type: "p",
        text:
          n === 1
            ? `Am găsit un proiect nou compatibil cu profilul tău ${daily ? "în ultima zi" : "în ultima săptămână"}.`
            : `Am găsit ${pluralRo(n, "proiect", "proiecte")} noi compatibile cu profilul tău ${daily ? "în ultima zi" : "în ultima săptămână"}. Cele mai potrivite sunt primele.`,
      },
      {
        type: "stats",
        items: [
          { value: String(n), label: n === 1 ? "proiect nou" : "proiecte noi" },
          { value: pct(best), label: "potrivire maximă" },
          ...(n > 1 ? [{ value: pct(avg), label: "potrivire medie" }] : []),
        ],
      },
      ...d.matches.map((m): EmailBlock => ({ type: "card", title: m.title, href: m.href, meta: `Compatibilitate ${m.score}%`, lines: [m.budget, m.excerpt] })),
      { type: "button", text: "Vezi toate recomandările", href: d.allHref },
    ],
    footerNote: `Primești acest rezumat ${daily ? "zilnic" : "săptămânal"} pentru că l-ai ales în preferințele de notificare.`,
  });
}

export function matchNewTemplate(d: { projectTitle: string; path: string; where: string; budget: string; score: number; reasons: string[]; description: string }): NotificationEmail {
  return {
    kind: "matches",
    subject: `Proiect nou compatibil: ${d.projectTitle}`,
    eyebrow: `Compatibilitate ${d.score}%`,
    heading: "Am găsit un proiect potrivit pentru tine",
    preheader: `${d.path} · ${d.where} · ${d.budget}`,
    cta: "Vezi proiectul și aplică",
    blocks: [
      { type: "card", meta: `${d.path} · ${d.where}`, title: d.projectTitle, lines: [`Buget: ${d.budget}`, `Compatibilitate: ${d.score}%`] },
      ...(d.reasons.length ? [{ type: "p" as const, text: "De ce ți se potrivește:" }, { type: "list" as const, style: "check" as const, items: d.reasons }] : []),
      { type: "quote", author: "Din descrierea clientului", text: d.description },
    ],
  };
}

export function matchSummaryTemplate(d: { total: number; projects: { title: string; href: string; meta: string; budget: string }[] }): NotificationEmail {
  return {
    kind: "matches",
    subject: d.total === 1 ? "Un proiect deschis potrivit pentru tine" : `${pluralRo(d.total, "proiect", "proiecte")} deschise potrivite pentru tine`,
    eyebrow: "Recomandări",
    heading: "Proiecte la care poți aplica chiar acum",
    preheader: d.projects
      .map((p) => p.title)
      .slice(0, 2)
      .join(" · "),
    cta: "Vezi toate recomandările",
    blocks: [
      {
        type: "p",
        text:
          d.total === 1
            ? "Un proiect deschis se potrivește cu profilul tău. Clientul încă primește oferte."
            : `${pluralRo(d.total, "proiect", "proiecte")} deschise se potrivesc cu profilul tău. Iată-le pe cele mai potrivite:`,
      },
      ...d.projects.map((p): EmailBlock => ({ type: "card", meta: p.meta, title: p.title, href: p.href, lines: [p.budget] })),
    ],
  };
}

/* ----------------------------------- Proiecte ----------------------------------- */

export function projectApprovedTemplate(d: { projectTitle: string }): NotificationEmail {
  return {
    kind: "system",
    subject: "Proiectul tău a fost publicat",
    eyebrow: "Proiect publicat",
    heading: "Proiectul tău este live",
    preheader: "Prestatorii compatibili primesc acum notificări.",
    cta: "Vezi proiectul",
    blocks: [
      { type: "callout", tone: "success", title: quoted(d.projectTitle), text: "Am verificat proiectul și l-am publicat. Prestatorii compatibili primesc acum notificări." },
      { type: "p", text: "Te anunțăm când primești oferte. Le poți compara în pagina proiectului și poți discuta în chat cu prestatorii, înainte să alegi." },
    ],
  };
}

export function projectNoApplicationsTemplate(d: { projectTitle: string; tips: string[] }): NotificationEmail {
  return {
    kind: "applications",
    subject: "Cum poți primi mai multe oferte",
    eyebrow: "Sfaturi pentru proiect",
    heading: "Hai să-ți aducem primele oferte",
    preheader: "Câteva ajustări simple pot crește numărul de oferte.",
    cta: "Editează proiectul",
    blocks: [
      { type: "p", text: `Proiectul ${quoted(d.projectTitle)} nu a primit încă oferte. Câteva ajustări îl pot face mai atractiv pentru prestatori:` },
      { type: "list", items: d.tips },
    ],
  };
}

export function projectReportedAdminTemplate(d: { projectTitle: string; reporters: number; reasons: string[] }): NotificationEmail {
  return {
    kind: "system",
    subject: `Proiect blocat după raportări: ${d.projectTitle}`,
    eyebrow: "Moderare",
    heading: "Un proiect așteaptă verificarea ta",
    preheader: `${pluralRo(d.reporters, "utilizator a raportat", "utilizatori au raportat")} proiectul ${quoted(d.projectTitle)}.`,
    cta: "Deschide coada de moderare",
    blocks: [
      {
        type: "callout",
        tone: "warning",
        title: quoted(d.projectTitle),
        text: `${pluralRo(d.reporters, "utilizator verificat a raportat", "utilizatori verificați au raportat")} proiectul, așa că l-am ascuns și l-am pus în verificare.`,
      },
      ...(d.reasons.length ? [{ type: "p" as const, text: "Motivele raportărilor:" }, { type: "list" as const, items: d.reasons }] : []),
      { type: "p", text: "Clientul nu îl poate retrimite la publicare. Aprobă-l dacă raportările nu se confirmă sau elimină-l (aplicările prestatorilor se restituie automat)." },
    ],
  };
}

/* ----------------------------------- Oferte ----------------------------------- */

export function applicationNewTemplate(d: { providerName: string; projectTitle: string; message: string; isAuto: boolean; used: number; max: number }): NotificationEmail {
  return {
    kind: "applications",
    subject: `Ai primit o ofertă nouă: ${d.projectTitle}`,
    eyebrow: d.isAuto ? "Ofertă nouă · automată" : "Ofertă nouă",
    heading: `${d.providerName} a aplicat la proiectul tău`,
    preheader: `${d.providerName} a trimis o ofertă pentru ${quoted(d.projectTitle)}.`,
    cta: "Vezi oferta",
    blocks: [
      { type: "p", text: `Ai o ofertă nouă pentru ${quoted(d.projectTitle)}. Iată începutul mesajului:` },
      { type: "quote", author: d.providerName, text: d.message },
      { type: "muted", text: `${d.used} din ${d.max} locuri de aplicare ocupate.` },
    ],
  };
}

export function applicationShortlistedTemplate(d: { projectTitle: string }): NotificationEmail {
  return {
    kind: "applications",
    subject: `Ești pe lista scurtă: ${d.projectTitle}`,
    eyebrow: "Veste bună",
    heading: "Ești pe lista scurtă",
    preheader: "Clientul ți-a selectat oferta pentru discuții.",
    cta: "Vezi aplicarea",
    blocks: [
      { type: "callout", tone: "success", text: `Clientul ți-a selectat oferta pentru ${quoted(d.projectTitle)}.` },
      { type: "p", text: "Răspunde rapid în chat pentru a crește șansele: clarifică detaliile, termenul și prețul." },
    ],
  };
}

export function applicationRejectedTemplate(d: { projectTitle: string; reason?: string }): NotificationEmail {
  return {
    kind: "applications",
    subject: `Actualizare pentru oferta ta: ${d.projectTitle}`,
    eyebrow: "Actualizare ofertă",
    heading: "Clientul a mers mai departe",
    preheader: d.reason ? `Motiv: ${d.reason}` : `Oferta pentru ${quoted(d.projectTitle)} nu a fost selectată.`,
    cta: "Vezi aplicările mele",
    blocks: [
      { type: "p", text: `Clientul a ales să nu continue cu oferta ta pentru ${quoted(d.projectTitle)}.` },
      ...(d.reason ? [{ type: "quote" as const, author: "Motivul clientului", text: d.reason }] : []),
      { type: "p", text: "Nu te descuraja: îți trimitem în continuare proiecte noi compatibile cu profilul tău." },
    ],
  };
}

export function applicationHiredTemplate(d: { projectTitle: string }): NotificationEmail {
  return {
    kind: "applications",
    subject: `Ai fost ales: ${d.projectTitle}`,
    eyebrow: "Felicitări",
    heading: "Clientul te-a ales",
    preheader: "Confirmă colaborarea ca să puteți lăsa recenzii la final.",
    cta: "Confirmă colaborarea",
    blocks: [
      { type: "callout", tone: "success", text: `Ai fost ales pentru ${quoted(d.projectTitle)}.` },
      { type: "p", text: "Confirmă colaborarea pe platformă și stabiliți detaliile în chat. La final, vă puteți lăsa recenzii verificate unul altuia." },
    ],
  };
}

export function applicationRefundedTemplate(d: { reason: string }): NotificationEmail {
  return {
    kind: "system",
    subject: "Ți-am restituit o aplicare",
    eyebrow: "Abonament",
    heading: "Ți-am restituit o aplicare",
    preheader: "Aplicarea nu se mai socotește în limita lunară a planului tău.",
    cta: "Vezi abonamentul",
    blocks: [
      { type: "callout", tone: "info", text: "Aplicarea nu se mai socotește în limita lunară a planului tău. O poți folosi pentru alt proiect." },
      { type: "p", text: `Motiv: ${d.reason}` },
    ],
  };
}

/* ----------------------------------- Auto Bid ----------------------------------- */

export function autobidProposedTemplate(d: { projectTitle: string; score: number; message: string }): NotificationEmail {
  return {
    kind: "autobid",
    subject: `Auto Bid: proiect compatibil ${d.score}% — confirmi aplicarea?`,
    eyebrow: "Auto Bid · așteaptă confirmarea ta",
    heading: "Confirmi aplicarea?",
    preheader: "Mesajul este pregătit. Îl poți edita înainte de trimitere.",
    cta: "Revizuiește și trimite",
    blocks: [
      { type: "card", title: d.projectTitle, lines: [`Compatibilitate ${d.score}%`] },
      { type: "p", text: "Am pregătit mesajul după regulile tale. Îl poți edita înainte de trimitere:" },
      { type: "quote", author: "Mesajul pregătit", text: d.message },
    ],
  };
}

export function autobidAppliedTemplate(d: { projectTitle: string; score: number; remaining: number; message: string }): NotificationEmail {
  return {
    kind: "autobid",
    subject: `Auto Bid: aplicare trimisă — ${d.projectTitle}`,
    eyebrow: "Auto Bid",
    heading: "Am trimis aplicarea pentru tine",
    preheader: `Compatibilitate ${d.score}%. Îți mai rămân ${pluralRo(d.remaining, "aplicare", "aplicări")} în perioada curentă.`,
    cta: "Vezi aplicările mele",
    blocks: [
      { type: "p", text: `Auto Bid a aplicat la ${quoted(d.projectTitle)}, după regulile tale.` },
      {
        type: "stats",
        items: [
          { value: pct(d.score), label: "compatibilitate" },
          { value: String(d.remaining), label: "aplicări rămase" },
        ],
      },
      { type: "quote", author: "Mesajul trimis", text: d.message },
    ],
  };
}

/* ------------------------------- Colaborări și plan ------------------------------- */

export function collabCompletedTemplate(d: { projectTitle?: string }): NotificationEmail {
  return {
    kind: "system",
    subject: "Cum a fost colaborarea?",
    eyebrow: "Colaborare finalizată",
    heading: "Cum a fost colaborarea?",
    preheader: "Spune-ne în două minute: recenziile verificate ajută comunitatea.",
    cta: "Lasă o recenzie",
    blocks: [
      { type: "p", text: d.projectTitle ? `Colaborarea pentru ${quoted(d.projectTitle)} a fost marcată ca finalizată.` : "Colaborarea a fost marcată ca finalizată." },
      { type: "p", text: "Recenziile verificate ajută comunitatea să aleagă mai ușor. Durează două minute." },
    ],
  };
}

export function collabCancelledTemplate(d: { projectTitle: string; byClient: boolean; projectReopened: boolean }): NotificationEmail {
  const who = d.byClient ? "Clientul" : "Prestatorul";
  return {
    kind: "system",
    subject: `Colaborare anulată: ${d.projectTitle}`,
    eyebrow: "Colaborare anulată",
    heading: `${who} a anulat colaborarea`,
    preheader: `Colaborarea pentru ${quoted(d.projectTitle)} a fost anulată.`,
    cta: d.byClient ? "Vezi aplicările mele" : "Vezi proiectul",
    blocks: [
      { type: "callout", tone: "info", text: `${who} a anulat colaborarea pentru ${quoted(d.projectTitle)}.` },
      {
        type: "p",
        text: d.byClient
          ? "Îți trimitem în continuare proiecte noi compatibile cu profilul tău. Dacă vreți să clarificați ce s-a întâmplat, conversația rămâne disponibilă."
          : d.projectReopened
            ? "Proiectul este din nou deschis: poți alege altă ofertă sau poți primi oferte noi."
            : "Proiectul a expirat între timp, așa că l-am închis. Dacă încă ai nevoie de un prestator, publică un proiect nou.",
      },
    ],
  };
}

export function planActivatedTemplate(d: { plan: Pick<Plan, "name" | "monthlyApplications" | "autoBid" | "features"> }): NotificationEmail {
  const p = d.plan;
  return {
    kind: "system",
    subject: `Planul ${p.name} este activ`,
    eyebrow: "Abonament activ",
    heading: `Bun venit în ${p.name}!`,
    preheader: `Ai ${pluralRo(p.monthlyApplications, "aplicare", "aplicări")} pe lună${p.autoBid ? " și Auto Bid" : ""}.`,
    cta: "Vezi abonamentul",
    blocks: [
      { type: "p", text: `Mulțumim! Ai acum ${pluralRo(p.monthlyApplications, "aplicare", "aplicări")} pe lună${p.autoBid ? ", Auto Bid" : ""} și toate avantajele planului ${p.name}.` },
      {
        type: "stats",
        items: [
          { value: String(p.monthlyApplications), label: "aplicări pe lună" },
          { value: p.autoBid ? "Inclus" : "—", label: "Auto Bid" },
        ],
      },
      { type: "list", style: "check", items: p.features },
    ],
  };
}

/* ----------------------------------- Mesaje ----------------------------------- */

export function messageNewTemplate(d: { senderName: string; text: string }): NotificationEmail {
  return {
    kind: "messages",
    subject: `Mesaj nou de la ${d.senderName}`,
    eyebrow: "Mesaj nou",
    heading: `${d.senderName} ți-a scris`,
    preheader: truncate(d.text, 120),
    cta: "Răspunde",
    blocks: [
      { type: "quote", author: d.senderName, text: d.text },
      { type: "muted", text: "Răspunde din conversație: așa păstrezi toate detaliile într-un singur loc." },
    ],
  };
}
