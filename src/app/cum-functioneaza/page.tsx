import { ArrowDown, ArrowRight, Bell, Bot, CheckCircle2, FileText, MessageSquare, Search, ShieldCheck, Star, UserPlus, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Faq } from "@/components/marketing/faq";
import { cssVars } from "@/components/home/css-vars";
import { Button } from "@/components/ui/button";
import { freePlan, rules, site } from "@/config/site";

export const metadata: Metadata = {
  alternates: { canonical: "/cum-functioneaza" },
  title: "Cum funcționează",
  description: `Cum găsești un prestator sau următorul proiect pe ${site.name}: publicare gratuită, matching inteligent, maximum ${rules.defaultMaxApplications} oferte per proiect.`,
};

/** Ponderile scorului de compatibilitate (aceleași ca în răspunsul din FAQ și în src/server/matching/score.ts). */
const scoreParts = [
  { k: "Categorie", v: 30, c: "bg-primary" },
  { k: "Competențe", v: 25, c: "bg-brand" },
  { k: "Buget", v: 15, c: "bg-[#5b7cff]" },
  { k: "Distanță", v: 10, c: "bg-[#38bdf8]" },
  { k: "Reputație", v: 10, c: "bg-success" },
  { k: "Disponibilitate", v: 10, c: "bg-border-strong" },
];

