import { and, desc, eq, inArray } from "drizzle-orm";
import { ArrowRight, Bot, Clock, Hand, Inbox, Info, ListChecks, ShieldCheck, Zap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ProposalCard } from "@/components/autobid/proposal-card";
import { RuleFormDialog, type RuleFormValue } from "@/components/autobid/rule-form";
import { RuleDelete, RuleToggle, StopAllButton } from "@/components/autobid/rule-controls";
import { PlanUsageGlass } from "@/components/dashboard/plan-usage-glass";
import { cssVars } from "@/components/home/css-vars";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { labels, paidPlans, rules } from "@/config/site";
import { describeBudget, timeAgo } from "@/lib/format";
import { requireProvider } from "@/server/auth/guards";
import { getPlanUsage } from "@/server/billing/plans";
import { getCatalog } from "@/server/catalog/taxonomy";
import { db } from "@/server/db";
import { autoBidExecutions, autoBidRules, projects, providerCategories } from "@/server/db/schema";
import { features } from "@/server/features";

export const metadata: Metadata = { title: "Auto Bid" };

const EXEC_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" | "brand" | "warning" }> = {
  proposed: { label: "Așteaptă confirmarea", variant: "warning" },
  applied: { label: "Aplicat", variant: "brand" },
  skipped: { label: "Sărit", variant: "secondary" },
  declined: { label: "Refuzat de tine", variant: "outline" },
  expired: { label: "Expirat", variant: "outline" },
  failed: { label: "Eșuat", variant: "destructive" },
};

