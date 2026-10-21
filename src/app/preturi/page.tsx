import { ArrowRight, Bot, Check, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Faq } from "@/components/marketing/faq";
import { PlanCards } from "@/components/billing/plan-cards";
import { cssVars } from "@/components/home/css-vars";
import { Button } from "@/components/ui/button";
import { freePlan, plans, rules } from "@/config/site";
import { features } from "@/server/env";

// Afișăm starea plăților din configurația de runtime, nu din momentul build-ului.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/preturi" },
  title: "Prețuri",
  description: "Publicarea proiectelor este gratuită. Prestatorii încep gratuit și aleg un abonament doar dacă au nevoie de mai multe aplicări.",
};

const providerPerks = [
  "Fără comision din lucrările tale",
  "Anulezi oricând, fără perioadă minimă",
  "Aplicarea nu se socotește dacă proiectul e fals sau duplicat",
  "Vezi când oferta e citită, pusă pe lista scurtă sau respinsă",
];

const clientPerks = [
  "Publicare gratuită, cu ajutor AI pentru brief",
  `Până la ${rules.defaultMaxApplications} oferte relevante per proiect`,
  "Chat cu prestatorii, comparare oferte cu AI",
  "Căutare prestatori cu filtre (factură, zonă, tarif)",
  "Recenzii verificate după colaborare",
];

