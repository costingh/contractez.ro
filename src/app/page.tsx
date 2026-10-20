import {
  ArrowRight,
  Bot,
  Briefcase,
  Building,
  Camera,
  Car,
  Code,
  GraduationCap,
  HardHat,
  Home as HomeIcon,
  Languages,
  Megaphone,
  Palette,
  PartyPopper,
  PawPrint,
  Scale,
  Send,
  Shapes,
  Sparkles,
  Truck,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bento } from "@/components/home/bento";
import { cssVars } from "@/components/home/css-vars";
import { Hero } from "@/components/home/hero";
import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import { freePlan, paidPlans, rules, site } from "@/config/site";
import { getCurrentUser } from "@/server/auth/session";
import { getCatalog } from "@/server/catalog/taxonomy";
import { featuredReviews, publicStats } from "@/server/insights";
import { latestOpenProjects } from "@/server/search/projects";

const ICONS: Record<string, LucideIcon> = {
  code: Code,
  palette: Palette,
  megaphone: Megaphone,
  languages: Languages,
  camera: Camera,
  "hard-hat": HardHat,
  wrench: Wrench,
  home: HomeIcon,
  truck: Truck,
  car: Car,
  "party-popper": PartyPopper,
  "graduation-cap": GraduationCap,
  briefcase: Briefcase,
  scale: Scale,
  sparkles: Sparkles,
  building: Building,
  "paw-print": PawPrint,
  shapes: Shapes,
};

