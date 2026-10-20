import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  ArrowRight,
  Bot,
  Eye,
  Handshake,
  ListChecks,
  Send,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { ProjectCard } from "@/components/projects/project-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { labels } from "@/config/site";
import { formatDate, timeAgo } from "@/lib/format";
import { truncate } from "@/lib/text";
import { getPlanUsage } from "@/server/billing/plans";
import { getCatalog, rootOf } from "@/server/catalog/taxonomy";
import { db } from "@/server/db";
import {
  applications,
  autoBidExecutions,
  autoBidRules,
  localities,
  projects,
} from "@/server/db/schema";
import { categoryDemand, providerStats } from "@/server/insights";
import { recommendProjectsForProvider } from "@/server/matching/run";
import { cssVars } from "@/components/home/css-vars";
import { StatTile } from "./stat-tile";

const statusVariant: Record<string, "secondary" | "brand" | "success"> = {
  submitted: "secondary",
  viewed: "brand",
  shortlisted: "success",
};

export async function ProviderDashboard({
  userId,
  countyCode,
}: {
  userId: string;
  countyCode: string | null;
}) {
  const catalog = await getCatalog();
  const [usage, stats, recs, active, proposals, rules, demand, myCats] =
    await Promise.all([
      getPlanUsage(userId),
      providerStats(userId),
      recommendProjectsForProvider(userId, { limit: 5 }),
      db
        .select({
          app: applications,
          title: projects.title,
          projectId: projects.id,
        })
        .from(applications)
        .innerJoin(projects, eq(projects.id, applications.projectId))
        .where(
          and(
            eq(applications.providerId, userId),
            inArray(applications.status, [
              "submitted",
              "viewed",
              "shortlisted",
            ]),
          ),
        )
        .orderBy(desc(applications.updatedAt))
        .limit(5),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(autoBidExecutions)
        .where(
          and(
            eq(autoBidExecutions.providerId, userId),
            eq(autoBidExecutions.status, "proposed"),
          ),
        ),
      db
        .select({
          n: sql<number>`count(*) FILTER (WHERE ${autoBidRules.enabled})::int`,
        })
        .from(autoBidRules)
        .where(eq(autoBidRules.providerId, userId)),
      categoryDemand(countyCode),
      db.execute(
        sql`SELECT category_id FROM provider_categories WHERE provider_id = ${userId}`,
      ) as unknown as Promise<{ category_id: number }[]>,
    ]);

  // Numele localităților pentru recomandări.
  const locIds = [
    ...new Set(
      recs
        .map((r) => r.project.localityId)
        .filter((x): x is number => x !== null),
    ),
  ];
  const locs = locIds.length
    ? await db
        .select({
          id: localities.id,
          name: localities.name,
          countyCode: localities.countyCode,
        })
        .from(localities)
        .where(inArray(localities.id, locIds))
    : [];
  const locMap = new Map(locs.map((l) => [l.id, l]));

  const myRoots = new Set(
    (myCats as { category_id: number }[])
      .map((c) => rootOf(catalog, c.category_id)?.id)
      .filter(Boolean),
  );
  const myDemand = demand.filter((d) => myRoots.has(d.categoryId));
  const hot = demand
    .filter((d) => d.label === "Cerere mare" && !myRoots.has(d.categoryId))
    .slice(0, 2);
  const viewRate =
    stats.applications > 0
      ? Math.round((stats.viewed / stats.applications) * 100)
      : null;
  const plan = usage.plan;
  const pending = proposals[0]?.n ?? 0;
  const enabledRules = rules[0]?.n ?? 0;
  const where = countyCode ? ` în ${countyCode}` : "";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          icon={Sparkles}
          label="Potriviri noi"
          value={stats.matches30}
          hint="proiecte compatibile, ultimele 30 de zile"
          href="/recomandari"
        />
        <StatTile
          icon={Send}
          label="Aplicări trimise"
          value={stats.applications}
          hint={`${stats.last30} în ultimele 30 de zile`}
          href="/aplicarile-mele"
        />
        <StatTile
          icon={Eye}
          label="Rata de citire"
          value={viewRate === null ? "—" : `${viewRate}%`}
          hint={`${stats.shortlisted} pe lista scurtă`}
        />
        <StatTile
          icon={Handshake}
          label="Colaborări câștigate"
          value={stats.hired}
          hint={`${stats.profileViews} vizualizări profil`}
          href="/colaborari"
        />
      </div>

      {usage.remaining === 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-warning/30 bg-warning/8 p-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <span className="leading-relaxed">
            Ai folosit toate cele {usage.limit} aplicări ale planului{" "}
            {plan.name}. Se reînnoiesc pe {formatDate(usage.periodEnd)}; chat-ul
            cu clienții rămâne nelimitat.
          </span>
          {plan.id !== "business" && (
            <Button asChild size="sm">
              <Link href="/abonament">
                {plan.id === "free" ? "Vezi planurile" : "Treci la Business"}
              </Link>
            </Button>
          )}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <section className="min-w-0 space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="eyebrow flex items-center gap-2">
                <span className="live-dot size-1.5! text-success" /> Potrivite
                profilului tău
              </div>
              <h2 className="mt-1.5 text-[1.375rem] font-semibold tracking-[-0.022em]">
                Recomandate pentru tine
              </h2>
            </div>
            <Link
              href="/recomandari"
              className="flex shrink-0 items-center gap-1 text-sm font-medium text-brand underline-offset-4 hover:underline"
            >
              Toate <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {recs.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="Niciun proiect compatibil acum"
              description="Îți trimitem alertă imediat ce apare unul. Între timp, completează competențele și zona de lucru sau caută manual."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/profil#prestator">Completează profilul</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/proiecte">Caută proiecte</Link>
                  </Button>
                </div>
              }
            />
          ) : (
            <div className="space-y-4">
              {recs.map((r, n) => {
                const loc = r.project.localityId
                  ? locMap.get(r.project.localityId)
                  : undefined;
                return (
                  <div
                    key={r.project.id}
                    className="reveal"
                    style={cssVars({ i: n })}
                  >
                    <ProjectCard
                      data={{
                        project: r.project,
                        categoryName:
                          catalog.byId.get(r.project.categoryId)?.name ?? "",
                        localityName: loc?.name ?? null,
                        countyCode: loc?.countyCode ?? null,
                        distanceKm: r.distanceKm,
                        score: r.score,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <aside className="reveal min-w-0 space-y-4" style={cssVars({ i: 1 })}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ListChecks className="size-4 text-muted-foreground" /> Aplicări
                active
              </CardTitle>
            </CardHeader>
            <CardContent>
              {active.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nicio aplicare în așteptare.
                </p>
              ) : (
                <ul className="-my-1 divide-y">
                  {active.map((a) => (
                    <li key={a.app.id} className="space-y-1.5 py-2.5">
                      <Link
                        href={`/proiecte/${a.projectId}`}
                        className="block text-sm leading-snug font-medium underline-offset-4 hover:underline"
                      >
                        {truncate(a.title, 60)}
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge
                          variant={statusVariant[a.app.status] ?? "secondary"}
                        >
                          {labels.applicationStatus[a.app.status]}
                        </Badge>
                        {a.app.isAuto && <Badge variant="outline">Auto</Badge>}
                        <span>{timeAgo(a.app.createdAt)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/aplicarile-mele"
                className="mt-3 block border-t pt-3 text-sm font-medium text-brand underline-offset-4 hover:underline"
              >
                Toate aplicările
              </Link>
            </CardContent>
          </Card>

          {!plan.autoBid ? (
            <Link
              href="/abonament"
              className="ink-panel lift group block rounded-2xl p-5"
            >
              <div
                aria-hidden
                className="aurora aurora-a -top-24 -right-20 size-[260px] opacity-60"
              />
              <div className="flex items-center gap-2 text-xs font-medium tracking-[0.08em] text-white/55 uppercase">
                <Bot className="size-3.5 text-[#8ea6ff]" /> Auto Bid
              </div>
              <div className="mt-3 text-[1.375rem] leading-tight font-semibold tracking-[-0.025em] text-white">
                Aplică automat{" "}
                <span className="serif-em text-gradient-ink">cât dormi</span>.
              </div>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                Inclus în Pro și Business: aplică la proiectele potrivite, în
                limitele tale.
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                Vezi planurile{" "}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bot className="size-4 text-brand" /> Auto Bid
                  {enabledRules > 0 && (
                    <span
                      className="live-dot ml-auto size-1.5! text-success"
                      aria-label="activ"
                    />
                  )}
                </CardTitle>
                <CardDescription>
                  {enabledRules > 0
                    ? `${enabledRules} ${enabledRules === 1 ? "regulă activă" : "reguli active"} · inclus în planul ${plan.name}`
                    : "Aplică automat la proiectele potrivite, în limitele setate de tine."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {pending > 0 && (
                  <Link
                    href="/auto-bid?tab=propuneri"
                    className="flex items-center justify-between rounded-lg border border-brand/20 bg-brand-soft px-3 py-2.5 text-sm font-medium"
                  >
                    {pending}{" "}
                    {pending === 1
                      ? "propunere de confirmat"
                      : "propuneri de confirmat"}{" "}
                    <ArrowRight className="size-4" />
                  </Link>
                )}
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/auto-bid">
                    {enabledRules > 0
                      ? "Gestionează Auto Bid"
                      : "Configurează Auto Bid"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="size-4 text-muted-foreground" /> Piața
                {where}
              </CardTitle>
              <CardDescription>
                Cerere vs. ofertă în ultimele 30 de zile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {myDemand.length === 0 && (
                <p className="text-muted-foreground">
                  Încă nu avem suficiente date pentru categoriile tale.
                </p>
              )}
              {myDemand.map((d) => (
                <div
                  key={d.categoryId}
                  className="space-y-1 border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{d.name}</span>
                    <DemandBadge label={d.label} />
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {demandSentence(d.projects30d, d.providers, d.label, where)}
                  </p>
                </div>
              ))}
              {hot.length > 0 && (
                <div className="border-t pt-3 text-xs leading-relaxed text-muted-foreground">
                  <Sparkles className="mr-1 inline size-3.5 text-brand" />
                  Cerere mare și în {hot.map((h) => h.name).join(", ")}. Dacă
                  oferi și aceste servicii,{" "}
                  <Link
                    href="/profil#prestator"
                    className="font-medium text-brand underline-offset-4 hover:underline"
                  >
                    adaugă-le în profil
                  </Link>
                  .
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export function DemandBadge({ label }: { label: string }) {
  const variant =
    label === "Cerere mare"
      ? "brand"
      : label === "Competiție mare"
        ? "warning"
        : "secondary";
  return (
    <Badge variant={variant} className="shrink-0">
      {label}
    </Badge>
  );
}

export function demandSentence(
  projects: number,
  providers: number,
  label: string,
  where: string,
) {
  const p = projects === 1 ? "1 proiect nou" : `${projects} proiecte noi`;
  const v =
    providers === 1
      ? "un singur prestator activ"
      : `${providers} prestatori activi`;
  if (label === "Fără date") return "Nicio activitate recentă.";
  if (label === "Cerere mare")
    return `${p} luna aceasta, doar ${v}${where}. Răspunde rapid — clienții așteaptă oferte.`;
  if (label === "Competiție mare")
    return `${p} și ${v}${where}. Diferențiază-te prin portofoliu și timp de răspuns.`;
  return `${p} luna aceasta, ${v}${where}.`;
}