export default function PricingPage() {
  return (
    <div className="pb-16">
      {/* Banda ink: titlul și mesajul principal; cardurile planurilor urcă peste marginea ei */}
      <section className="px-2 pt-2 sm:px-3 sm:pt-3">
        <div className="ink-panel rounded-[1.75rem] sm:rounded-[2.25rem]">
          <div aria-hidden className="aurora aurora-a -top-48 left-[-10%] size-[620px]" />
          <div aria-hidden className="aurora aurora-c right-[-10%] -bottom-48 size-[520px] opacity-40" />
          <div className="container-page pt-14 pb-40 text-center sm:pt-20 sm:pb-48">
            <div className="enter text-xs font-medium tracking-[0.08em] text-white/50 uppercase" style={cssVars({ i: 0 })}>
              Prețuri
            </div>
            <h1 className="enter display-lg mx-auto mt-5 max-w-3xl text-white" style={cssVars({ i: 1 })}>
              Gratuit pentru clienți. <span className="serif-em text-gradient-ink">Corect</span> pentru prestatori.
            </h1>
            <p className="enter mx-auto mt-6 max-w-2xl text-[1.0625rem] leading-relaxed text-white/65" style={cssVars({ i: 2 })}>
              Începi pe{" "}
              <mark className="hl-ink enter-hl bg-transparent" style={cssVars({ i: 0 })}>
                Gratuit, cu {freePlan.monthlyApplications} aplicări pe lună
              </mark>
              . Treci la Pro sau Business doar când ai nevoie de mai mult.{" "}
              <mark className="hl-ink enter-hl bg-transparent" style={cssVars({ i: 1 })}>
                Zero comision
              </mark>{" "}
              din lucrări, anulezi oricând.
            </p>
            {!features.payments && (
              <div
                className="enter mx-auto mt-8 inline-flex max-w-xl items-start gap-2.5 rounded-xl border border-white/12 bg-white/[0.06] px-4 py-2.5 text-left text-sm leading-relaxed text-white/75 backdrop-blur"
                style={cssVars({ i: 3 })}
              >
                <Info className="mt-0.5 size-4 shrink-0 text-[#9fb5ff]" />
                <span>
                  <strong className="font-semibold text-white">Suntem în beta.</strong> Plățile se activează la lansarea publică. Până atunci folosești
                  planul Gratuit sau un plan oferit de echipă.
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="container-page">
        <section id="planuri" className="relative -mt-28 scroll-mt-20 sm:-mt-32">
          <PlanCards
            actions={Object.fromEntries(
              plans.map((p) => [
                p.id,
                <Button key={p.id} asChild size="lg" className="h-12 w-full rounded-xl" variant={p.highlight ? "default" : "outline"}>
                  <Link href={p.id === "free" ? "/inregistrare?rol=prestator" : "/abonament"}>
                    {p.id === "free" ? "Începe gratuit" : `Alege ${p.name}`} <ArrowRight />
                  </Link>
                </Button>,
              ]),
            )}
          />
          <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-relaxed text-muted-foreground">
            Prețuri finale, cu TVA inclus, plătite lunar. Limita include aplicările manuale și pe cele automate; aplicările nefolosite nu se reportează.
            Promovarea este etichetată clar, nu modifică scorul de compatibilitate și nu garantează contractarea.
          </p>
        </section>

        <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {providerPerks.map((f, n) => (
            <li key={f} className="reveal flex gap-3 rounded-2xl border bg-card p-4 text-sm leading-snug shadow-xs" style={cssVars({ i: n })}>
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                <Check className="size-3.5" strokeWidth={2.75} />
              </span>
              {f}
            </li>
          ))}
        </ul>

        {/* Clienți */}
        <section className="reveal mt-20 grid gap-10 overflow-hidden rounded-[1.75rem] border bg-card p-7 shadow-xs sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <div className="eyebrow">Pentru clienți</div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="display-xl tabular-nums">0</span>
              <span className="text-lg text-muted-foreground">lei, mereu</span>
            </div>
            <p className="mt-4 max-w-md text-[1.0625rem] leading-relaxed text-muted-foreground">
              Oricâte proiecte, oricâte oferte primite. <span className="hl">Fără card, fără abonament</span>, fără costuri ascunse.
            </p>
            <Button asChild size="lg" className="mt-8 h-12 rounded-xl px-6">
              <Link href="/proiecte/nou">
                Publică un proiect <ArrowRight />
              </Link>
            </Button>
          </div>
          <ul className="grid gap-2.5">
            {clientPerks.map((f, n) => (
              <li key={f} className="reveal flex items-center gap-3 rounded-xl border bg-surface px-4 py-3 text-sm dark:bg-muted/40" style={cssVars({ i: n })}>
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3.5" strokeWidth={2.75} />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </section>

        {/* Auto Bid */}
        <section className="mt-6 grid gap-8 rounded-[1.75rem] border bg-card p-7 shadow-xs sm:p-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div className="reveal space-y-4">
            <div className="flex items-center gap-2">
              <Bot className="size-5 text-brand" />
              <span className="eyebrow">Pro și Business</span>
            </div>
            <h2 className="display-md">
              Auto Bid aplică <span className="serif-em text-gradient">în locul tău</span>.
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Setezi regulile (domenii, buget, zonă, scor minim, limită zilnică) și un mesaj aprobat de tine. Platforma aplică în locul tău, după o
              fereastră de {rules.autoBidDelayMinutes} de minute rezervată aplicărilor manuale. Maximum {rules.defaultMaxAutoApplications} din{" "}
              {rules.defaultMaxApplications} locuri pot fi ocupate automat, iar aplicările sunt marcate vizibil pentru client.
            </p>
          </div>
          <dl className="grid gap-3 sm:grid-cols-3">
            {[
              { v: `${rules.autoBidDelayMinutes} min`, l: "rezervate întâi aplicărilor manuale" },
              { v: `${rules.defaultMaxAutoApplications} din ${rules.defaultMaxApplications}`, l: "locuri pot fi ocupate automat" },
              { v: "Vizibil", l: "aplicările automate sunt marcate pentru client" },
            ].map((x, n) => (
              <div key={x.l} className="reveal flex flex-col-reverse rounded-2xl border bg-surface p-5 dark:bg-muted/40" style={cssVars({ i: n })}>
                <dt className="mt-2 text-xs leading-relaxed text-muted-foreground">{x.l}</dt>
                <dd className="text-[1.75rem] leading-none font-semibold tracking-[-0.03em] tabular-nums">{x.v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-20 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="reveal">
            <div className="eyebrow">Întrebări frecvente</div>
            <h2 className="display-md mt-3">Tot ce trebuie să știi, fără litere mici.</h2>
            <p className="mt-4 text-sm text-muted-foreground">
              Altă întrebare?{" "}
              <Link href="/contact" className="font-medium text-brand underline-offset-4 hover:underline">
                Scrie-ne
              </Link>
              .
            </p>
          </div>
          <Faq
          items={[
            {
              q: "Ce se întâmplă când ating limita lunară?",
              a: "Nu mai poți trimite aplicări noi până la reînnoire (începutul lunii pentru Gratuit, data de facturare pentru Pro și Business). Poți trece oricând la un plan superior, iar limita nouă se aplică imediat.",
            },
            {
              q: "Când nu se socotește o aplicare?",
              a: `Dacă proiectul este eliminat ca fraudulos, fals sau duplicat, aplicările tuturor celor care au aplicat nu se mai socotesc în limită. La fel, dacă clientul nu deschide oferta ta în ${rules.unseenRefundDays} zile, aplicarea îți este returnată.`,
            },
            { q: "Pot anula abonamentul?", a: "Da, oricând, din pagina Abonament. Planul rămâne activ până la finalul perioadei plătite, apoi treci automat pe Gratuit." },
            { q: "Platforma ia comision din lucrare?", a: "Nu. Nu intermediem plata lucrării: clientul și prestatorul stabilesc direct prețul și modul de plată." },
            { q: "Primesc factură?", a: "Da. Fiecare plată vine automat cu chitanță și factură pe email, emise de Link (Stripe), vânzătorul abonamentelor." },
            { q: "Cât costă pentru clienți?", a: "Nimic. Publicarea, ofertele, chat-ul și compararea ofertelor sunt gratuite pentru clienți." },
          ]}
          />
        </section>
      </div>
    </div>
  );
}