const steps = {
  client: [
    { t: "Descrie ce ai nevoie", d: "Scrie liber sau lipește o postare. AI-ul o transformă într-un brief clar și te întreabă doar ce lipsește.", i: Sparkles },
    { t: `Primești maximum ${rules.defaultMaxApplications} oferte`, d: "Doar prestatorii compatibili (domeniu, zonă, buget, factură) sunt anunțați. Fără spam, fără apeluri.", i: Send },
    { t: "Compari, discuți, alegi", d: "Ratinguri din colaborări reale, portofolii, timp de răspuns. AI-ul te ajută să compari ofertele.", i: Users },
  ],
  provider: [
    { t: "Creează profilul gratuit", d: `Servicii, tarif, zonă de deplasare, factură. Începi cu ${freePlan.monthlyApplications} aplicări gratuite în fiecare lună.`, i: Sparkles },
    { t: "Primești doar proiecte potrivite", d: "Alerte cu scor de compatibilitate explicat. Vezi exact ce am verificat despre fiecare client.", i: Send },
    { t: "Aplici, sau lași Auto Bid să aplice", d: "Chat gratuit după aplicare. Vezi când oferta e citită și când ajungi pe lista scurtă.", i: Bot },
  ],
};

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user?.onboardedAt) redirect("/panou");
  const [catalog, latest, stats, reviews] = await Promise.all([getCatalog(), latestOpenProjects(4), publicStats(), featuredReviews(3)]);
  const lowestPaid = Math.min(...paidPlans.map((p) => p.priceLei));

  return (
    <div>
      <Hero openProjects={stats?.open_projects ?? 0} />

      {/* Categorii în bandă continuă */}
      <section aria-label="Domenii de servicii" className="border-b py-7">
        <div className="marquee-mask overflow-hidden">
          <div className="marquee gap-3">
            {[0, 1].map((copy) => (
              <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0 gap-3 pr-3">
                {catalog.tree.map((c) => {
                  const Icon = ICONS[c.icon ?? ""] ?? Shapes;
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/categorii/${c.slug}`}
                        tabIndex={copy === 1 ? -1 : undefined}
                        className="flex items-center gap-2.5 rounded-full border bg-card py-2 pr-4 pl-2.5 text-sm font-medium whitespace-nowrap shadow-xs transition-colors hover:border-border-strong hover:bg-muted"
                      >
                        <span className="flex size-7 items-center justify-center rounded-full bg-muted">
                          <Icon className="size-3.5" strokeWidth={1.9} />
                        </span>
                        {c.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ))}
          </div>
        </div>
      </section>

      <Bento reviews={reviews} />

      {/* Cifre */}
      <section className="border-y bg-surface dark:bg-card/30">
        <dl className="container-page grid grid-cols-2 gap-y-10 py-14 sm:py-16 lg:grid-cols-4">
          {[
            { v: stats?.open_projects ?? 0, l: "proiecte deschise acum" },
            { v: stats?.providers ?? 0, l: "prestatori cu profil complet" },
            { v: stats?.collaborations ?? 0, l: "colaborări confirmate" },
            { v: catalog.tree.length, l: "domenii de servicii" },
          ].map((s, n) => (
            <div key={s.l} className="reveal border-l pl-5 sm:pl-6" style={cssVars({ i: n })}>
              <dd className="display-lg tabular-nums">
                <span className="count-up" style={cssVars({ to: s.v })} />
                <span className="sr-only">{s.v}</span>
              </dd>
              <dt className="mt-2 text-sm text-muted-foreground">{s.l}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* Cum funcționează: tab-uri doar din CSS (radio + :has) */}
      <section className="hiw container-page py-20 sm:py-28 [&:has(#hiw-provider:checked)_.hiw-client]:hidden [&:has(#hiw-provider:checked)_.hiw-provider]:grid">
        <div className="reveal flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="eyebrow">Cum funcționează</div>
            <h2 className="display-lg mt-4">
              Trei pași. <span className="serif-em text-gradient">Zero</span> bătăi de cap.
            </h2>
          </div>
          <fieldset className="seg inline-flex rounded-xl border bg-card p-1 shadow-xs">
            <legend className="sr-only">Arată pașii pentru</legend>
            {[
              { id: "hiw-client", label: "Am nevoie de un serviciu" },
              { id: "hiw-provider", label: "Ofer servicii" },
            ].map((o, n) => (
              <label
                key={o.id}
                className="cursor-pointer rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors has-checked:bg-primary has-checked:text-primary-foreground hover:text-foreground has-checked:hover:text-primary-foreground"
              >
                <input type="radio" name="hiw" id={o.id} defaultChecked={n === 0} className="sr-only" />
                {o.label}
              </label>
            ))}
          </fieldset>
        </div>

        {(["client", "provider"] as const).map((k) => (
          <ol key={k} className={`hiw-${k} mt-12 gap-4 md:grid-cols-3 ${k === "client" ? "grid" : "hidden"}`}>
            {steps[k].map((s, n) => (
              <li key={s.t} className="reveal lift relative overflow-hidden rounded-2xl border bg-card p-6 shadow-xs sm:p-7" style={cssVars({ i: n })}>
                <span aria-hidden className="pointer-events-none absolute -top-6 -right-2 text-[7.5rem] leading-none font-semibold tracking-[-0.06em] text-foreground/[0.045] tabular-nums">
                  0{n + 1}
                </span>
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <s.i className="size-[1.125rem]" strokeWidth={1.9} />
                </span>
                <div className="mt-6 text-xs font-medium text-muted-foreground tabular-nums">Pasul {n + 1}</div>
                <h3 className="mt-1 text-lg leading-snug font-semibold tracking-[-0.015em]">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              </li>
            ))}
          </ol>
        ))}
      </section>

      {/* Proiecte live */}
      {latest.length > 0 && (
        <section className="container-page pb-20 sm:pb-28">
          <div className="reveal mb-10 flex items-end justify-between gap-4">
            <div>
              <div className="eyebrow flex items-center gap-2">
                <span className="live-dot size-1.5! text-success" /> Live
              </div>
              <h2 className="display-md mt-3">Proiecte publicate recent</h2>
            </div>
            <Link href="/proiecte" className="shrink-0 text-sm font-medium text-brand underline-offset-4 hover:underline">
              Toate proiectele →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {latest.map((r, n) => (
              <div key={r.project.id} className="reveal" style={cssVars({ i: n % 2 })}>
                <ProjectCard data={r} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Prestatori + CTA final */}
      <section className="px-2 sm:px-3">
        <div className="ink-panel rounded-[1.75rem] sm:rounded-[2.25rem]">
          <div aria-hidden className="aurora aurora-a -bottom-48 -left-20 size-[560px] opacity-45" />
          <div aria-hidden className="aurora aurora-b -top-40 right-[-10%] size-[520px] opacity-40" />
          <div className="container-page grid gap-12 py-16 sm:py-24 lg:grid-cols-2 lg:items-center">
            <div className="reveal">
              <div className="text-xs font-medium tracking-[0.08em] text-white/50 uppercase">Pentru prestatori</div>
              <h2 className="display-lg mt-4 text-white">
                Proiectele <span className="serif-em text-gradient-ink">vin la tine</span>.
              </h2>
              <p className="mt-5 max-w-lg text-[1.0625rem] leading-relaxed text-white/65">
                Fără licitații în gol și fără să plătești pe fiecare ofertă. Începi cu{" "}
                <mark className="hl-ink bg-transparent">{freePlan.monthlyApplications} aplicări gratuite pe lună</mark>; treci la un abonament de la{" "}
                {lowestPaid} lei doar dacă ai nevoie de mai mult.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/inregistrare?rol=prestator"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-[0.9375rem] font-semibold text-[#0b1426] transition-colors hover:bg-[#eef1fc]"
                >
                  Creează profilul gratuit <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/preturi"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-5 text-[0.9375rem] font-medium text-white transition-colors hover:bg-white/[0.09]"
                >
                  Vezi abonamentele
                </Link>
              </div>
            </div>
            <div className="reveal grid gap-3 sm:grid-cols-2" style={cssVars({ i: 1 })}>
              {[
                { k: "Aplicări gratuite / lună", v: String(freePlan.monthlyApplications) },
                { k: "Comision din lucrare", v: "0%" },
                { k: "Oferte maxime per proiect", v: String(rules.defaultMaxApplications) },
                { k: "Chat cu clientul", v: "Inclus" },
              ].map((x) => (
                <div key={x.k} className="glass rounded-2xl p-5">
                  <div className="text-[2.25rem] leading-none font-semibold tracking-[-0.035em] text-white tabular-nums">{x.v}</div>
                  <div className="mt-2 text-sm text-white/55">{x.k}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-20 text-center sm:py-28">
        <h2 className="reveal reveal-hl display-xl mx-auto max-w-4xl">
          Primul tău proiect e la <span className="hl">2 minute</span> distanță.
        </h2>
        <p className="reveal mx-auto mt-6 max-w-xl text-[1.0625rem] text-muted-foreground" style={cssVars({ i: 1 })}>
          Gratuit pentru clienți. Fără obligații. Alegi tu cu cine lucrezi.
        </p>
        <div className="reveal mt-9 flex flex-col justify-center gap-3 sm:flex-row" style={cssVars({ i: 2 })}>
          <Button asChild size="lg" className="h-12 rounded-xl px-6 text-[0.9375rem]">
            <Link href="/proiecte/nou">
              Publică un proiect gratuit <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-6 text-[0.9375rem]">
            <Link href="/prestatori">Caută prestatori</Link>
          </Button>
        </div>
        <p className="mt-10 text-xs text-muted-foreground">{site.name} nu intermediază plata lucrărilor. Clientul și prestatorul își stabilesc direct condițiile.</p>
      </section>
    </div>
  );
}
