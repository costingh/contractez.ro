import { ArrowRight, BadgeCheck, Bell, Bot, CheckCircle2, Eye, FileCheck2, Gauge, QrCode, Search, Sparkles, Star, UserPlus, Wallet, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Faq } from "@/components/marketing/faq";
import { cssVars } from "@/components/home/css-vars";
import { Button } from "@/components/ui/button";
import { freePlan, plans, rules, site } from "@/config/site";
import { pageTitle } from "@/lib/seo";
import { getCatalog } from "@/server/catalog/taxonomy";
import { env } from "@/server/env";

/*
 * Pagina de destinație pentru prestatori și freelanceri (reclame, outreach, SEO pe „cum găsesc clienți ca
 * freelancer / meseriaș”, „platformă freelancing România”). Tot ce promite aici trebuie să existe în produs:
 * limitele vin din `rules` și `plans`, iar beneficiile sunt cele implementate (distribuția cu locuri pentru
 * profiluri noi, aplicări returnate, card QR, verificare ANAF).
 */

const title = "Găsește clienți noi ca prestator sau freelancer, fără comision";
const description = `Creează gratuit profilul de prestator pe ${site.name}: primești alerte pentru proiecte potrivite, aplici cu oferta ta și păstrezi tot câștigul. ${freePlan.monthlyApplications} aplicări gratuite pe lună.`;
const signup = "/inregistrare?rol=prestator";

export const metadata: Metadata = {
  title: pageTitle(title),
  description,
  alternates: { canonical: "/pentru-prestatori" },
  openGraph: { title, description, url: "/pentru-prestatori" },
};

const steps = [
  { icon: UserPlus, t: "Îți faci profilul gratuit", d: "Servicii, tarif orientativ, zona în care lucrezi (sau doar online), portofoliu și linkuri. Durează câteva minute." },
  { icon: Bell, t: "Primești proiecte potrivite", d: "Alertă imediat ce un client publică ceva pe domeniul tău, cu scorul de compatibilitate explicat." },
  { icon: Wallet, t: "Aplici cu oferta ta", d: "Vezi înainte ce am verificat despre client. Poți porni de la o propunere scrisă cu AI și o personalizezi." },
  { icon: CheckCircle2, t: "Clientul alege, voi stabiliți restul", d: "Prețul, termenele și plata le stabiliți direct. Contactul complet apare după ce colaborarea e confirmată." },
];

/** Comparația cu alternativele obișnuite (generic, fără nume de concurenți). */
const compare: { row: string; us: string; payPerLead: string; groups: string }[] = [
  { row: "Cât plătești ca să ajungi la client", us: "0 lei pe planul Gratuit", payPerLead: "Plătești pe fiecare contact sau răspuns", groups: "Gratuit, dar pierzi ore citind postări" },
  { row: "Comision din lucrare", us: "Niciodată", payPerLead: "Depinde de platformă", groups: "Nu" },
  { row: "Câți concurează pe un proiect", us: `Maximum ${rules.defaultMaxApplications} oferte`, payPerLead: "Variabil", groups: "Zeci de comentarii în câteva minute" },
  { row: "Află când apare un proiect", us: "Alertă imediată, doar pe domeniul tău", payPerLead: "Notificări", groups: "Doar dacă prinzi postarea la timp" },
  { row: "Proiect fals sau client care nu citește", us: "Aplicarea îți este returnată", payPerLead: "De obicei banii sunt pierduți", groups: "Timp pierdut" },
  { row: "Recenzii care rămân ale tale", us: "Da, verificate, pe profilul public", payPerLead: "Da", groups: "Nu" },
];

