import { plans } from "@/config/site";
import { env } from "../env";
import * as t from "./templates";
import type { ComposedEmail, NotificationEmail } from "./templates";

/*
 * Registrul previzualizărilor din /admin/emailuri/previzualizare: fiecare șablon real, randat cu date de test
 * realiste. Pentru notificări folosim exact `renderNotificationEmail`, adică ce trimite `notify`.
 */

export type EmailPreview = {
  id: string;
  label: string;
  /** Cine îl primește și când. */
  when: string;
  render: () => ComposedEmail;
};

const url = (path: string) => `${env.APP_URL}${path}`;
const TOKEN = "q9V2kz3LmP8xR4tY7wB1nC6dF0gH5jKs";
const PROJECT_ID = "6f1c2e4a-9b3d-4c8e-a1f7-2d5b8e0c3a91";

/** Notificare: titlul și corpul sunt cele din aplicație (rezerve pentru titlu/preheader), linkul devine butonul. */
function notification(title: string, body: string | undefined, link: string | undefined, email: NotificationEmail) {
  return () => t.renderNotificationEmail({ title, body, link, email });
}

const proposalText =
  "Bună ziua! Am renovat peste 40 de băi în Cluj în ultimii 5 ani, inclusiv în blocuri vechi cu instalații de înlocuit. Pot veni săptămâna aceasta pentru măsurători și o ofertă detaliată pe materiale și manoperă. Lucrez cu factură (PFA) și ofer garanție 2 ani.";