function Steps({ steps, tone }: { steps: { icon: typeof Search; t: string; d: string }[]; tone: "ink" | "plain" }) {
  return (
    <ol className="relative">
      {steps.map((s, i) => (
        <li key={s.t} className="reveal relative flex gap-4 pb-8 last:pb-0" style={cssVars({ i })}>
          {i < steps.length - 1 && (
            <span aria-hidden className="absolute top-12 bottom-1 left-[1.4375rem] w-px bg-gradient-to-b from-border-strong to-transparent" />
          )}
          <div
            className={
              tone === "ink"
                ? "relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md"
                : "relative flex size-12 shrink-0 items-center justify-center rounded-2xl border bg-card text-foreground shadow-sm"
            }
          >
            <s.icon className="size-5" strokeWidth={1.75} />
          </div>
          <div className="pt-1">
            <div className="text-xs font-medium text-muted-foreground tabular-nums">Pasul {i + 1}</div>
            <div className="mt-0.5 text-[1.0625rem] font-semibold tracking-[-0.015em]">{s.t}</div>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="pb-16">
      <section className="px-2 pt-2 sm:px-3 sm:pt-3">
        <div className="ink-panel rounded-[1.75rem] sm:rounded-[2.25rem]">
          <div aria-hidden className="aurora aurora-a -top-48 -left-24 size-[600px]" />
          <div aria-hidden className="aurora aurora-b -right-32 -bottom-56 size-[520px] opacity-40" />
          <div className="container-page py-16 sm:py-24">
            <div className="enter text-xs font-medium tracking-[0.08em] text-white/50 uppercase" style={cssVars({ i: 0 })}>
              Cum funcționează
            </div>
            <h1 className="enter display-lg mt-5 max-w-3xl text-white" style={cssVars({ i: 1 })}>
              Mai puțină căutare. Mai multă <span className="serif-em text-gradient-ink">încredere</span>.
            </h1>
            <p className="enter mt-6 max-w-2xl text-[1.0625rem] leading-relaxed text-white/65" style={cssVars({ i: 2 })}>
              Un marketplace pentru orice tip de serviciu, în care AI-ul elimină munca inutilă: clientul primește{" "}
              <mark className="hl-ink enter-hl bg-transparent" style={cssVars({ i: 0 })}>
                maximum {rules.defaultMaxApplications} oferte potrivite
              </mark>
              , prestatorul primește{" "}
              <mark className="hl-ink enter-hl bg-transparent" style={cssVars({ i: 1 })}>
                doar proiecte compatibile
              </mark>
              .
            </p>
            <div className="enter mt-9 flex flex-wrap gap-3" style={cssVars({ i: 3 })}>
              <a
                href="#clienti"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#0b1426] transition-colors hover:bg-[#eef1fc]"
              >
                Am nevoie de un serviciu <ArrowDown className="size-4" />
              </a>
              <a
                href="#prestatori"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-4 text-sm font-medium text-white transition-colors hover:bg-white/[0.1]"
              >
                Ofer servicii <ArrowDown className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page">
      <div className="mt-16 grid gap-6 lg:grid-cols-2">
        <section id="clienti" className="flex scroll-mt-20 flex-col gap-8 rounded-[1.75rem] border bg-card p-7 shadow-xs sm:p-10">
          <div className="reveal">
            <div className="flex items-center gap-2">
              <span className="eyebrow">Pentru clienți</span>
              <span className="rounded-md bg-success/10 px-2 py-0.5 text-xs font-medium text-success">Gratuit</span>
            </div>
            <h2 className="display-md mt-3">
              Publici o dată. <span className="serif-em text-gradient">Alegi</span> în liniște.
            </h2>
          </div>
          <Steps
            tone="ink"
            steps={[
              { icon: FileText, t: "Descrii ce ai nevoie", d: "Scrii liber sau lipești o postare. AI-ul o structurează: categorie, buget, localitate, termen, factură. Te întreabă doar ce lipsește." },
              { icon: ShieldCheck, t: "Confirmi emailul și publici", d: "Publicarea este gratuită. Datele tale de contact nu apar în anunț; adresa exactă nu este publică, doar localitatea." },
              { icon: Bell, t: "Prestatorii compatibili sunt anunțați", d: "Doar cei care oferă serviciul, acoperă zona, se încadrează în buget și (dacă ceri) emit factură." },
              { icon: MessageSquare, t: `Primești până la ${rules.defaultMaxApplications} oferte`, d: "Compari tarife, ratinguri verificate și portofolii. Discuți în chat. Poți redeschide selecția dacă vrei mai multe oferte." },
              { icon: Star, t: "Alegi și lași o recenzie", d: "După colaborare, recenzia ta ajută comunitatea. Poți alege ca numele tău să nu apară public." },
            ]}
          />
          <Button asChild size="lg" className="mt-auto h-12 self-start rounded-xl px-5">
            <Link href="/proiecte/nou">
              Publică un proiect gratuit <ArrowRight />
            </Link>
          </Button>
        </section>

        <section id="prestatori" className="flex scroll-mt-20 flex-col gap-8 rounded-[1.75rem] border bg-card p-7 shadow-xs sm:p-10">
          <div className="reveal">
            <div className="flex items-center gap-2">
              <span className="eyebrow">Pentru prestatori</span>
              <span className="rounded-md bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">Gratuit, Pro sau Business</span>
            </div>
            <h2 className="display-md mt-3">
              Proiectele <span className="serif-em text-gradient">vin la tine</span>.
            </h2>
          </div>
          <Steps
            tone="plain"
            steps={[
              { icon: UserPlus, t: "Îți creezi profilul gratuit", d: `Servicii, tarif, localitate și raza în care te deplasezi, dacă emiți factură. Începi pe planul Gratuit, cu ${freePlan.monthlyApplications} aplicări pe lună.` },
              { icon: Search, t: "Primești proiecte potrivite", d: "Alerte instant sau rezumat zilnic, cu scor de compatibilitate explicat: categorie, competențe, buget, distanță, reputație." },
              { icon: Wallet, t: "Aplici la proiectele care te interesează", d: "Vezi înainte ce am verificat despre client. Poți genera o propunere cu AI și o personalizezi." },
              { icon: CheckCircle2, t: "Știi ce se întâmplă cu oferta", d: "Livrată, citită, pe lista scurtă, aleasă sau respinsă. Fără oferte trimise în gol." },
              { icon: Bot, t: "Opțional: Auto Bid", d: "Platforma aplică pentru tine, strict după regulile și mesajul aprobat de tine. Poți opri oricând." },
            ]}
          />
          <Button asChild size="lg" variant="outline" className="mt-auto h-12 self-start rounded-xl px-5">
            <Link href="/inregistrare?rol=prestator">Creează profil de prestator</Link>
          </Button>
        </section>
      </div>

      {/* Scorul de compatibilitate, explicat vizual */}
      <section className="mt-6 grid gap-8 rounded-[1.75rem] border bg-card p-7 shadow-xs sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="reveal">
          <div className="eyebrow">Scor de compatibilitate</div>
          <h2 className="display-md mt-3">
            Calculat <span className="hl">transparent</span>, nu inventat de AI.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Fiecare potrivire are un scor din 100, calculat după aceeași formulă pentru toată lumea. Vezi mereu motivele, iar promovarea plătită nu îl
            schimbă niciodată.
          </p>
        </div>
        <div className="reveal" style={cssVars({ i: 1 })}>
          <div className="flex h-4 overflow-hidden rounded-full" role="img" aria-label="Ponderile scorului de compatibilitate">
            {scoreParts.map((p) => (
              <span key={p.k} className={`${p.c} border-r-2 border-card last:border-r-0`} style={{ width: `${p.v}%` }} />
            ))}
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {scoreParts.map((p) => (
              <div key={p.k} className="rounded-xl border bg-surface px-4 py-3 dark:bg-muted/40">
                <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={`size-2 rounded-full ${p.c}`} /> {p.k}
                </dt>
                <dd className="mt-1 text-xl font-semibold tracking-[-0.02em] tabular-nums">
                  {p.v} <span className="text-xs font-normal text-muted-foreground">puncte</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mt-24 space-y-10">
        <div className="reveal max-w-2xl">
          <div className="eyebrow">Încredere</div>
          <h2 className="display-lg mt-4">
            Regulile care <span className="serif-em text-gradient">protejează</span> pe toată lumea.
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Client neverificat", "Nu primește aplicări plătite până nu își confirmă emailul."],
            ["Proiect duplicat sau suspect", "Este oprit și verificat de un moderator înainte de publicare."],
            ["Proiect fraudulos confirmat", "Este eliminat, iar aplicările prestatorilor nu se mai socotesc în limita planului."],
            ["Aplicare dublă", "Este refuzată și nu se socotește în limita planului."],
            ["Aplicări automate", `Maximum ${rules.defaultMaxAutoApplications} din ${rules.defaultMaxApplications} locuri, marcate vizibil. Clientul le poate dezactiva.`],
            ["Recenzii", "Doar după o colaborare confirmată de ambele părți. Fără recenzii cumpărate."],
            ["Promovare", "Etichetată „Promovat”. Nu modifică scorul de compatibilitate."],
            ["Date personale", "Telefoanele și emailurile din anunțuri sunt ascunse automat; contactul se face prin chat."],
            ["Fără filtre discriminatorii", "Nu poți căuta după atribute personale (vârstă, etnie, religie etc.)."],
          ].map(([t, d], n) => (
            <div key={t} className="reveal lift rounded-2xl border bg-card p-6 shadow-xs" style={cssVars({ i: n % 3 })}>
              <div className="flex items-center gap-2.5 font-semibold tracking-[-0.01em]">
                <span className="flex size-7 items-center justify-center rounded-lg bg-success/10 text-success">
                  <ShieldCheck className="size-4" strokeWidth={1.9} />
                </span>
                {t}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-24 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="reveal">
          <div className="eyebrow">Întrebări frecvente</div>
          <h2 className="display-md mt-3">Răspunsuri clare, fără litere mici.</h2>
        </div>
        <Faq
          items={[
            { q: "Cum se calculează scorul de compatibilitate?", a: "Printr-o formulă transparentă: potrivirea categoriei (max 30 puncte), competențele (25), bugetul (15), distanța (10), reputația (10) și disponibilitatea (10). AI-ul ajută doar la înțelegerea cererii, nu inventează procente." },
            { q: "Platforma intermediază plata lucrării?", a: "Nu. Clientul și prestatorul stabilesc direct prețul, termenele și plata. Prestatorii plătesc doar un abonament opțional (Pro sau Business) dacă au nevoie de mai multe aplicări." },
            { q: "Pot fi și client, și prestator?", a: "Da. Un cont poate avea ambele roluri; le activezi din onboarding sau din meniul contului." },
            { q: "De ce maximum 5 oferte?", a: "Ca fiecare ofertă să fie citită și ca prestatorii să aibă șanse reale. Clientul poate redeschide selecția dacă are nevoie de mai multe variante." },
            { q: "Ce verificați despre un client?", a: "Emailul este obligatoriu; telefonul verificat apare ca insignă. Nu verificăm identitatea sau existența fondurilor, iar acest lucru este afișat transparent pe fiecare proiect." },
            {
              q: "Cum raportez o problemă?",
              a: (
                <>
                  Folosește butonul „Raportează” de pe proiect, profil sau din chat, ori scrie-ne din pagina de{" "}
                  <Link href="/contact" className="font-medium text-brand underline-offset-4 hover:underline">contact</Link>.
                </>
              ),
            },
          ]}
        />
      </section>
      </div>
    </div>
  );
}