const perks = [
  { icon: Gauge, t: "Șanse reale la fiecare proiect", d: `Un proiect primește cel mult ${rules.defaultMaxApplications} oferte, așa că oferta ta e citită, nu îngropată sub alte 40.` },
  { icon: Sparkles, t: "Loc rezervat pentru profilurile noi", d: `${Math.round(rules.newcomerShare * 100)}% dintre alertele pentru fiecare proiect merg la prestatori noi, ca să nu concurezi din prima zi doar cu veteranii.` },
  { icon: Eye, t: "Știi ce se întâmplă cu oferta", d: "Livrată, citită, pe lista scurtă, aleasă sau respinsă. Fără oferte trimise în gol." },
  { icon: FileCheck2, t: "Aplicări returnate", d: `Dacă proiectul se dovedește fals sau clientul nu îți deschide oferta în ${rules.unseenRefundDays} zile, aplicarea nu se socotește în limită.` },
  { icon: QrCode, t: "Profil public și card cu cod QR", d: "Profilul apare în Google și îl poți trimite clienților tăi. Cardul cu QR îl pui pe mașină, pe flyere sau în semnătura de email." },
  { icon: BadgeCheck, t: "Insigne de încredere", d: "Firma confirmată în registrul ANAF, recenzii doar după colaborări confirmate de ambele părți." },
  { icon: Bot, t: "Auto Bid, dacă vrei", d: `Pe Pro și Business, platforma aplică în locul tău după regulile tale. Primele ${rules.autoBidDelayMinutes} de minute sunt rezervate aplicărilor manuale.` },
  { icon: Star, t: "Fără contract, fără perioadă minimă", d: "Începi gratuit și rămâi gratuit cât vrei. Abonamentele se anulează oricând, din cont." },
];

const faq: { q: string; a: string }[] = [
  {
    q: "Cât costă să fiu prestator pe Contractez?",
    a: `Nimic, pe planul Gratuit: profil public, alerte și ${freePlan.monthlyApplications} aplicări pe lună. Dacă ai nevoie de mai multe aplicări, există Pro (${plans[1].priceLei} lei/lună, ${plans[1].monthlyApplications} aplicări) și Business (${plans[2].priceLei} lei/lună, ${plans[2].monthlyApplications} aplicări), cu TVA inclus, fără perioadă minimă.`,
  },
  { q: "Luați comision din lucrare?", a: "Nu. Nu intermediem plata lucrării: prețul și modul de plată le stabilești direct cu clientul, iar tot câștigul rămâne al tău." },
  {
    q: "Cum găsesc clienți ca freelancer sau meseriaș începător?",
    a: `Pe Contractez, clienții publică ce au nevoie, iar tu primești alertă doar pentru proiectele compatibile cu serviciile și zona ta. ${Math.round(rules.newcomerShare * 100)}% din alerte sunt rezervate profilurilor noi, iar fiecare proiect are cel mult ${rules.defaultMaxApplications} oferte, deci ai o șansă reală chiar fără recenzii. Un profil complet (portofoliu, tarif, zonă) contează cel mai mult.`,
  },
  {
    q: "Trebuie să am firmă sau PFA?",
    a: "Platforma nu cere o anumită formă juridică. Dacă emiți factură, o menționezi în profil, iar clienții care au nevoie de factură te pot filtra după asta. Obligațiile fiscale pentru veniturile tale rămân în responsabilitatea ta.",
  },
  {
    q: "Pot lucra doar online, din alt oraș decât clientul?",
    a: "Da. Pentru servicii care se fac la distanță (web, design, marketing, traduceri, contabilitate) poți primi proiecte din toată țara. Pentru lucrări la fața locului setezi orașul și raza în care te deplasezi.",
  },
  {
    q: "Ce se întâmplă dacă clientul nu răspunde?",
    a: `Vezi mereu statusul ofertei. Dacă clientul nu o deschide în ${rules.unseenRefundDays} zile, aplicarea îți este returnată și nu se mai socotește în limita lunară.`,
  },
  {
    q: "Cine vede numărul meu de telefon?",
    a: "Doar clienții cu care ai confirmat o colaborare. Până atunci discutați prin chatul platformei, iar telefoanele și emailurile scrise în mesaje sau anunțuri sunt ascunse automat.",
  },
];

