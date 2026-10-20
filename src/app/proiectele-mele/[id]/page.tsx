import { desc, eq, sql } from "drizzle-orm";
import { ArrowLeft, CalendarClock, CheckCircle2, Clock, Eye, Inbox, MailWarning, MapPin, ShieldAlert, Target, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ComparePanel } from "@/components/manage-project/compare-panel";
import { OffersList } from "@/components/manage-project/offers-list";
import { ProjectControls } from "@/components/manage-project/project-controls";
import { SharePanel } from "@/components/manage-project/share-panel";
import type { OfferView } from "@/components/manage-project/types";
import { QualityPanel } from "@/components/project-form/quality-panel";
import { cssVars } from "@/components/home/css-vars";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { labels, rules } from "@/config/site";
import { describeBudget, formatDate, timeAgo } from "@/lib/format";
import { markApplicationViewed } from "@/server/applications/service";
import { cn } from "@/lib/utils";
import { requireOnboardedUser } from "@/server/auth/guards";
import { getLocality } from "@/server/catalog/localities";
import { categoryPath, getCatalog } from "@/server/catalog/taxonomy";
import { db } from "@/server/db";
import { applications, conversations, projectMatches, projects, providerProfiles, users } from "@/server/db/schema";
import { env } from "@/server/env";

export const metadata: Metadata = { title: "Gestionează proiectul" };

/** Minute rămase până la o dată (0 dacă a trecut). Calculat pe server, la fiecare request. */
function minutesUntil(d: Date | null) {
  if (!d) return 0;
  const diff = d.getTime() - new Date().getTime();
  return diff > 0 ? Math.ceil(diff / 60_000) : 0;
}