export default async function AutoBidPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requireProvider();
  const { tab } = await searchParams;
  const catalog = await getCatalog();

  const [ruleRows, myCats, usage, proposals, history] = await Promise.all([
    db.select().from(autoBidRules).where(eq(autoBidRules.providerId, user.id)).orderBy(desc(autoBidRules.createdAt)),
    db.select({ id: providerCategories.categoryId }).from(providerCategories).where(eq(providerCategories.providerId, user.id)),
    getPlanUsage(user.id),
    db
      .select({ ex: autoBidExecutions, project: projects })
      .from(autoBidExecutions)
      .innerJoin(projects, eq(projects.id, autoBidExecutions.projectId))
      .where(and(eq(autoBidExecutions.providerId, user.id), eq(autoBidExecutions.status, "proposed"), eq(projects.status, "open")))
      .orderBy(desc(autoBidExecutions.createdAt)),
    db
      .select({ ex: autoBidExecutions, title: projects.title, projectId: projects.id })
      .from(autoBidExecutions)
      .innerJoin(projects, eq(projects.id, autoBidExecutions.projectId))
      .where(and(eq(autoBidExecutions.providerId, user.id), inArray(autoBidExecutions.status, ["applied", "skipped", "declined", "expired", "failed"])))
      .orderBy(desc(autoBidExecutions.updatedAt))
      .limit(50),
  ]);

  const categories = myCats.map((c) => ({ id: c.id, name: catalog.byId.get(c.id)?.name ?? "" })).filter((c) => c.name);
  const hasAutoBid = usage.plan.autoBid;
  const ruleMap = new Map(ruleRows.map((r) => [r.id, r.name]));
  const enabledCount = ruleRows.filter((r) => r.enabled).length;
  const canRun = hasAutoBid && usage.remaining > 0;

  return (
    <div className="container-page pb-16">
      <PageHeader
        eyebrow="Pentru prestatori"
        title={
          <>
            Auto Bid lucrează <span className="serif-em text-gradient">cât dormi</span>
          </>
        }
        description="Autorizezi platforma să aplice în numele tău, strict în limitele pe care le setezi. Tu controlezi mesajul, prețul și ritmul."
        actions={
          <>
            {enabledCount > 0 && <StopAllButton />}
            <RuleFormDialog categories={categories} hasPlan={hasAutoBid} phoneVerification={features.phoneVerification} />
          </>
        }
      />

      <section className="ink-panel enter rounded-[1.75rem] dark:ring-1 dark:ring-white/8" style={cssVars({ i: 1 })}>
        <div aria-hidden className="aurora aurora-a -top-52 -left-24 size-[520px] opacity-45" />
        <div aria-hidden className="aurora aurora-b -right-40 -bottom-64 size-[480px] opacity-30" />
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[340px_1fr] lg:gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-medium tracking-[0.08em] text-white/55 uppercase">
              {enabledCount > 0 && canRun ? (
                <>
                  <span className="live-dot size-1.5! text-emerald-400" /> {enabledCount} {enabledCount === 1 ? "regulă activă" : "reguli active"}
                </>
              ) : (
                <>
                  <Zap className="size-3.5" /> Planul tău
                </>
              )}
            </div>
            <PlanUsageGlass usage={usage} i={2} />
            <p className="text-xs leading-relaxed text-white/50">Aplicările automate și cele manuale se socotesc în aceeași limită lunară.</p>
            {!hasAutoBid && (
              <div className="rounded-2xl border border-[#7d97ff]/30 bg-[#5b7cff]/10 p-4 text-sm">
                <p className="leading-relaxed text-white/80">
                  Auto Bid este inclus în planurile {paidPlans.map((p) => p.name).join(" și ")}. Poți pregăti regulile acum; pornesc după ce activezi planul.
                </p>
                <Link
                  href="/abonament"
                  className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3.5 text-sm font-semibold text-[#0b1426] transition-colors hover:bg-[#eef1fc]"
                >
                  Vezi planurile <ArrowRight className="size-4" />
                </Link>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs font-medium tracking-[0.08em] text-white/55 uppercase">
              <ShieldCheck className="size-3.5 text-emerald-400" /> Reguli de protecție
            </div>
            <ul className="mt-4 grid gap-3 text-sm leading-relaxed sm:grid-cols-2">
              {[
                { icon: Clock, t: `Primele ${rules.autoBidDelayMinutes} de minute după publicare sunt rezervate aplicărilor manuale.` },
                { icon: ListChecks, t: `Maximum ${rules.defaultMaxAutoApplications} din ${rules.defaultMaxApplications} locuri pot fi ocupate de aplicări automate.` },
                { icon: Bot, t: "Aplicările automate sunt marcate vizibil pentru client, care le poate dezactiva." },
                { icon: Hand, t: "Nu inventăm prețuri sau termene: folosim doar mesajul și condițiile aprobate de tine." },
                { icon: Zap, t: "Ordinea e dată de compatibilitate, nu de viteză. Plata nu cumpără prioritate." },
                { icon: Info, t: "Respectăm limita zilnică și limita lunară a planului. Poți opri totul instant." },
              ].map((x) => (
                <li key={x.t} className="flex gap-3 rounded-xl border border-white/8 bg-white/[0.035] p-3.5 text-white/75">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/85">
                    <x.icon className="size-3.5" />
                  </span>
                  {x.t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {ruleRows.length > 0 && enabledCount > 0 && !canRun && (
        <Alert variant="warning" className="mt-6">
          <Info />
          <AlertTitle>Regulile tale nu pot aplica momentan</AlertTitle>
          <AlertDescription>
            {hasAutoBid ? "Ai folosit toate aplicările planului în perioada curentă." : "Planul tău nu include Auto Bid."}{" "}
            <Link href="/abonament" className="font-medium text-brand underline-offset-4 hover:underline">
              Vezi abonamentul
            </Link>
            .
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue={tab === "propuneri" ? "proposals" : tab === "istoric" ? "history" : "rules"} className="mt-8">
        <TabsList>
          <TabsTrigger value="rules">Reguli ({ruleRows.length})</TabsTrigger>
          <TabsTrigger value="proposals">Propuneri {proposals.length > 0 && <Badge variant="brand" className="ml-1 h-4 px-1.5 tabular-nums">{proposals.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="history">Istoric</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="mt-4 space-y-3">
          {ruleRows.length === 0 ? (
            <EmptyState
              icon={Bot}
              title="Nicio regulă încă"
              description="Creează o regulă: alegi categoriile, bugetul minim, compatibilitatea și mesajul. Începe cu modul „Propune, eu confirm”."
              action={<RuleFormDialog categories={categories} hasPlan={hasAutoBid} phoneVerification={features.phoneVerification} />}
            />
          ) : (
            ruleRows.map((r) => {
              const value: RuleFormValue = {
                id: r.id,
                name: r.name,
                enabled: r.enabled,
                mode: r.mode,
                categoryIds: r.categoryIds,
                keywords: r.keywords,
                excludeKeywords: r.excludeKeywords,
                minScore: r.minScore,
                minBudget: r.minBudget,
                maxBudget: r.maxBudget,
                workModes: r.workModes,
                maxDistanceKm: r.maxDistanceKm,
                requireVerifiedClient: r.requireVerifiedClient,
                dailyCap: r.dailyCap,
                template: r.template,
                priceAmount: r.priceAmount,
                priceType: r.priceType,
                estimatedDays: r.estimatedDays,
                personalizeWithAi: r.personalizeWithAi,
              };
              const cats = r.categoryIds.length ? r.categoryIds.map((id) => catalog.byId.get(id)?.name).filter(Boolean).join(", ") : "Toate categoriile mele";
              return (
                <div key={r.id} className="reveal rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <RuleToggle ruleId={r.id} enabled={r.enabled} />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold tracking-[-0.01em]">{r.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{cats}</div>
                    </div>
                    <Badge variant={r.mode === "automatic" ? "brand" : "secondary"}>{r.mode === "automatic" ? "Automat" : "Propune, eu confirm"}</Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5 text-xs">
                    <Badge variant="outline">≥ {r.minScore}% compatibil</Badge>
                    {(r.minBudget || r.maxBudget) && (
                      <Badge variant="outline">
                        Buget {r.minBudget ? `de la ${r.minBudget.toLocaleString("ro-RO")}` : ""} {r.maxBudget ? `până la ${r.maxBudget.toLocaleString("ro-RO")}` : ""} lei
                      </Badge>
                    )}
                    <Badge variant="outline">{r.workModes.map((m) => labels.workMode[m as keyof typeof labels.workMode]).join(" / ")}</Badge>
                    {r.maxDistanceKm && <Badge variant="outline">max {r.maxDistanceKm} km</Badge>}
                    <Badge variant="outline">max {r.dailyCap}/zi</Badge>
                    {r.keywords.length > 0 && <Badge variant="outline">conține: {r.keywords.join(", ")}</Badge>}
                    {r.excludeKeywords.length > 0 && <Badge variant="outline">exclude: {r.excludeKeywords.join(", ")}</Badge>}
                    {r.requireVerifiedClient && features.phoneVerification && <Badge variant="outline">doar clienți verificați</Badge>}
                    {r.priceType !== "to_discuss" && r.priceAmount && (
                      <Badge variant="secondary">
                        {r.priceAmount.toLocaleString("ro-RO")} lei · {labels.priceType[r.priceType]}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-4 line-clamp-2 border-l-2 pl-3 text-sm leading-relaxed text-muted-foreground italic">{r.template}</p>
                  <div className="mt-4 flex justify-end gap-1 border-t pt-3">
                    <RuleFormDialog rule={value} categories={categories} hasPlan={hasAutoBid} phoneVerification={features.phoneVerification} />
                    <RuleDelete ruleId={r.id} />
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="proposals" className="mt-4 space-y-3">
          {proposals.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Nicio propunere în așteptare"
              description="Când un proiect nou respectă o regulă în modul „Propune, eu confirm”, mesajul pregătit apare aici. Propunerile expiră după 3 zile."
            />
          ) : (
            proposals.map(({ ex, project }) => (
              <ProposalCard
                key={ex.id}
                executionId={ex.id}
                projectId={project.id}
                projectTitle={project.title}
                score={ex.score}
                draft={ex.draftMessage ?? ""}
                meta={`${catalog.byId.get(project.categoryId)?.name ?? ""} · ${describeBudget(project)} · ${project.applicationsCount}/${project.maxApplications} locuri · regula „${ruleMap.get(ex.ruleId) ?? ""}” · ${timeAgo(ex.createdAt)}`}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {history.length === 0 ? (
            <EmptyState icon={Clock} title="Niciun istoric încă" description="Aici vezi unde a aplicat Auto Bid și de ce a sărit anumite proiecte." />
          ) : (
            <div className="divide-y overflow-hidden rounded-2xl border bg-card shadow-xs">
              {history.map(({ ex, title, projectId }) => {
                const st = EXEC_STATUS[ex.status];
                return (
                  <div key={ex.id} className="flex flex-col gap-1.5 px-5 py-4 sm:flex-row sm:items-center sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <Link href={`/proiecte/${projectId}`} className="text-sm font-medium underline-offset-4 hover:underline">
                        {title}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {ruleMap.get(ex.ruleId) ? `Regula „${ruleMap.get(ex.ruleId)}” · ` : ""}
                        {ex.score !== null ? `${ex.score}% compatibil · ` : ""}
                        {timeAgo(ex.updatedAt)}
                      </div>
                      {ex.reason && <div className="text-xs text-muted-foreground">Motiv: {ex.reason}</div>}
                    </div>
                    <Badge variant={st?.variant ?? "secondary"}>{st?.label ?? ex.status}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
}