export default async function ForProvidersPage() {
  const catalog = await getCatalog();
  const roots = catalog.tree.filter((r) => r.children.length > 0);
  const base = env.APP_URL;
  const url = `${base}/pentru-prestatori`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name: title,
        description,
        inLanguage: "ro-RO",
        isPartOf: { "@id": `${base}/#website` },
        audience: { "@type": "BusinessAudience", audienceType: "Prestatori de servicii și freelanceri din România" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Acasă", item: `${base}/` },
          { "@type": "ListItem", position: 2, name: "Pentru prestatori", item: url },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };

  return (
    <div className="pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <section className="px-2 pt-2 sm:px-3 sm:pt-3">
        <div className="ink-panel rounded-[1.75rem] sm:rounded-[2.25rem]">
          <div aria-hidden className="aurora aurora-a -top-48 -left-24 size-[600px]" />
          <div aria-hidden className="aurora aurora-b -right-32 -bottom-56 size-[520px] opacity-40" />
          <div className="container-page py-16 sm:py-24">
            <div className="enter text-xs font-medium tracking-[0.08em] text-white/50 uppercase" style={cssVars({ i: 0 })}>
              Pentru prestatori și freelanceri
            </div>
            <h1 className="enter display-lg mt-5 max-w-3xl text-white" style={cssVars({ i: 1 })}>
              Clienți noi, <span className="serif-em text-gradient-ink">fără comision</span> și fără să plătești pe fiecare contact.
            </h1>
            <p className="enter mt-6 max-w-2xl text-[1.0625rem] leading-relaxed text-white/65" style={cssVars({ i: 2 })}>
              Clienții publică gratuit ce au nevoie. Tu primești alertă doar pentru proiectele potrivite și concurezi cu{" "}
              <mark className="hl-ink enter-hl bg-transparent" style={cssVars({ i: 0 })}>
                cel mult {rules.defaultMaxApplications} oferte
              </mark>
              , nu cu zeci de comentarii. Profilul e gratuit, cu{" "}
              <mark className="hl-ink enter-hl bg-transparent" style={cssVars({ i: 1 })}>
                {freePlan.monthlyApplications} aplicări pe lună
              </mark>
              .
            </p>
            <div className="enter mt-9 flex flex-wrap gap-3" style={cssVars({ i: 3 })}>
              <Link
                href={signup}
                data-vt-goal="provider_landing_signup_hero"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-[#0b1426] transition-colors hover:bg-[#eef1fc]"
              >
                Creează profilul gratuit <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/proiecte"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-5 text-sm font-medium text-white transition-colors hover:bg-white/[0.1]"
              >
                <Search className="size-4" /> Vezi proiectele deschise
              </Link>
            </div>
            <ul className="enter mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70" style={cssVars({ i: 4 })}>
              {["0% comision din lucrări", "Fără card la înscriere", "Anulezi oricând"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#9fb5ff]" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="container-page">
        {/* Pașii */}
        <section className="mt-20 grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="reveal">
            <div className="eyebrow">Cum funcționează</div>
            <h2 className="display-md mt-3">
              Proiectele <span className="serif-em text-gradient">vin la tine</span>.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              Nu mai cauți prin grupuri și nu plătești ca să afli un număr de telefon. Îți setezi o dată profilul, apoi alegi la ce aplici.
            </p>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2">
            {steps.map((s, i) => (
              <li key={s.t} className="reveal rounded-2xl border bg-card p-6 shadow-xs" style={cssVars({ i })}>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <s.icon className="size-5" strokeWidth={1.75} />
                  </span>
                  <span className="text-xs font-medium text-muted-foreground tabular-nums">Pasul {i + 1}</span>
                </div>
                <h3 className="mt-4 font-semibold tracking-[-0.015em]">{s.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Comparația */}
        <section className="mt-24">
          <div className="reveal max-w-2xl">
            <div className="eyebrow">De ce Contractez</div>
            <h2 className="display-md mt-3">
              Comparat cu ce folosești <span className="hl">acum</span>.
            </h2>
          </div>
          <div className="reveal mt-8 overflow-x-auto rounded-[1.25rem] border bg-card shadow-xs">
            <table className="w-full min-w-[640px] text-left text-sm">
              <caption className="sr-only">Contractez comparat cu platformele cu plată per contact și cu grupurile de Facebook</caption>
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th scope="col" className="w-[28%] px-5 py-4 font-medium" />
                  <th scope="col" className="bg-brand-soft/60 px-5 py-4 font-semibold text-foreground dark:bg-brand-soft/20">
                    {site.name}
                  </th>
                  <th scope="col" className="px-5 py-4 font-medium">Platforme cu plată per contact</th>
                  <th scope="col" className="px-5 py-4 font-medium">Grupuri de Facebook</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {compare.map((r) => (
                  <tr key={r.row}>
                    <th scope="row" className="px-5 py-3.5 font-medium">
                      {r.row}
                    </th>
                    <td className="bg-brand-soft/60 px-5 py-3.5 font-medium text-foreground dark:bg-brand-soft/20">
                      <span className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> {r.us}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{r.payPerLead}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      <span className="flex items-start gap-2">
                        <X className="mt-0.5 size-4 shrink-0 opacity-50" /> {r.groups}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Beneficii */}
        <section className="mt-24">
          <div className="reveal max-w-2xl">
            <div className="eyebrow">Ce primești</div>
            <h2 className="display-md mt-3">
              Gândit pentru cei care <span className="serif-em text-gradient">lucrează</span>, nu pentru cei care vând leaduri.
            </h2>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {perks.map((p, n) => (
              <div key={p.t} className="reveal lift rounded-2xl border bg-card p-6 shadow-xs" style={cssVars({ i: n % 4 })}>
                <span className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <p.icon className="size-[1.125rem]" strokeWidth={1.9} />
                </span>
                <h3 className="mt-4 font-semibold tracking-[-0.01em]">{p.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pentru început: onest despre stadiul platformei */}
        <section className="reveal mt-24 grid gap-8 overflow-hidden rounded-[1.75rem] border bg-card p-7 shadow-xs sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="eyebrow">Lansat în {site.launched.label}</div>
            <h2 className="display-md mt-3">
              Platformă nouă. <span className="serif-em text-gradient">Avantajul</span> e al primilor.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Suntem la început, așa că nu îți promitem zeci de proiecte pe săptămână. Îți promitem reguli corecte: puțini prestatori pe fiecare
              proiect, locuri rezervate profilurilor noi și zero comision. Cine își face acum profilul complet strânge primele recenzii înaintea
              celorlalți.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
            <Button asChild size="lg" className="h-12 rounded-xl px-6">
              <Link href={signup} data-vt-goal="provider_landing_signup_mid">
                Creează profilul gratuit <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-6">
              <Link href="/cum-functioneaza">Vezi regulile platformei</Link>
            </Button>
          </div>
        </section>

        {/* Planuri pe scurt */}
        <section className="mt-24">
          <div className="reveal flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <div className="eyebrow">Prețuri</div>
              <h2 className="display-md mt-3">Începi gratuit. Plătești doar dacă vrei mai mult.</h2>
            </div>
            <Link href="/preturi" className="text-sm font-medium text-brand underline-offset-4 hover:underline">
              Toate detaliile planurilor →
            </Link>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {plans.map((p, n) => (
              <div
                key={p.id}
                className={`reveal flex flex-col rounded-2xl border p-6 shadow-xs ${p.highlight ? "border-brand/40 bg-brand-soft/40 dark:bg-brand-soft/10" : "bg-card"}`}
                style={cssVars({ i: n })}
              >
                <div className="font-semibold">{p.name}</div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-3xl font-semibold tracking-[-0.03em] tabular-nums">{p.priceLei}</span>
                  <span className="text-sm text-muted-foreground">lei / lună</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{p.tagline}</p>
                <ul className="mt-4 space-y-1.5 text-sm">
                  {p.features.slice(0, 3).map((f) => (
                    <li key={f} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Categorii: linkuri interne către domeniile în care se publică proiecte */}
        <section className="mt-24">
          <div className="reveal max-w-2xl">
            <div className="eyebrow">Domenii</div>
            <h2 className="display-md mt-3">Pentru orice serviciu, de la renovări la IT.</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Alegi una sau mai multe categorii în profil și primești doar proiectele din ele.
            </p>
          </div>
          <ul className="reveal mt-8 flex flex-wrap gap-2">
            {roots.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/categorii/${r.slug}`}
                  className="inline-flex items-center rounded-full border bg-card px-4 py-2 text-sm transition-colors hover:border-border-strong hover:bg-muted"
                >
                  {r.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-24 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="reveal">
            <div className="eyebrow">Întrebări frecvente</div>
            <h2 className="display-md mt-3">Ce întreabă prestatorii înainte să intre.</h2>
            <p className="mt-4 text-sm text-muted-foreground">
              Altă întrebare?{" "}
              <Link href="/contact" className="font-medium text-brand underline-offset-4 hover:underline">
                Scrie-ne
              </Link>
              .
            </p>
          </div>
          <Faq items={faq} />
        </section>

        {/* Îndemnul final */}
        <section className="reveal mt-24 rounded-[1.75rem] bg-primary px-7 py-12 text-center text-primary-foreground sm:px-10 sm:py-16">
          <h2 className="display-md mx-auto max-w-2xl">Următorul tău client ar putea publica azi.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed opacity-75">
            Profil gratuit, {freePlan.monthlyApplications} aplicări pe lună, fără comision și fără card.
          </p>
          <Link
            href={signup}
            data-vt-goal="provider_landing_signup_footer"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-background px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Creează profilul gratuit <ArrowRight className="size-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