export const emailPreviews: EmailPreview[] = [
  {
    id: "verify-email",
    label: "Confirmare email",
    when: "La înregistrare și la retrimiterea linkului de confirmare.",
    render: () => t.verifyEmailTemplate({ firstName: "Ioana", link: url(`/verifica-email?token=${TOKEN}`) }),
  },
  {
    id: "password-reset",
    label: "Resetare parolă",
    when: "Când cineva cere resetarea parolei din „Ai uitat parola?”.",
    render: () => t.passwordResetTemplate({ link: url(`/resetare-parola?token=${TOKEN}`) }),
  },
  {
    id: "message.new",
    label: "Mesaj nou în chat",
    when: "La un mesaj nou într-o conversație (cel mult un email la 15 minute per conversație).",
    render: notification(
      "Mesaj nou de la Andrei Popescu",
      "Bună! Am văzut pozele. Pot veni joi la 10 pentru măsurători?",
      "/mesaje/3b7d1c90-2a4e-4f61-9c55-0e8a7b2d4f13",
      t.messageNewTemplate({
        senderName: "Andrei Popescu",
        text: "Bună! Am văzut pozele, mulțumesc. Pot veni joi la 10 pentru măsurători, durează cam o oră.\nAveți deja faianța aleasă sau vă ajut eu cu câteva variante?",
      }),
    ),
  },
  {
    id: "application.new",
    label: "Ofertă nouă (client)",
    when: "Clientul primește o ofertă la proiectul lui.",
    render: notification(
      "Ofertă nouă pentru „Renovare baie completă, apartament 2 camere”",
      "Andrei Popescu a trimis o ofertă.",
      `/proiectele-mele/${PROJECT_ID}`,
      t.applicationNewTemplate({
        providerName: "Andrei Popescu",
        projectTitle: "Renovare baie completă, apartament 2 camere",
        message: proposalText,
        isAuto: false,
        used: 3,
        max: 5,
      }),
    ),
  },
  {
    id: "application.shortlisted",
    label: "Pe lista scurtă",
    when: "Clientul pune oferta prestatorului pe lista scurtă.",
    render: notification(
      "Ești pe lista scurtă pentru „Site de prezentare pentru cabinet stomatologic”",
      "Clientul ți-a selectat oferta pentru discuții.",
      "/aplicarile-mele",
      t.applicationShortlistedTemplate({ projectTitle: "Site de prezentare pentru cabinet stomatologic" }),
    ),
  },
  {
    id: "application.hired",
    label: "Ales pentru proiect",
    when: "Clientul alege prestatorul.",
    render: notification(
      "🎉 Ai fost ales pentru „Contabilitate lunară pentru SRL nou înființat”",
      "Confirmă colaborarea ca să puteți lăsa recenzii la final.",
      "/colaborari",
      t.applicationHiredTemplate({ projectTitle: "Contabilitate lunară pentru SRL nou înființat" }),
    ),
  },
  {
    id: "application.rejected",
    label: "Ofertă neselectată",
    when: "Clientul respinge oferta (cu sau fără motiv).",
    render: notification(
      "Oferta pentru „Montaj parchet 60 mp” nu a fost selectată",
      "Motiv: Am ales o ofertă cu termen mai scurt.",
      "/aplicarile-mele",
      t.applicationRejectedTemplate({ projectTitle: "Montaj parchet 60 mp", reason: "Am ales o ofertă cu un termen de execuție mai scurt. Mulțumesc pentru timp!" }),
    ),
  },
  {
    id: "application.refunded",
    label: "Aplicare restituită",
    when: "Un proiect la care prestatorul a aplicat este eliminat de moderatori.",
    render: notification(
      "Ți-am restituit o aplicare",
      "Proiectul a fost eliminat de moderatori: duplicat. Aplicarea nu se mai socotește în limita planului.",
      "/abonament",
      t.applicationRefundedTemplate({ reason: "Proiectul a fost eliminat de moderatori: duplicat." }),
    ),
  },
  {
    id: "match.new",
    label: "Proiect compatibil (instant)",
    when: "Prestator cu alerte instant: un proiect nou compatibil.",
    render: notification(
      "Proiect compatibil 92%: Renovare baie completă, apartament 2 camere",
      "Construcții › Renovări · Cluj-Napoca · 15.000 – 20.000 lei",
      `/proiecte/${PROJECT_ID}`,
      t.matchNewTemplate({
        projectTitle: "Renovare baie completă, apartament 2 camere",
        path: "Construcții › Renovări",
        where: "Cluj-Napoca",
        budget: "15.000 – 20.000 lei",
        score: 92,
        reasons: ["Lucrezi în Cluj-Napoca", "Ai competența „Renovări băi”", "Bugetul se potrivește cu tarifele tale"],
        description:
          "Baie de 4 mp într-un bloc din 1980: demontare faianță și obiecte sanitare, înlocuire țevi, hidroizolație, faianță și gresie noi, cabină de duș. Materialele le cumpărăm împreună. Am dori să începem în noiembrie.",
      }),
    ),
  },
  {
    id: "match.summary",
    label: "Proiecte deschise potrivite",
    when: "După completarea profilului: proiectele deschise care se potrivesc deja.",
    render: notification(
      "3 proiecte deschise se potrivesc cu profilul tău",
      "Site de prezentare pentru cabinet stomatologic · Magazin online pentru produse handmade",
      "/recomandari",
      t.matchSummaryTemplate({
        total: 3,
        projects: [
          { title: "Site de prezentare pentru cabinet stomatologic", href: url(`/proiecte/${PROJECT_ID}`), meta: "IT › Web design · compatibilitate 88%", budget: "4.000 – 6.000 lei" },
          { title: "Magazin online pentru produse handmade", href: url(`/proiecte/${PROJECT_ID}`), meta: "IT › Magazine online · compatibilitate 81%", budget: "Preț fix · 8.000 lei" },
          { title: "Mentenanță lunară WordPress", href: url(`/proiecte/${PROJECT_ID}`), meta: "IT › Mentenanță · compatibilitate 74%", budget: "Lunar · 600 lei" },
        ],
      }),
    ),
  },
  {
    id: "digest-daily",
    label: "Rezumat zilnic",
    when: "Prestatorii care au ales rezumatul zilnic (8:00).",
    render: () =>
      t.matchDigestTemplate({
        frequency: "daily",
        allHref: url("/recomandari"),
        matches: [
          {
            title: "Renovare baie completă, apartament 2 camere",
            href: url(`/proiecte/${PROJECT_ID}`),
            score: 92,
            budget: "15.000 – 20.000 lei",
            excerpt: "Baie de 4 mp într-un bloc din 1980: demontare faianță, înlocuire țevi, hidroizolație, faianță și gresie noi, cabină de duș…",
          },
          {
            title: "Montaj gresie și faianță în bucătărie",
            href: url(`/proiecte/${PROJECT_ID}`),
            score: 84,
            budget: "Preț fix · 3.500 lei",
            excerpt: "Bucătărie de 9 mp, gresie 60×60 deja cumpărată. Trebuie scoasă gresia veche și nivelată șapa.",
          },
          {
            title: "Zugrăveli interioare, casă P+1",
            href: url(`/proiecte/${PROJECT_ID}`),
            score: 71,
            budget: "De discutat",
            excerpt: "Aproximativ 320 mp de pereți, culori alese. Casa este nelocuită, se poate lucra oricând.",
          },
        ],
      }),
  },
  {
    id: "digest-weekly",
    label: "Rezumat săptămânal",
    when: "Prestatorii care au ales rezumatul săptămânal (luni, 8:00).",
    render: () =>
      t.matchDigestTemplate({
        frequency: "weekly",
        allHref: url("/recomandari"),
        matches: [
          {
            title: "Contabilitate lunară pentru SRL nou înființat",
            href: url(`/proiecte/${PROJECT_ID}`),
            score: 89,
            budget: "Lunar · 400 – 600 lei",
            excerpt: "SRL plătitor de TVA, aproximativ 30 de documente pe lună, fără angajați deocamdată.",
          },
          {
            title: "Bilanț anual și declarații pentru PFA",
            href: url(`/proiecte/${PROJECT_ID}`),
            score: 77,
            budget: "Preț fix · 900 lei",
            excerpt: "Declarația unică și evidența în partidă simplă pentru un PFA în IT.",
          },
        ],
      }),
  },
  {
    id: "project.approved",
    label: "Proiect publicat",
    when: "Un proiect trimis la verificare este aprobat de moderatori.",
    render: notification(
      "Proiectul „Renovare baie completă, apartament 2 camere” a fost publicat",
      undefined,
      `/proiectele-mele/${PROJECT_ID}`,
      t.projectApprovedTemplate({ projectTitle: "Renovare baie completă, apartament 2 camere" }),
    ),
  },
  {
    id: "project.no_applications",
    label: "Proiect fără oferte (48h)",
    when: "Proiect deschis de 48–72 de ore fără nicio ofertă.",
    render: notification(
      "Încă nicio ofertă pentru „Montaj parchet 60 mp”",
      "Câteva ajustări pot crește numărul de oferte.",
      `/proiectele-mele/${PROJECT_ID}`,
      t.projectNoApplicationsTemplate({
        projectTitle: "Montaj parchet 60 mp",
        tips: [
          "Adaugă un buget orientativ — proiectele cu buget primesc mai multe oferte.",
          "Dacă factura nu este obligatorie, schimb-o în „preferabil” ca să ajungi la mai mulți prestatori.",
          "Mărește raza acceptată pentru prestatori.",
        ],
      }),
    ),
  },
  {
    id: "autobid.proposed",
    label: "Auto Bid: confirmare",
    when: "Regulă Auto Bid în modul „revizuiesc”: aplicarea așteaptă confirmarea.",
    render: notification(
      "Auto Bid: confirmă aplicarea la „Site de prezentare pentru cabinet stomatologic” (88%)",
      "Mesajul este pregătit. Îl poți edita înainte de trimitere.",
      "/auto-bid?tab=propuneri",
      t.autobidProposedTemplate({
        projectTitle: "Site de prezentare pentru cabinet stomatologic",
        score: 88,
        message:
          "Bună ziua! Fac site-uri de prezentare pentru clinici medicale din 2019 (exemple în portofoliu). Pot livra în 3 săptămâni un site rapid, cu programări online și pagini pentru fiecare serviciu.",
      }),
    ),
  },
  {
    id: "autobid.applied",
    label: "Auto Bid: aplicare trimisă",
    when: "Regulă Auto Bid automată: aplicarea a fost trimisă.",
    render: notification(
      "Auto Bid a aplicat la „Mentenanță lunară WordPress”",
      "Compatibilitate 81%. Îți mai rămân 23 aplicări în perioada curentă.",
      "/aplicarile-mele",
      t.autobidAppliedTemplate({
        projectTitle: "Mentenanță lunară WordPress",
        score: 81,
        remaining: 23,
        message: "Bună ziua! Ofer mentenanță WordPress cu actualizări săptămânale, backup zilnic și monitorizare. Răspund în aceeași zi lucrătoare.",
      }),
    ),
  },
  {
    id: "collab.completed",
    label: "Colaborare finalizată",
    when: "Cealaltă parte marchează colaborarea ca finalizată.",
    render: notification(
      "Colaborare finalizată — lasă o recenzie",
      undefined,
      "/colaborari",
      t.collabCompletedTemplate({ projectTitle: "Renovare baie completă, apartament 2 camere" }),
    ),
  },
  {
    id: "plan.activated",
    label: "Abonament activ",
    when: "Plata unui abonament Pro/Business a fost confirmată.",
    render: notification(
      "Planul Pro este activ",
      "Ai 40 aplicări pe lună și Auto Bid.",
      "/abonament",
      t.planActivatedTemplate({ plan: plans.find((p) => p.id === "pro")! }),
    ),
  },
];
