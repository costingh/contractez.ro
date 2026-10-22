import { BadgeCheck, Bot, Check, Radar, ShieldCheck, Sparkles, Star } from "lucide-react";
import { rules, site } from "@/config/site";
import { cn } from "@/lib/utils";
import type { FeaturedReview } from "@/server/insights";
import { cssVars } from "./css-vars";

function Tile({ className, i, eyebrow, title, children, body }: { className?: string; i: number; eyebrow: string; title: React.ReactNode; body: string; children: React.ReactNode }) {
  return (
    <div className={cn("reveal lift group relative flex flex-col overflow-hidden rounded-2xl border bg-card p-6 shadow-xs sm:p-7", className)} style={cssVars({ i })}>
      <div className="eyebrow">{eyebrow}</div>
      <h3 className="mt-2 text-[1.3125rem] leading-tight font-semibold tracking-[-0.022em]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{body}</p>
      <div className="mt-6 flex flex-1 items-end">{children}</div>
    </div>
  );
}

/** Ce ne diferențiază, ca „bento grid”; fiecare țiglă are o mini-ilustrație animată doar din CSS. */
export function Bento({ reviews }: { reviews: FeaturedReview[] }) {
  const max = rules.defaultMaxApplications;
  return (
    <section className="container-page py-20 sm:py-28">
      <div className="reveal reveal-hl mx-auto max-w-3xl text-center">
        <div className="eyebrow">De ce {site.name}</div>
        <h2 className="display-lg mt-4">
          Construit pentru <span className="serif-em text-gradient">încredere</span>, nu pentru volum.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-[1.0625rem] leading-relaxed text-muted-foreground">
          Platformele clasice câștigă din câte oferte trimiți. Noi câștigăm doar dacă găsești omul potrivit, așa că am construit totul invers.
        </p>
      </div>

      <div className="mt-14 grid gap-4 md:grid-cols-6">
        {/* Limita de oferte */}
        <Tile
          i={0}
          className="md:col-span-4"
          eyebrow="Fără inundații de oferte"
          title={
            <>
              Maximum {max} oferte. <span className="text-muted-foreground">Toate relevante.</span>
            </>
          }
          body="Proiectul tău ajunge doar la prestatorii compatibili cu domeniul, zona, bugetul și factura. Locurile se închid după primele oferte."
        >
          <div className="grid w-full gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-dashed bg-muted/40 p-4">
              <div className="text-xs font-medium text-muted-foreground">De obicei</div>
              <div className="mt-3 space-y-1.5 opacity-60">
                {[88, 72, 95, 64, 80].map((w, k) => (
                  <div key={k} className="flex items-center gap-2">
                    <span className="size-4 shrink-0 rounded-full bg-border-strong" />
                    <span className="h-2 rounded-full bg-border-strong" style={{ width: `${w}%` }} />
                  </div>
                ))}
              </div>
              <div className="mt-3 text-sm font-semibold text-muted-foreground tabular-nums line-through decoration-destructive/60">zeci de oferte generice</div>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs font-medium">
                <span>Aici</span>
                <span className="text-success">toate verificate</span>
              </div>
              <div className="mt-3 flex h-[86px] items-end gap-2">
                {Array.from({ length: max }, (_, k) => (
                  <span key={k} className="slot-fill flex-1 rounded-md bg-primary" style={{ ...cssVars({ i: k }), height: `${100 - k * 9}%` }} />
                ))}
              </div>
              <div className="mt-3 text-sm font-semibold tabular-nums">
                {max} oferte, {max} profiluri reale
              </div>
            </div>
          </div>
        </Tile>

        {/* ANAF */}
        <Tile
          i={1}
          className="md:col-span-2"
          eyebrow="Verificare ANAF"
          title="Firmele sunt verificate în registrul public."
          body="CUI-ul e opțional, dar dacă îl ai, îl verificăm automat și lunar."
        >
          <div className="w-full rounded-xl border bg-surface p-4 dark:bg-muted/40">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground">CUI RO41234567</span>
              <svg viewBox="0 0 24 24" className="size-6 text-success" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" className="draw" style={cssVars({ len: 64 })} />
                <path d="m7.5 12.5 3 3 6-6.5" className="draw" style={cssVars({ len: 16 })} />
              </svg>
            </div>
            <div className="mt-2 text-sm font-semibold">Studio Nord SRL</div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-md border border-success/25 bg-success/8 px-2 py-0.5 text-xs font-medium text-success">
                <BadgeCheck className="size-3" /> Firmă activă
              </span>
              <span className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">Plătitor TVA</span>
            </div>
          </div>
        </Tile>

        {/* AI */}
        <Tile
          i={2}
          className="md:col-span-2"
          eyebrow="AI care chiar ajută"
          title="Scrii liber. Iese un brief clar."
          body="Categorie, buget, localitate, competențe și întrebările care lipsesc. Tu aprobi totul."
        >
          <div className="w-full space-y-2.5">
            <div className="rounded-lg bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground italic">„am nevoie de cineva să-mi zugrăvească 2 camere în Brașov, săpt. viitoare…”</div>
            <div className="flex items-center gap-2 pl-1 text-xs font-medium text-brand">
              <Sparkles className="size-3.5" /> <span className="text-gradient">structurat în 3 secunde</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {[
                ["Categorie", "Zugrăveli"],
                ["Zonă", "Brașov"],
                ["Termen", "Săpt. viitoare"],
                ["Suprafață", "2 camere"],
              ].map(([k, v], n) => (
                <div key={k} className="reveal rounded-md border bg-card px-2.5 py-1.5" style={cssVars({ i: n + 1 })}>
                  <div className="text-[0.6875rem] text-muted-foreground">{k}</div>
                  <div className="font-medium">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </Tile>

        {/* Statusul ofertei */}
        <Tile
          i={3}
          className="md:col-span-2"
          eyebrow="Transparență"
          title="Știi exact ce se întâmplă cu oferta ta."
          body="Livrată, citită, pe lista scurtă. Nicio ofertă trimisă în gol."
        >
          <div className="w-full rounded-xl border bg-surface p-4 dark:bg-muted/40">
            <div className="relative mx-2 h-1 rounded-full bg-border">
              <span className="traveler absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand ring-4 ring-brand/20" />
            </div>
            <div className="mt-4 grid grid-cols-4 gap-1 text-center text-[0.6875rem] font-medium">
              {["Trimisă", "Livrată", "Citită", "Lista scurtă"].map((s, n) => (
                <div key={s} className="flex flex-col items-center gap-1.5">
                  <span className="step-dot flex size-5 items-center justify-center rounded-full" style={cssVars({ d: `${n * 2}s` })}>
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {s}
                </div>
              ))}
            </div>
          </div>
        </Tile>

        {/* Auto Bid */}
        <Tile
          i={4}
          className="md:col-span-2"
          eyebrow="Pentru prestatori"
          title={
            <>
              Auto Bid lucrează <span className="serif-em">cât dormi</span>.
            </>
          }
          body="Setezi regulile o dată. Aplicăm în numele tău doar la proiectele care chiar se potrivesc."
        >
          <div className="flex w-full items-center gap-5">
            <div className="relative size-28 shrink-0 overflow-hidden rounded-full border bg-surface dark:bg-muted/40">
              <div className="absolute inset-[18%] rounded-full border border-dashed" />
              <div className="absolute inset-[38%] rounded-full border" />
              <div className="radar absolute inset-0 rounded-full" />
              {[
                ["24%", "30%", "0.4s"],
                ["66%", "22%", "1.5s"],
                ["58%", "68%", "2.6s"],
              ].map(([l, t, d]) => (
                <span key={l} className="blip absolute size-2 rounded-full bg-brand shadow-[0_0_0_4px_color-mix(in_oklab,var(--brand)_20%,transparent)]" style={{ left: l, top: t, ...cssVars({ d }) }} />
              ))}
              <Radar className="absolute top-1/2 left-1/2 size-4 -translate-1/2 text-muted-foreground" />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Bot className="size-4 text-brand" /> <span className="font-medium">3 potriviri azi</span>
              </div>
              <div className="text-xs leading-relaxed text-muted-foreground">Max. {rules.defaultMaxAutoApplications} locuri automate per proiect, după {rules.autoBidDelayMinutes} de minute rezervate oamenilor.</div>
            </div>
          </div>
        </Tile>

        {/* Recenzii */}
        <Tile
          i={5}
          className="md:col-span-6 lg:col-span-6"
          eyebrow="Reputație care nu se cumpără"
          title={
            <>
              Recenzii <span className="hl">doar după o colaborare confirmată</span> de ambele părți.
            </>
          }
          body="Nu poți lăsa (sau cumpăra) o recenzie fără un proiect real. Promovarea e etichetată clar și nu schimbă niciodată scorul de compatibilitate."
        >
          {reviews.length > 0 ? (
            <div className={cn("grid w-full gap-3", ["", "sm:max-w-xl", "sm:grid-cols-2", "sm:grid-cols-3"][reviews.length])}>
              {reviews.map((r, n) => (
                <figure key={r.id} className="reveal rounded-xl border bg-surface p-4 dark:bg-muted/40" style={cssVars({ i: n })}>
                  <div className="stars-fill flex gap-0.5 text-amber-500" aria-label={`${r.rating} din 5 stele`}>
                    {Array.from({ length: 5 }, (_, k) => (
                      <Star key={k} className={cn("size-3.5", k < r.rating ? "fill-current" : "text-border-strong")} />
                    ))}
                  </div>
                  <blockquote className="mt-2.5 line-clamp-4 text-sm leading-relaxed [overflow-wrap:anywhere]">„{r.comment}”</blockquote>
                  <figcaption className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck className="size-3.5 shrink-0 text-success" /> <span className="font-medium text-foreground">{r.author}</span>
                    <span className="truncate">
                      · {r.category}
                      {r.locality ? ` · ${r.locality}` : ""}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <ol className="grid w-full gap-3 sm:grid-cols-3">
              {[
                ["Colaborare confirmată", "Clientul alege, prestatorul confirmă."],
                ["Recenzie de ambele părți", "Doar după ce lucrarea s-a încheiat."],
                ["Răspuns public", "Prestatorul poate răspunde oricărei recenzii."],
              ].map(([t, d], n) => (
                <li key={t} className="reveal flex gap-3 rounded-xl border bg-surface p-4 dark:bg-muted/40" style={cssVars({ i: n })}>
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{n + 1}</span>
                  <div>
                    <div className="text-sm font-medium">{t}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{d}</div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Tile>
      </div>
    </section>
  );
}
