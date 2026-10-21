import { and, eq, isNull, sql } from "drizzle-orm";
import {
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Clock,
  Eye,
  HelpCircle,
  Lightbulb,
  MapPin,
  Receipt,
  Sparkles,
  Users,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ApplyPanel } from "@/components/project-detail/apply-panel";
import { ReportDialog } from "@/components/project-detail/report-dialog";
import { SaveButton } from "@/components/project-detail/save-button";
import { ScoreBadge } from "@/components/shared/score-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { freePlan, labels } from "@/config/site";
import { describeBudget, formatDate, timeAgo } from "@/lib/format";
import { truncate } from "@/lib/text";
import { isFirstViewToday } from "@/server/views";
import { getCurrentUser } from "@/server/auth/session";
import { getPlanUsage, type PlanUsage } from "@/server/billing/plans";
import { getCategoryAttributes, getCatalog, rootOf } from "@/server/catalog/taxonomy";
import { db } from "@/server/db";
import { features, phoneVerifiedSql } from "@/server/features";
import {
  applications,
  conversations,
  localities,
  projectMatches,
  projectSkills,
  projects,
  savedProjects,
  skills,
  users,
} from "@/server/db/schema";
import { scoreProvidersForProject } from "@/server/matching/run";

const PUBLIC_STATUSES = new Set(["open", "in_progress", "closed", "cancelled"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const loadProject = cache(async (id: string) => {
  if (!UUID_RE.test(id)) return null;
  const [row] = await db
    .select({
      project: projects,
      localityName: localities.name,
      county: localities.county,
      clientName: users.name,
      clientCreatedAt: users.createdAt,
      clientEmailVerified: sql<boolean>`${users.emailVerifiedAt} IS NOT NULL`,
      clientPhoneVerified: phoneVerifiedSql(),
      clientCompanyName: sql<string | null>`CASE WHEN ${users.companyVerifiedAt} IS NOT NULL THEN ${users.companyName} END`,
      clientProjects: sql<number>`(SELECT count(*)::int FROM projects p2 WHERE p2.client_id = ${projects.clientId} AND p2.published_at IS NOT NULL)`,
      clientCollabs: sql<number>`(SELECT count(*)::int FROM collaborations c WHERE c.client_id = ${projects.clientId} AND c.status IN ('active','completed'))`,
    })
    .from(projects)
    .innerJoin(users, eq(users.id, projects.clientId))
    .leftJoin(localities, eq(localities.id, projects.localityId))
    .where(eq(projects.id, id));
  return row ?? null;
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const row = await loadProject(id);
  if (!row || !PUBLIC_STATUSES.has(row.project.status)) return { title: "Proiect" };
  const desc = truncate(row.project.description.replace(/\s+/g, " "), 160);
  return {
    title: row.project.title,
    description: desc,
    alternates: { canonical: `/proiecte/${id}` },
    openGraph: { title: row.project.title, description: desc },
  };
}

function Fact({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 flex items-center gap-1.5 text-sm font-medium">{children}</dd>
    </div>
  );
}

function TrustRow({ ok, children, unknown }: { ok: boolean; unknown?: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      {unknown ? (
        <HelpCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      ) : ok ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
      ) : (
        <CircleDashed className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      )}
      <span className={ok || unknown ? "" : "text-muted-foreground"}>{children}</span>
    </li>
  );
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row, user] = await Promise.all([loadProject(id), getCurrentUser()]);
  if (!row) notFound();
  const p = row.project;
  const isOwner = user?.id === p.clientId;
  const isAdmin = user?.role === "admin";
  if (!PUBLIC_STATUSES.has(p.status) && !isOwner && !isAdmin) notFound();

  const catalog = await getCatalog();
  const category = catalog.byId.get(p.categoryId);
  const root = rootOf(catalog, p.categoryId);

  const [skillRows, attrDefs] = await Promise.all([
    db.select({ name: skills.name }).from(projectSkills).innerJoin(skills, eq(skills.id, projectSkills.skillId)).where(eq(projectSkills.projectId, p.id)),
    getCategoryAttributes(p.categoryId),
  ]);

  // Vizualizări (doar pentru alții decât clientul) și „văzut” pentru potrivirea prestatorului.
  if (!isOwner && (await isFirstViewToday("project", p.id, user?.id ?? null))) {
    await db.update(projects).set({ viewsCount: sql`${projects.viewsCount} + 1` }).where(eq(projects.id, p.id));
  }
  const isProvider = Boolean(user?.isProvider) && !isOwner;
  let application: { id: string; status: keyof typeof labels.applicationStatus; createdAt: Date; viewedAt: Date | null } | null = null;
  let conversationId: string | null = null;
  let usage: PlanUsage | null = null;
  let match: { score: number; reasons: { label: string; points: number; positive: boolean }[] } | undefined;
  let saved = false;

  if (user) {
    const [s] = await db
      .select()
      .from(savedProjects)
      .where(and(eq(savedProjects.userId, user.id), eq(savedProjects.projectId, p.id)));
    saved = Boolean(s);
  }
  if (isProvider && user) {
    await db
      .update(projectMatches)
      .set({ seenAt: new Date() })
      .where(and(eq(projectMatches.projectId, p.id), eq(projectMatches.providerId, user.id), isNull(projectMatches.seenAt)));
    const [a] = await db
      .select({ id: applications.id, status: applications.status, createdAt: applications.createdAt, viewedAt: applications.viewedAt })
      .from(applications)
      .where(and(eq(applications.projectId, p.id), eq(applications.providerId, user.id)));
    application = a ?? null;
    if (a) {
      const [c] = await db.select({ id: conversations.id }).from(conversations).where(eq(conversations.applicationId, a.id));
      conversationId = c?.id ?? null;
    }
    const [u, scores] = await Promise.all([getPlanUsage(user.id), p.status === "open" ? scoreProvidersForProject(p, [user.id]) : null]);
    usage = u;
    match = scores?.get(user.id);
  }

  const slotsLeft = Math.max(0, p.maxApplications - p.applicationsCount);
  const open = p.status === "open" && (!p.expiresAt || p.expiresAt > new Date());
  const where = p.workMode === "remote" ? "Remote, de oriunde" : [row.localityName, row.county].filter(Boolean).join(", ");
  const quality = p.quality;
  const attrs = Object.entries(p.attributes ?? {})
    .map(([k, v]) => {
      const def = attrDefs.find((d) => d.key === k);
      if (v === "" || v === null || v === undefined) return null;
      const value = typeof v === "boolean" ? (v ? "Da" : "Nu") : `${v}${def?.unit ? ` ${def.unit}` : ""}`;
      return { label: def?.label ?? k, value };
    })
    .filter((x): x is { label: string; value: string } => Boolean(x));
  const firstName = row.clientName.split(" ")[0];

  return (
    <div className="container-page pt-6 pb-16 sm:pt-8">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href="/proiecte" className="hover:text-foreground">Proiecte</Link>
        {root && (
          <>
            <span className="text-border-strong">/</span>
            <Link href={`/categorii/${root.slug}`} className="hover:text-foreground">{root.name}</Link>
          </>
        )}
        {category && category.id !== root?.id && (
          <>
            <span className="text-border-strong">/</span>
            <Link href={`/categorii/${category.slug}`} className="hover:text-foreground">{category.name}</Link>
          </>
        )}
      </nav>

      {!PUBLIC_STATUSES.has(p.status) && (
        <div className="mb-6 rounded-xl border border-warning/30 bg-warning/8 px-4 py-3 text-sm leading-relaxed">
          Proiectul are statusul <strong>{labels.projectStatus[p.status]}</strong> și nu este vizibil public.
          {p.moderationNote ? ` Notă: ${p.moderationNote}` : ""}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <article className="min-w-0 space-y-10">
          <header className="enter overflow-hidden rounded-[1.6rem] border bg-card shadow-sm">
            <div className="ink-panel space-y-5 p-6 sm:p-9">
              <div aria-hidden className="aurora aurora-a -top-40 -left-24 size-[460px]" />
              <div aria-hidden className="aurora aurora-b -right-32 -bottom-56 size-[420px] opacity-40" />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-white/55">
                <span
                  className={
                    open
                      ? "inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-0.5 font-medium text-emerald-300"
                      : "inline-flex items-center rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-0.5 font-medium text-white/80"
                  }
                >
                  {open && <span className="live-dot size-1.5!" />}
                  {open ? "Deschis" : labels.projectStatus[p.status]}
                </span>
                <span>Publicat {timeAgo(p.publishedAt ?? p.createdAt)}</span>
                {p.expiresAt && open && <span>Expiră pe {formatDate(p.expiresAt)}</span>}
                <span className="flex items-center gap-1 tabular-nums">
                  <Eye className="size-3.5" /> {p.viewsCount} vizualizări
                </span>
              </div>
              <h1 className="text-[1.875rem] leading-[1.08] font-semibold tracking-[-0.035em] text-balance text-white sm:text-[2.5rem]">{p.title}</h1>
              {/* Locurile de aplicare, mari: semnătura platformei */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
                <span className="flex gap-1" aria-hidden>
                  {Array.from({ length: Math.min(p.maxApplications, 15) }, (_, i) => (
                    <span
                      key={i}
                      className={
                        i < p.applicationsCount
                          ? "h-5 w-2.5 rounded-[3px] bg-[linear-gradient(180deg,#a9bcff,#5b7cff)]"
                          : "h-5 w-2.5 rounded-[3px] bg-white/12"
                      }
                    />
                  ))}
                </span>
                <span className="text-sm text-white/70 tabular-nums">
                  <strong className="font-semibold text-white">{p.applicationsCount}</strong> din {p.maxApplications} locuri ocupate
                  {open && slotsLeft > 0 && <span className="text-white/50"> · {slotsLeft === 1 ? "mai e un loc" : `mai sunt ${slotsLeft} locuri`}</span>}
                </span>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-t px-6 py-5 sm:grid-cols-3 sm:px-8">
              <Fact label="Buget" className="col-span-2 sm:col-span-1">
                <Wallet className="size-4 text-muted-foreground" />
                <span className="text-base font-semibold tabular-nums">{describeBudget(p)}</span>
              </Fact>
              <Fact label="Locație">
                <MapPin className="size-4 text-muted-foreground" /> {where || labels.workMode[p.workMode]}
              </Fact>
              <Fact label="Mod de lucru">{labels.workMode[p.workMode]}</Fact>
              <Fact label="Factură">
                <Receipt className="size-4 text-muted-foreground" /> {labels.invoice[p.invoice]}
              </Fact>
              <Fact label="Termen">
                <Zap className={p.urgency === "urgent" || p.urgency === "this_week" ? "size-4 text-warning" : "size-4 text-muted-foreground"} />
                <span className={p.urgency === "urgent" || p.urgency === "this_week" ? "text-warning" : undefined}>{labels.urgency[p.urgency]}</span>
              </Fact>
              {p.estimatedHours && <Fact label="Efort estimat">~{p.estimatedHours} ore</Fact>}
            </dl>
            {!isOwner && (
              <div className="flex flex-wrap items-center gap-2 border-t px-6 py-3 sm:px-8 print:hidden">
                {user && <SaveButton projectId={p.id} initialSaved={saved} />}
                <ReportDialog targetType="project" targetId={p.id} signedIn={Boolean(user)} />
              </div>
            )}
          </header>

          {quality?.summary && (
            <section className="reveal space-y-3 rounded-2xl border border-brand/20 bg-brand-soft p-5 sm:p-7">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="size-4 text-brand" /> <span className="text-gradient">Pe scurt, de la AI</span>
                </div>
                <p className="text-sm leading-relaxed">{quality.summary}</p>
                {quality.budgetInsight && (
                  <div className="flex items-start gap-2.5 rounded-lg border bg-card p-3 text-sm leading-relaxed">
                    <Lightbulb className="mt-0.5 size-4 shrink-0 text-warning" />
                    <span>
                      <strong>Observație buget:</strong> {quality.budgetInsight}
                    </span>
                  </div>
                )}
                {quality.questions.length > 0 && (
                  <div className="text-sm">
                    <div className="font-medium">Întrebări utile înainte de ofertă</div>
                    <ul className="mt-1.5 list-disc space-y-1 pl-5 leading-relaxed text-muted-foreground">
                      {quality.questions.slice(0, 3).map((q) => (
                        <li key={q}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-[1.375rem] font-semibold tracking-[-0.025em]">Descriere</h2>
            <div className="max-w-prose text-[0.9375rem] leading-[1.7] [overflow-wrap:anywhere] whitespace-pre-line text-foreground/90">{p.description}</div>
          </section>

          {(skillRows.length > 0 || attrs.length > 0 || p.startDate || p.durationText) && (
            <section className="grid gap-4 sm:grid-cols-2">
              {skillRows.length > 0 && (
                <div className="space-y-3 rounded-xl border bg-card p-5 shadow-xs">
                  <h3 className="eyebrow">Competențe căutate</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {skillRows.map((s) => (
                      <Badge key={s.name} variant="secondary">{s.name}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {(attrs.length > 0 || p.startDate || p.durationText) && (
                <div className="space-y-3 rounded-xl border bg-card p-5 shadow-xs">
                  <h3 className="eyebrow">Detalii</h3>
                  <dl className="divide-y text-sm">
                    {p.startDate && (
                      <div className="flex justify-between gap-3 py-2 first:pt-0 last:pb-0">
                        <dt className="text-muted-foreground">Data de început</dt>
                        <dd className="font-medium">{formatDate(p.startDate)}</dd>
                      </div>
                    )}
                    {p.durationText && (
                      <div className="flex justify-between gap-3 py-2 first:pt-0 last:pb-0">
                        <dt className="text-muted-foreground">Durată</dt>
                        <dd className="font-medium">{p.durationText}</dd>
                      </div>
                    )}
                    {attrs.map((a) => (
                      <div key={a.label} className="flex justify-between gap-3 py-2 first:pt-0 last:pb-0">
                        <dt className="text-muted-foreground">{a.label}</dt>
                        <dd className="text-right font-medium">{a.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-[1.375rem] font-semibold tracking-[-0.025em]">Despre client</h2>
            <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-5 shadow-xs">
            <div className="flex size-11 items-center justify-center rounded-full bg-secondary font-semibold text-secondary-foreground">{firstName[0]?.toUpperCase()}</div>
            <div className="min-w-0 flex-1 text-sm">
              <div className="flex items-center gap-1.5 font-semibold">
                {firstName}
                {row.clientPhoneVerified && <BadgeCheck className="size-4 text-success" aria-label="Telefon verificat" />}
              </div>
              <div className="mt-0.5 text-muted-foreground">
                Membru din {formatDate(row.clientCreatedAt, "MMMM yyyy")} · {row.clientProjects} {row.clientProjects === 1 ? "proiect publicat" : "proiecte publicate"}
                {row.clientCollabs > 0 && ` · ${row.clientCollabs} colaborări`}
              </div>
            </div>
            </div>
          </section>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Calitatea oportunității</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                <TrustRow ok={row.clientEmailVerified}>Email confirmat</TrustRow>
                {features.phoneVerification && (
                  <TrustRow ok={row.clientPhoneVerified}>{row.clientPhoneVerified ? "Telefon verificat" : "Telefon neverificat"}</TrustRow>
                )}
                {row.clientCompanyName && <TrustRow ok>Firmă verificată ANAF: {row.clientCompanyName}</TrustRow>}
                <TrustRow ok={p.budgetType !== "unknown" && Boolean(p.budgetMax ?? p.budgetMin)}>
                  {p.budgetType !== "unknown" && (p.budgetMax ?? p.budgetMin) ? "Buget completat" : "Buget nedeclarat"}
                </TrustRow>
                <TrustRow ok={open}>{open ? "Proiect activ" : "Proiectul nu mai acceptă oferte"}</TrustRow>
                <TrustRow ok={slotsLeft > 0}>
                  {p.applicationsCount} din {p.maxApplications} locuri de aplicare ocupate
                </TrustRow>
                {quality && <TrustRow ok={quality.score >= 70}>Claritatea cererii: {quality.score}/100</TrustRow>}
              </ul>
              <div className="rounded-lg border bg-surface p-3.5 text-xs leading-relaxed text-muted-foreground dark:bg-muted/40">
                <div className="mb-1 font-medium text-foreground">Ce nu am verificat</div>
                Nu verificăm identitatea clientului, adresa exactă sau existența fondurilor. Clarifică detaliile în chat înainte să începi lucrul.
              </div>
              {p.allowAutoBids ? null : <p className="text-xs text-muted-foreground">Clientul nu acceptă aplicări automate (Auto Bid).</p>}
            </CardContent>
          </Card>

          <div className={open && !isOwner && !application ? "ring-glow scroll-mt-20 rounded-xl" : "scroll-mt-20"} id="aplica">
          <Card className="shadow-md">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center justify-between gap-2">
                {isOwner ? "Proiectul tău" : application ? "Aplicarea ta" : "Trimite o ofertă"}
                {match && <ScoreBadge score={match.score} />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {match && (
                <ul className="space-y-1.5 rounded-lg border bg-surface p-3 text-xs dark:bg-muted/40">
                  {match.reasons.slice(0, 6).map((r) => (
                    <li key={r.label} className="flex items-center gap-1.5">
                      {r.positive ? <CheckCircle2 className="size-3.5 text-brand" /> : <XCircle className="size-3.5 text-muted-foreground" />}
                      <span className={r.positive ? "" : "text-muted-foreground"}>{r.label}</span>
                    </li>
                  ))}
                </ul>
              )}

              {isOwner ? (
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Ai primit {p.applicationsCount} {p.applicationsCount === 1 ? "ofertă" : "oferte"}.
                  </p>
                  <Button asChild className="w-full">
                    <Link href={`/proiectele-mele/${p.id}`}>Gestionează ofertele</Link>
                  </Button>
                </div>
              ) : application ? (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={application.status === "hired" ? "success" : "secondary"}>{labels.applicationStatus[application.status]}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="size-3.5" /> Trimisă</span>
                    <span className="text-foreground">{timeAgo(application.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="size-3.5" /> Citită</span>
                    <span className="text-foreground">{application.viewedAt ? timeAgo(application.viewedAt) : "încă nu"}</span>
                  </div>
                  {conversationId && (
                    <Button asChild className="w-full">
                      <Link href={`/mesaje/${conversationId}`}>Deschide conversația</Link>
                    </Button>
                  )}
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/aplicarile-mele">Toate aplicările mele</Link>
                  </Button>
                </div>
              ) : !open ? (
                <p className="text-sm text-muted-foreground">
                  {p.status === "in_progress"
                    ? "Clientul a ales deja un prestator pentru acest proiect."
                    : "Proiectul nu mai acceptă oferte."}{" "}
                  <Link href="/proiecte" className="font-medium text-brand underline-offset-4 hover:underline">Vezi alte proiecte</Link>
                </p>
              ) : slotsLeft === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Toate cele {p.maxApplications} locuri de aplicare sunt ocupate. Clientul poate redeschide selecția.
                </p>
              ) : !user ? (
                <div className="space-y-3 text-sm">
                  <p className="leading-relaxed text-muted-foreground">
                    Creează un profil gratuit de prestator și aplici gratuit la până la {freePlan.monthlyApplications} proiecte pe lună.
                  </p>
                  <Button asChild className="w-full">
                    <Link href={`/inregistrare?rol=prestator`}>Creează profil de prestator</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/autentificare?next=/proiecte/${p.id}`}>Am deja cont</Link>
                  </Button>
                </div>
              ) : !user.isProvider ? (
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">Pentru a trimite oferte, activează profilul de prestator.</p>
                  <Button asChild className="w-full">
                    <Link href="/onboarding?rol=prestator">Devino prestator</Link>
                  </Button>
                </div>
              ) : !user.emailVerifiedAt ? (
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">Confirmă-ți adresa de email ca să poți aplica.</p>
                  <Button asChild className="w-full">
                    <Link href="/verifica-email">Confirmă emailul</Link>
                  </Button>
                </div>
              ) : (
                usage && (
                  <ApplyPanel
                    projectId={p.id}
                    remaining={usage.remaining}
                    limit={usage.limit}
                    planName={usage.plan.name}
                    renewsOn={formatDate(usage.periodEnd)}
                  />
                )
              )}
            </CardContent>
          </Card>
          </div>

          <div className="flex items-start gap-2 px-1 text-xs leading-relaxed text-muted-foreground">
            <Users className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Maximum {p.maxApplications} oferte per proiect, ca fiecare ofertă să fie citită.
              {p.allowAutoBids && ` Cel mult ${p.maxAutoApplications} pot fi automate.`}
            </span>
          </div>
          {p.startDate && (
            <div className="flex items-start gap-2 px-1 text-xs leading-relaxed text-muted-foreground">
              <CalendarClock className="mt-0.5 size-3.5 shrink-0" />
              <span>Începere dorită: {formatDate(p.startDate)}</span>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
