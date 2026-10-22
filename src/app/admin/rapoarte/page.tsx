import { and, desc, eq, inArray, sql } from "drizzle-orm";
import Link from "next/link";
import { SubmitButton } from "@/components/forms/submit-button";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/format";
import { truncate } from "@/lib/text";
import { db } from "@/server/db";
import { applications, messages, projects, reports, reviews, users } from "@/server/db/schema";
import { ActionForm } from "../_components/action-form";
import { approveProjectAction } from "../proiecte/actions";
import { quickActionAction, resolveReportAction } from "./actions";

const REASONS: Record<string, string> = {
  spam: "Spam",
  fraud: "Fraudă",
  fake_project: "Proiect fals",
  duplicate: "Duplicat",
  abusive: "Limbaj abuziv",
  inappropriate: "Conținut nepotrivit",
  other: "Altceva",
};
const TARGETS: Record<string, string> = { project: "Proiect", user: "Utilizator", application: "Aplicare", message: "Mesaj", review: "Recenzie" };

type Target = { summary: string; href?: string; ownerId?: string; projectId?: string };

async function loadTargets(rows: (typeof reports.$inferSelect)[]) {
  const ids = (t: string) => rows.filter((r) => r.targetType === t).map((r) => r.targetId);
  const uuid = (arr: string[]) => arr.filter((x) => /^[0-9a-f-]{36}$/i.test(x));
  const map = new Map<string, Target>();
  const [ps, us, apps, msgs, revs] = await Promise.all([
    uuid(ids("project")).length ? db.select({ id: projects.id, title: projects.title, clientId: projects.clientId, status: projects.status }).from(projects).where(inArray(projects.id, uuid(ids("project")))) : [],
    uuid(ids("user")).length ? db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, uuid(ids("user")))) : [],
    uuid(ids("application")).length
      ? db.select({ id: applications.id, message: applications.message, providerId: applications.providerId, projectId: applications.projectId }).from(applications).where(inArray(applications.id, uuid(ids("application"))))
      : [],
    uuid(ids("message")).length ? db.select({ id: messages.id, body: messages.body, senderId: messages.senderId }).from(messages).where(inArray(messages.id, uuid(ids("message")))) : [],
    uuid(ids("review")).length ? db.select({ id: reviews.id, comment: reviews.comment, rating: reviews.rating, authorId: reviews.authorId, hidden: reviews.hiddenByAdmin }).from(reviews).where(inArray(reviews.id, uuid(ids("review")))) : [],
  ]);
  for (const p of ps) map.set(`project:${p.id}`, { summary: `${p.title} (${p.status})`, href: `/proiecte/${p.id}`, ownerId: p.clientId, projectId: p.id });
  for (const u of us) map.set(`user:${u.id}`, { summary: `${u.name} · ${u.email}`, href: `/admin/utilizatori?q=${encodeURIComponent(u.email)}`, ownerId: u.id });
  for (const a of apps) map.set(`application:${a.id}`, { summary: truncate(a.message, 400), href: `/proiecte/${a.projectId}`, ownerId: a.providerId });
  for (const m of msgs) map.set(`message:${m.id}`, { summary: truncate(m.body, 600), ownerId: m.senderId ?? undefined });
  for (const r of revs) map.set(`review:${r.id}`, { summary: `${r.rating}★ ${truncate(r.comment, 400)}${r.hidden ? " (ascunsă)" : ""}`, ownerId: r.authorId });
  return map;
}

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<{ toate?: string }> }) {
  const { toate } = await searchParams;
  const rows = await db
    .select({ report: reports, reporterName: users.name, reporterEmail: users.email })
    .from(reports)
    .leftJoin(users, eq(users.id, reports.reporterId))
    .where(toate ? undefined : eq(reports.status, "open"))
    .orderBy(desc(reports.createdAt))
    .limit(100);
  const targets = await loadTargets(rows.map((r) => r.report));
  // Proiectele ascunse automat după raportări: clientul nu le poate retrimite, doar un administrator decide.
  const locked = await db
    .select({
      id: projects.id,
      title: projects.title,
      updatedAt: projects.updatedAt,
      openReports: sql<number>`(SELECT count(*)::int FROM reports r WHERE r.target_type = 'project' AND r.target_id = ${projects.id}::text AND r.status = 'open')`,
    })
    .from(projects)
    .where(and(eq(projects.status, "pending_review"), eq(projects.moderationLock, true)))
    .orderBy(desc(projects.updatedAt))
    .limit(50);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Raportări"
        description="Semnalări de la utilizatori: fraudă, spam, conținut abuziv."
        className="pt-0"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={toate ? "/admin/rapoarte" : "/admin/rapoarte?toate=1"}>{toate ? "Doar deschise" : "Toate raportările"}</Link>
          </Button>
        }
      />
      {locked.length > 0 && (
        <section className="space-y-3 rounded-2xl border border-warning/40 bg-warning/5 p-5">
          <h2 className="text-base font-semibold tracking-[-0.01em]">Proiecte blocate după raportări ({locked.length})</h2>
          <p className="text-sm text-muted-foreground">
            Ascunse automat după raportări de la utilizatori verificați. Aprobă-le dacă raportările nu se confirmă (raportările se închid automat) sau
            elimină-le din raportările de mai jos.
          </p>
          {locked.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
              <div className="min-w-0 text-sm">
                <Link href={`/proiecte/${p.id}`} className="font-medium underline-offset-4 hover:underline">
                  {p.title}
                </Link>
                <div className="text-xs text-muted-foreground">
                  {p.openReports} raportări deschise · blocat pe {formatDateTime(p.updatedAt)}
                </div>
              </div>
              <ActionForm action={approveProjectAction}>
                <input type="hidden" name="projectId" value={p.id} />
                <SubmitButton size="sm" variant="outline" pendingText="Se aprobă…">
                  Aprobă și republică
                </SubmitButton>
              </ActionForm>
            </div>
          ))}
        </section>
      )}
      {rows.length === 0 ? (
        <EmptyState title="Nicio raportare deschisă" description="Totul e liniștit." />
      ) : (
        rows.map(({ report: r, reporterName, reporterEmail }) => {
          const t = targets.get(`${r.targetType}:${r.targetId}`);
          return (
            <div key={r.id} className="space-y-4 rounded-2xl border bg-card p-5 shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="destructive">{REASONS[r.reason] ?? r.reason}</Badge>
                <Badge variant="outline">{TARGETS[r.targetType]}</Badge>
                {r.status !== "open" && <Badge variant="secondary">{r.status === "resolved" ? "Rezolvată" : "Respinsă"}</Badge>}
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(r.createdAt)} · de la {reporterName ? `${reporterName} (${reporterEmail})` : "anonim"}
                </span>
              </div>
              <div className="rounded-lg border bg-surface p-3.5 text-sm dark:bg-muted/30">
                {t ? (
                  t.href ? (
                    <Link href={t.href} className="underline-offset-4 hover:underline">
                      {t.summary}
                    </Link>
                  ) : (
                    <span className="whitespace-pre-wrap">{t.summary}</span>
                  )
                ) : (
                  <span className="text-muted-foreground">Ținta nu mai există ({r.targetId})</span>
                )}
              </div>
              {r.details && <p className="text-sm">„{r.details}”</p>}
              {r.resolution && <p className="text-xs text-muted-foreground">Rezoluție: {r.resolution}</p>}

              {r.status === "open" && (
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                  <ActionForm action={resolveReportAction} className="flex-1">
                    <input type="hidden" name="reportId" value={r.id} />
                    <Input name="resolution" placeholder="Notă de rezoluție (opțional)" />
                    <div className="flex gap-2">
                      <SubmitButton size="sm" name="status" value="resolved">Marchează rezolvată</SubmitButton>
                      <SubmitButton size="sm" variant="outline" name="status" value="dismissed">Respinge</SubmitButton>
                    </div>
                  </ActionForm>
                  {t && (r.targetType === "project" || r.targetType === "review") && (
                    <ActionForm action={quickActionAction} className="flex-1">
                      <input type="hidden" name="reportId" value={r.id} />
                      <input type="hidden" name="targetId" value={r.targetId} />
                      <Input name="reason" placeholder="Motiv pentru acțiune" />
                      <div className="flex flex-wrap gap-2">
                        {r.targetType === "project" && (
                          <SubmitButton size="sm" variant="destructive" name="kind" value="remove_project">
                            Elimină proiectul
                          </SubmitButton>
                        )}
                        {r.targetType === "review" && (
                          <SubmitButton size="sm" variant="destructive" name="kind" value="hide_review">
                            Ascunde recenzia
                          </SubmitButton>
                        )}
                      </div>
                    </ActionForm>
                  )}
                  {t?.ownerId && (
                    <ActionForm action={quickActionAction}>
                      <input type="hidden" name="reportId" value={r.id} />
                      <input type="hidden" name="targetId" value={t.ownerId} />
                      <input type="hidden" name="reason" value={`Raportare: ${REASONS[r.reason]}`} />
                      <SubmitButton size="sm" variant="ghost" name="kind" value="ban_user">
                        Suspendă autorul
                      </SubmitButton>
                    </ActionForm>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
