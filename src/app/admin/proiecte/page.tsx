import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import Link from "next/link";
import { SubmitButton } from "@/components/forms/submit-button";
import { EmptyState } from "@/components/shared/empty-state";
import { NativeSelect } from "@/components/shared/native-select";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { labels } from "@/config/site";
import { describeBudget, formatDateTime } from "@/lib/format";
import { truncate } from "@/lib/text";
import { db } from "@/server/db";
import { categories, projects, users } from "@/server/db/schema";
import { ActionForm } from "../_components/action-form";
import { approveProjectAction, removeProjectAction } from "./actions";

const STATUSES = Object.keys(labels.projectStatus) as (keyof typeof labels.projectStatus)[];

export default async function AdminProjectsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q, status } = await searchParams;
  const where: (SQL | undefined)[] = [];
  if (q) where.push(or(ilike(projects.title, `%${q}%`), ilike(users.email, `%${q}%`), sql`${projects.id}::text = ${q}`));
  if (status && STATUSES.includes(status as never)) where.push(eq(projects.status, status as (typeof STATUSES)[number]));

  const select = {
    project: projects,
    clientName: users.name,
    clientEmail: users.email,
    clientVerified: sql<boolean>`${users.emailVerifiedAt} IS NOT NULL`,
    categoryName: categories.name,
  };
  const [pending, rows] = await Promise.all([
    db
      .select(select)
      .from(projects)
      .innerJoin(users, eq(users.id, projects.clientId))
      .innerJoin(categories, eq(categories.id, projects.categoryId))
      .where(eq(projects.status, "pending_review"))
      .orderBy(desc(projects.updatedAt))
      .limit(100),
    db
      .select(select)
      .from(projects)
      .innerJoin(users, eq(users.id, projects.clientId))
      .innerJoin(categories, eq(categories.id, projects.categoryId))
      .where(and(...where))
      .orderBy(desc(projects.createdAt))
      .limit(100),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader title="Proiecte & moderare" description="Aprobă proiectele semnalate sau elimină-le (aplicările prestatorilor sunt restituite automat)." className="pt-0" />

      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-[-0.01em]">Coada de moderare ({pending.length})</h2>
        {pending.length === 0 ? (
          <EmptyState title="Nimic de moderat" description="Proiectele semnalate automat (duplicat, conținut, volum suspect) apar aici." />
        ) : (
          pending.map((r) => <ProjectRow key={r.project.id} r={r} moderation />)
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-[-0.01em]">Toate proiectele</h2>
        <form className="flex flex-col gap-2 sm:flex-row">
          <Input name="q" defaultValue={q} placeholder="Caută după titlu, email client sau ID" className="sm:max-w-sm" />
          <div className="sm:w-48">
            <NativeSelect name="status" defaultValue={status ?? ""}>
              <option value="">Orice status</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {labels.projectStatus[s]}
                </option>
              ))}
            </NativeSelect>
          </div>
          <Button type="submit" variant="outline">Filtrează</Button>
        </form>
        {rows.length === 0 ? <EmptyState title="Niciun proiect găsit" /> : rows.map((r) => <ProjectRow key={r.project.id} r={r} />)}
      </section>
    </div>
  );
}

type Row = {
  project: typeof projects.$inferSelect;
  clientName: string;
  clientEmail: string;
  clientVerified: boolean;
  categoryName: string;
};

function ProjectRow({ r, moderation }: { r: Row; moderation?: boolean }) {
  const p = r.project;
  const removable = p.status !== "removed";
  return (
    <div className="min-w-0 rounded-2xl border bg-card p-5 shadow-xs [overflow-wrap:anywhere]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/proiecte/${p.id}`} className="font-medium underline-offset-4 hover:underline">
              {p.title}
            </Link>
            <Badge variant={p.status === "pending_review" ? "warning" : "secondary"}>{labels.projectStatus[p.status]}</Badge>
            {p.source === "import" && <Badge variant="outline">Import</Badge>}
            {p.moderationLock && <Badge variant="destructive">Blocat după raportări</Badge>}
          </div>
          <div className="text-xs text-muted-foreground">
            {r.categoryName} · {describeBudget(p)} · {labels.workMode[p.workMode]} · {p.applicationsCount}/{p.maxApplications} aplicări ·{" "}
            {formatDateTime(p.createdAt)}
          </div>
          <div className="text-xs text-muted-foreground">
            Client:{" "}
            <Link href={`/admin/utilizatori?q=${encodeURIComponent(r.clientEmail)}`} className="font-medium text-brand underline-offset-4 hover:underline">
              {r.clientName} ({r.clientEmail})
            </Link>{" "}
            {r.clientVerified ? "· email confirmat" : "· email neconfirmat"}
          </div>
          {p.moderationNote && <div className="text-sm text-destructive">Motiv: {p.moderationNote}</div>}
          <p className="text-sm text-muted-foreground">{truncate(p.description, moderation ? 600 : 180)}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-start gap-3">
        {(p.status === "pending_review" || p.status === "draft") && (
          <ActionForm action={approveProjectAction}>
            <input type="hidden" name="projectId" value={p.id} />
            <SubmitButton size="sm" pendingText="Se aprobă…">Aprobă și publică</SubmitButton>
          </ActionForm>
        )}
        {removable && (
          <ActionForm action={removeProjectAction} className="flex-1">
            <input type="hidden" name="projectId" value={p.id} />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input name="reason" placeholder="Motiv (ex: proiect fals, duplicat, spam)" required className="sm:max-w-sm" />
              <SubmitButton size="sm" variant="destructive" pendingText="Se elimină…">
                Elimină + restituie aplicările
              </SubmitButton>
            </div>
          </ActionForm>
        )}
      </div>
    </div>
  );
}