export default async function ManageProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ publicat?: string; verificare?: string; ciorna?: string; contact?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireOnboardedUser(`/proiectele-mele/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [p] = await db.select().from(projects).where(eq(projects.id, id));
  if (!p || p.clientId !== user.id) notFound();

  const [catalog, loc, rows, [{ matches }]] = await Promise.all([
    getCatalog(),
    p.localityId ? getLocality(p.localityId) : Promise.resolve(null),
    db
      .select({
        app: applications,
        name: users.name,
        avatarPath: users.avatarPath,
        issuesInvoice: users.issuesInvoice,
        legalEntity: users.legalEntity,
        phoneVerified: sql<boolean>`${users.phoneVerifiedAt} IS NOT NULL`,
        slug: providerProfiles.slug,
        headline: providerProfiles.headline,
        ratingAvg: providerProfiles.ratingAvg,
        ratingCount: providerProfiles.ratingCount,
        completedCount: providerProfiles.completedCount,
        distanceKm: sql<number | null>`ST_Distance(${providerProfiles.geo}, (SELECT geo FROM projects WHERE id = ${p.id})) / 1000`,
        conversationId: conversations.id,
      })
      .from(applications)
      .innerJoin(users, eq(users.id, applications.providerId))
      .leftJoin(providerProfiles, eq(providerProfiles.userId, applications.providerId))
      .leftJoin(conversations, eq(conversations.applicationId, applications.id))
      .where(eq(applications.projectId, p.id))
      .orderBy(desc(applications.createdAt)),
    db.select({ matches: sql<number>`count(*)::int` }).from(projectMatches).where(eq(projectMatches.projectId, p.id)),
  ]);

  // Clientul vede lista → ofertele noi devin „citite” (prestatorii primesc confirmarea).
  const unseen = rows.filter((r) => !r.app.viewedAt && r.app.status === "submitted");
  await Promise.allSettled(unseen.map((r) => markApplicationViewed(r.app.id, user.id)));

  const offers: OfferView[] = rows.map((r) => ({
    id: r.app.id,
    status: r.app.status,
    message: r.app.message,
    priceAmount: r.app.priceAmount,
    priceType: r.app.priceType,
    estimatedDays: r.app.estimatedDays,
    isAuto: r.app.isAuto,
    boosted: Boolean(r.app.boostedAt),
    isNew: !r.app.viewedAt,
    createdAt: r.app.createdAt.toISOString(),
    conversationId: r.conversationId,
    rejectionReason: r.app.rejectionReason,
    provider: {
      id: r.app.providerId,
      name: r.name,
      avatarPath: r.avatarPath,
      slug: r.slug,
      headline: r.headline,
      ratingAvg: r.ratingAvg,
      ratingCount: r.ratingCount ?? 0,
      completedCount: r.completedCount ?? 0,
      issuesInvoice: r.issuesInvoice,
      legalEntity: r.legalEntity,
      phoneVerified: r.phoneVerified,
      distanceKm: r.distanceKm === null ? null : Number(r.distanceKm),
    },
  }));
  const activeCount = offers.filter((o) => ["submitted", "viewed", "shortlisted"].includes(o.status)).length;
  const names = Object.fromEntries(offers.map((o) => [o.id, o.provider.name]));

  const where = p.workMode === "remote" ? "Remote" : [loc?.name, loc?.countyCode].filter(Boolean).join(", ");
  const full = p.applicationsCount >= p.maxApplications;
  const publicUrl = `${env.APP_URL}/proiecte/${p.id}?utm_source=share`;
  const autoOpensIn = minutesUntil(p.autoBidOpensAt);

  return (
    <div className="container-page pb-16">
      <div className="pt-6 sm:pt-8">
        <Link href="/proiectele-mele" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" /> Proiectele mele
        </Link>
      </div>

      {sp.publicat && (
        <section className="ink-panel enter mt-5 rounded-[1.75rem] dark:ring-1 dark:ring-white/8">
          <div aria-hidden className="aurora aurora-b -top-40 -right-20 size-[420px] opacity-40" />
          <div aria-hidden className="aurora aurora-a -bottom-48 -left-24 size-[420px] opacity-40" />
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
            <span className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/12 text-emerald-300 ring-1 ring-emerald-300/25">
              <span aria-hidden className="absolute -inset-3 rounded-3xl bg-emerald-400/15 blur-xl" />
              <CheckCircle2 className="relative size-7" />
            </span>
            <div>
              <div className="text-[1.5rem] leading-tight font-semibold tracking-[-0.025em] text-white sm:text-[1.75rem]">
                Proiectul este <span className="serif-em text-gradient-ink">publicat</span>!
              </div>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/65">
                Prestatorii compatibili sunt anunțați acum. Te notificăm pe email la fiecare ofertă. Ca să primești oferte mai repede, distribuie-l în
                grupurile în care ești activ.
              </p>
            </div>
          </div>
        </section>
      )}
      {(sp.verificare || p.status === "pending_review") && (
        <div className="enter mt-5 flex gap-3 rounded-2xl border border-warning/30 bg-warning/8 p-4 text-sm leading-relaxed sm:p-5">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-warning" />
          <div>
            <div className="font-semibold">Proiectul este în verificare</div>
            <p className="text-muted-foreground">
              Verificăm automat proiectele ca să protejăm prestatorii de cereri false. De obicei durează puțin; te anunțăm imediat ce e publicat.
              {p.moderationNote ? ` Motiv: ${p.moderationNote}.` : ""}
            </p>
          </div>
        </div>
      )}
      {sp.ciorna && p.status === "draft" && (
        <div className="mt-5 rounded-2xl border bg-card p-4 text-sm leading-relaxed shadow-xs">Ciorna a fost salvată. O poți publica oricând de aici.</div>
      )}
      {p.status === "draft" && !user.emailVerifiedAt && (
        <div className="mt-5 flex gap-3 rounded-xl border border-warning/30 bg-warning/8 p-4 text-sm leading-relaxed">
          <MailWarning className="mt-0.5 size-5 shrink-0 text-warning" />
          <p>
            Confirmă adresa de email ca să poți publica proiectul.{" "}
            <Link href="/verifica-email" className="font-medium underline underline-offset-4">Retrimite emailul de confirmare</Link>
          </p>
        </div>
      )}
      {sp.contact && (
        <div className="mt-5 rounded-2xl border bg-card p-4 text-sm leading-relaxed shadow-xs">
          Am ascuns datele de contact din descriere. Prestatorii vă vor contacta prin chat-ul platformei.
        </div>
      )}

      <div className="enter flex flex-col gap-5 pt-6 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant={p.status === "open" ? "brand" : p.status === "removed" ? "destructive" : p.status === "pending_review" ? "warning" : "secondary"}>{labels.projectStatus[p.status]}</Badge>
            <span>{categoryPath(catalog, p.categoryId)}</span>
            {p.publishedAt && <span>Publicat {timeAgo(p.publishedAt)}</span>}
          </div>
          <h1 className="text-[1.875rem] leading-[1.1] font-semibold tracking-[-0.032em] text-balance sm:text-[2.375rem]">{p.title}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">{describeBudget(p)}</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" /> {where || labels.workMode[p.workMode]}
            </span>
            <span>{labels.invoice[p.invoice]}</span>
            <span>{labels.urgency[p.urgency]}</span>
          </div>
        </div>
        <ProjectControls projectId={p.id} status={p.status} canReopen={full && p.maxApplications < rules.maxApplicationsCap} allowAutoBids={p.allowAutoBids} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-5">
          <section className="enter overflow-hidden rounded-2xl border bg-card shadow-xs" style={cssVars({ i: 1 })} aria-label="Starea proiectului">
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Users className="size-3.5" /> Locuri pentru oferte
                  {p.status === "open" && !full && <span className="live-dot ml-1 size-1.5! text-success" aria-label="deschis" />}
                </div>
                <div className="text-sm text-muted-foreground tabular-nums">
                  <span className="text-[1.75rem] leading-none font-semibold tracking-[-0.03em] text-foreground">{p.applicationsCount}</span> / {p.maxApplications}{" "}
                  oferte primite
                </div>
              </div>
              <div className="mt-4 flex gap-1.5" aria-hidden>
                {Array.from({ length: p.maxApplications }, (_, k) => (
                  <span key={k} className={cn("h-2.5 flex-1 rounded-full", k < p.applicationsCount ? "bg-gradient-to-r from-primary to-brand" : "bg-muted dark:bg-secondary")} />
                ))}
              </div>
            </div>
            <dl className="grid grid-cols-3 border-t text-sm">
              {[
                { icon: Target, v: String(matches), l: "prestatori compatibili" },
                { icon: Eye, v: String(p.viewsCount), l: "vizualizări" },
                {
                  icon: CalendarClock,
                  v: p.status === "open" && p.expiresAt ? formatDate(p.expiresAt, "d MMM") : "—",
                  l: p.status === "open" ? "expiră" : "expirare",
                },
              ].map((x, n) => (
                <div key={x.l} className={cn("px-5 py-4 sm:px-6", n > 0 && "border-l")}>
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <x.icon className="size-3.5 shrink-0" /> <span className="truncate">{x.l}</span>
                  </dt>
                  <dd className="mt-1.5 text-lg font-semibold tracking-[-0.02em] tabular-nums">{x.v}</dd>
                </div>
              ))}
            </dl>
          </section>

          {full && p.status === "open" && (
            <p className="rounded-lg border bg-surface px-4 py-3 text-sm leading-relaxed dark:bg-muted/40">
              Toate cele {p.maxApplications} locuri sunt ocupate. Dacă vrei mai multe variante, apasă „Încă 5 locuri”.
            </p>
          )}
          {p.status === "open" && p.allowAutoBids && autoOpensIn > 0 && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5" /> Aplicările automate se deschid în ~{autoOpensIn} minute (primele minute sunt rezervate aplicărilor manuale).
            </p>
          )}

          <div className="flex items-end justify-between gap-2 pt-4">
            <h2 className="text-[1.375rem] font-semibold tracking-[-0.022em]">Oferte {offers.length > 0 && <span className="font-normal text-muted-foreground tabular-nums">({offers.length})</span>}</h2>
          </div>

          {offers.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title={p.status === "draft" ? "Publică proiectul ca să primești oferte" : "Încă nu ai primit oferte"}
              description={
                p.status === "open"
                  ? "Prestatorii compatibili au fost anunțați. Primele oferte vin de obicei în câteva ore. Între timp, distribuie proiectul."
                  : undefined
              }
            />
          ) : (
            <>
              {activeCount >= 2 && <ComparePanel projectId={p.id} names={names} />}
              <OffersList offers={offers} projectOpen={p.status === "open"} />
            </>
          )}
        </div>

        <aside className="min-w-0 space-y-4">
          {p.status === "open" && <SharePanel projectId={p.id} publicUrl={publicUrl} initialText={p.shareText} />}
          {p.quality && <QualityPanel quality={p.quality} compact={p.status !== "draft"} />}
          <div className="space-y-3 rounded-2xl border bg-card p-5 text-sm shadow-xs">
            <div className="eyebrow">Descriere</div>
            <p className="line-clamp-[12] leading-relaxed whitespace-pre-line text-muted-foreground">{p.description}</p>
            {p.status === "open" && (
              <Button asChild variant="link" className="font-medium">
                <Link href={`/proiecte/${p.id}`}>Vezi cum o văd prestatorii →</Link>
              </Button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
