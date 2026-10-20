import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { Check, Search, Sparkles, UserCog, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ProjectCard } from "@/components/projects/project-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { cssVars } from "@/components/home/css-vars";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { requireProvider } from "@/server/auth/guards";
import { getPlanUsage } from "@/server/billing/plans";
import { getCatalog } from "@/server/catalog/taxonomy";
import { db } from "@/server/db";
import { localities, projectMatches, providerCategories, users } from "@/server/db/schema";
import { recommendProjectsForProvider, type RecommendedProject } from "@/server/matching/run";
import { DismissButton, RestoreButton } from "./dismiss-button";

export const metadata: Metadata = { title: "Recomandări" };

export default async function RecommendationsPage({ searchParams }: { searchParams: Promise<{ vagi?: string }> }) {
  const user = await requireProvider();
  const { vagi } = await searchParams;
  const relaxed = vagi === "1";

  const [cats, dismissed, usage, catalog] = await Promise.all([
    db.select({ id: providerCategories.categoryId }).from(providerCategories).where(eq(providerCategories.providerId, user.id)),
    db
      .select({ projectId: projectMatches.projectId })
      .from(projectMatches)
      .where(and(eq(projectMatches.providerId, user.id), isNotNull(projectMatches.dismissedAt))),
    getPlanUsage(user.id),
    getCatalog(),
  ]);

  if (cats.length === 0) {
    return (
      <div className="container-page">
        <PageHeader title="Recomandări pentru tine" />
        <EmptyState
          icon={UserCog}
          title="Alege domeniile în care lucrezi"
          description="Recomandările se bazează pe categoriile, competențele, tariful și zona ta. Completează profilul ca să primești proiecte potrivite."
          action={
            <Button asChild>
              <Link href="/profil">Completează profilul</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const hidden = new Set(dismissed.map((d) => d.projectId));
  const strict = (await recommendProjectsForProvider(user.id, { limit: 30 })).filter((r) => !hidden.has(r.project.id));
  const strictIds = new Set(strict.map((r) => r.project.id));
  const loose = relaxed
    ? (await recommendProjectsForProvider(user.id, { limit: 40, relaxed: true })).filter((r) => !hidden.has(r.project.id) && !strictIds.has(r.project.id)).slice(0, 20)
    : [];

  // Date pentru carduri: localitate și verificarea clientului.
  const all = [...strict, ...loose];
  const locIds = [...new Set(all.map((r) => r.project.localityId).filter((x): x is number => x !== null))];
  const clientIds = [...new Set(all.map((r) => r.project.clientId))];
  const [locs, clients] = await Promise.all([
    locIds.length ? db.select({ id: localities.id, name: localities.name, countyCode: localities.countyCode }).from(localities).where(inArray(localities.id, locIds)) : [],
    clientIds.length ? db.select({ id: users.id, phoneVerifiedAt: users.phoneVerifiedAt, emailVerifiedAt: users.emailVerifiedAt }).from(users).where(inArray(users.id, clientIds)) : [],
  ]);
  const locMap = new Map(locs.map((l) => [l.id, l]));
  const clientMap = new Map(clients.map((c) => [c.id, c]));

  const render = (r: RecommendedProject, n: number) => {
    const loc = r.project.localityId ? locMap.get(r.project.localityId) : undefined;
    const client = clientMap.get(r.project.clientId);
    const positives = r.reasons.filter((x) => x.positive && x.points > 0).slice(0, 3);
    const negatives = r.reasons.filter((x) => !x.positive).slice(0, 2);
    return (
      <div key={r.project.id} className="reveal space-y-2.5" style={cssVars({ i: n % 2 })}>
        <ProjectCard
          data={{
            project: r.project,
            categoryName: catalog.byId.get(r.project.categoryId)?.name ?? "",
            localityName: loc?.name ?? null,
            countyCode: loc?.countyCode ?? null,
            clientPhoneVerified: Boolean(client?.phoneVerifiedAt),
            clientEmailVerified: Boolean(client?.emailVerifiedAt),
            distanceKm: r.distanceKm,
            score: r.score,
          }}
        />
        <div className="flex flex-wrap items-center gap-1.5 px-1 text-xs">
          {positives.map((x) => (
            <span key={x.label} className="flex items-center gap-1 rounded-md bg-brand-soft px-2 py-1 font-medium text-brand">
              <Check className="size-3" strokeWidth={2.5} /> {x.label}
            </span>
          ))}
          {negatives.map((x) => (
            <span key={x.label} className="flex items-center gap-1 rounded-md border px-2 py-1 text-muted-foreground">
              <X className="size-3" /> {x.label}
            </span>
          ))}
          <span className="ml-auto">
            <DismissButton projectId={r.project.id} score={r.score} />
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="container-page pb-16">
      <section className="ink-panel enter mt-6 mb-10 rounded-[1.75rem] sm:mt-8 dark:ring-1 dark:ring-white/8">
        <div aria-hidden className="aurora aurora-a -top-48 -left-20 size-[520px] opacity-50" />
        <div aria-hidden className="aurora aurora-c -right-24 -bottom-60 size-[460px] opacity-40" />
        <div className="grid gap-8 px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[1fr_340px] lg:items-center lg:gap-12">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-medium tracking-[0.08em] text-white/55 uppercase">
              <span className="live-dot size-1.5! text-emerald-400" /> Potrivire automată
            </div>
            <h1 className="display-md mt-3 text-white">
              Proiecte <span className="serif-em text-gradient-ink">potrivite</span> pentru tine.
            </h1>
            <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-white/65">
              Scorul e calculat din categorie, competențe, buget, distanță și reputație, iar motivele apar sub fiecare proiect. Fără cutii negre.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link
                href="/proiecte"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#0b1426] transition-colors hover:bg-[#eef1fc]"
              >
                <Search className="size-4" /> Caută manual
              </Link>
              <Link
                href={relaxed ? "/recomandari" : "/recomandari?vagi=1"}
                aria-pressed={relaxed}
                className="inline-flex h-10 items-center gap-2.5 rounded-xl border border-white/15 bg-white/[0.05] px-4 text-sm font-medium text-white transition-colors hover:bg-white/[0.1]"
              >
                <span aria-hidden className={cn("relative h-4 w-7 rounded-full transition-colors", relaxed ? "bg-[#7d97ff]" : "bg-white/20")}>
                  <span className={cn("absolute top-0.5 size-3 rounded-full bg-white shadow transition-[left]", relaxed ? "left-3.5" : "left-0.5")} />
                </span>
                Arată și potriviri mai vagi
              </Link>
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="flex items-baseline gap-2">
              <span className="text-[2.75rem] leading-none font-semibold tracking-[-0.04em] text-white tabular-nums">
                <span aria-hidden className="count-in" style={cssVars({ to: strict.length, i: 1 })} />
                <span className="sr-only">{strict.length}</span>
              </span>
              <span className="text-sm text-white/55">{strict.length === 1 ? "proiect compatibil acum" : "proiecte compatibile acum"}</span>
            </div>
            <div className="mt-4 border-t border-white/10 pt-4 text-sm">
              <div className="font-medium text-white tabular-nums">
                Îți rămân {usage.remaining} din {usage.limit} aplicări · {usage.plan.name}
              </div>
              <div className="mt-1 text-xs leading-relaxed text-white/55">
                Se reînnoiesc pe {formatDate(usage.periodEnd)}. Chat-ul după aplicare este nelimitat.{" "}
                {usage.plan.id !== "business" && (
                  <Link href="/abonament" className="font-medium text-[#a9bcff] underline-offset-4 hover:underline">
                    Vezi planurile
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {strict.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Momentan nu avem proiecte foarte potrivite"
          description="Te anunțăm pe email imediat ce apare un proiect compatibil. Între timp, activează potrivirile mai vagi sau caută manual."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {!relaxed && (
                <Button asChild>
                  <Link href="/recomandari?vagi=1">Arată potriviri mai vagi</Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link href="/profil">Îmbunătățește profilul</Link>
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">{strict.map(render)}</div>
      )}

      {relaxed && (
        <section className="mt-14 border-t pt-10">
          <div className="eyebrow">Criterii relaxate</div>
          <h2 className="mt-1.5 text-[1.375rem] font-semibold tracking-[-0.022em]">Poate te interesează</h2>
          <p className="mt-1 mb-5 text-sm leading-relaxed text-muted-foreground">
            Criterii relaxate: domenii apropiate, rază dublă, inclusiv proiecte care cer factură sau au buget sub minimul tău.
          </p>
          {loose.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nu am găsit alte proiecte nici cu filtrele relaxate.</p>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">{loose.map(render)}</div>
          )}
        </section>
      )}

      {hidden.size > 0 && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Ai ascuns {hidden.size} {hidden.size === 1 ? "recomandare" : "recomandări"}. <RestoreButton />
        </p>
      )}
    </div>
  );
}
