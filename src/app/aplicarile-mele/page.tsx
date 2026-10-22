import { desc, eq, inArray } from "drizzle-orm";
import { Bot, CheckCircle2, Circle, Eye, Inbox, ListChecks, Send, Sparkles, Trophy, Undo2, XCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { cssVars } from "@/components/home/css-vars";
import { ContactDetails } from "@/components/shared/contact-details";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { labels } from "@/config/site";
import { describeBudget, formatDateTime, formatLei, timeAgo } from "@/lib/format";
import { truncate } from "@/lib/text";
import { cn } from "@/lib/utils";
import { requireProvider } from "@/server/auth/guards";
import { counterpartContacts } from "@/server/contact";
import { db } from "@/server/db";
import { applicationEvents, applications, conversations, projects } from "@/server/db/schema";
import { providerStats } from "@/server/insights";
import { ChatLink, WithdrawButton } from "./application-actions";

export const metadata: Metadata = { title: "Aplicările mele" };

type Row = Awaited<ReturnType<typeof loadApplications>>[number];

async function loadApplications(providerId: string) {
  const rows = await db
    .select({ app: applications, project: projects })
    .from(applications)
    .innerJoin(projects, eq(projects.id, applications.projectId))
    .where(eq(applications.providerId, providerId))
    .orderBy(desc(applications.createdAt))
    .limit(200);
  const ids = rows.map((r) => r.app.id);
  const hiredIds = rows.filter((r) => r.app.status === "hired").map((r) => r.app.id);
  const [events, convs, contacts] = await Promise.all([
    ids.length ? db.select().from(applicationEvents).where(inArray(applicationEvents.applicationId, ids)) : [],
    ids.length ? db.select({ id: conversations.id, applicationId: conversations.applicationId }).from(conversations).where(inArray(conversations.applicationId, ids)) : [],
    // Datele de contact ale clientului: doar pentru ofertele alese, după ce confirmi colaborarea.
    counterpartContacts(providerId, { applicationIds: hiredIds }),
  ]);
  const convMap = new Map(convs.map((c) => [c.applicationId, c.id]));
  const contactMap = new Map(contacts.map((c) => [c.applicationId, c]));
  return rows.map((r) => ({
    ...r,
    events: events.filter((e) => e.applicationId === r.app.id).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    conversationId: convMap.get(r.app.id) ?? null,
    contact: contactMap.get(r.app.id) ?? null,
  }));
}

const STATUS_STYLE: Record<string, string> = {
  submitted: "border-border bg-secondary text-secondary-foreground",
  viewed: "border-brand/20 bg-brand-soft text-brand",
  shortlisted: "border-warning/30 bg-warning/10 text-warning",
  hired: "border-success/25 bg-success/8 text-success",
  rejected: "border-border bg-muted text-muted-foreground",
  withdrawn: "border-border bg-muted text-muted-foreground",
  refunded: "border-border bg-muted text-muted-foreground",
};

function Timeline({ row }: { row: Row }) {
  const { app } = row;
  const at = (type: string) => row.events.find((e) => e.type === type)?.createdAt ?? null;
  const steps: { label: string; date: Date | null; done: boolean; icon: typeof Send; tone?: "bad" | "good" }[] = [
    { label: "Livrată", date: app.createdAt, done: true, icon: Send },
    { label: app.viewedAt ? `Citită de client` : "Necitită încă", date: app.viewedAt, done: Boolean(app.viewedAt), icon: Eye },
  ];
  if (app.status === "shortlisted" || at("shortlisted") || app.status === "hired") {
    steps.push({ label: "Pe lista scurtă", date: at("shortlisted"), done: true, icon: ListChecks });
  }
  if (app.status === "hired") steps.push({ label: "Aleasă de client", date: app.decidedAt, done: true, icon: Trophy, tone: "good" });
  if (app.status === "rejected") steps.push({ label: "Nu a fost selectată", date: app.decidedAt, done: true, icon: XCircle, tone: "bad" });
  if (app.status === "withdrawn") steps.push({ label: "Retrasă de tine", date: app.decidedAt, done: true, icon: Undo2, tone: "bad" });
  if (app.status === "refunded" || at("refunded")) steps.push({ label: "Aplicare restituită", date: at("refunded"), done: true, icon: CheckCircle2, tone: "good" });

  return (
    <ol className="flex flex-wrap items-center gap-x-1 gap-y-2 text-xs">
      {steps.map((s, i) => (
        <li key={s.label} className="flex items-center gap-1">
          {i > 0 && <span className={cn("mx-1 h-px w-5", s.done ? "bg-gradient-to-r from-foreground/15 to-foreground/50" : "bg-border")} />}
          <span
            className={cn(
              "flex h-6 items-center gap-1 rounded-md border px-2",
              !s.done && "border-dashed border-border-strong text-muted-foreground",
              s.done && s.tone === undefined && "border-border bg-secondary text-foreground",
              s.tone === "good" && "border-success/25 bg-success/8 text-success",
              s.tone === "bad" && "border-border bg-muted text-muted-foreground",
            )}
            title={s.date ? formatDateTime(s.date) : undefined}
          >
            {s.done ? <s.icon className="size-3.5" /> : <Circle className="size-3.5" />}
            {s.label}
            {s.date && <span className="opacity-70">· {timeAgo(s.date)}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

function ApplicationItem({ row }: { row: Row }) {
  const { app, project } = row;
  const active = ["submitted", "viewed", "shortlisted"].includes(app.status);
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card p-5 shadow-xs sm:p-6",
        app.boostedAt && active && "border-brand/35",
        app.status === "hired" && "border-success/35",
      )}
    >
      {app.status === "hired" ? (
        <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-success/0 via-success to-success/0" />
      ) : app.boostedAt && active ? (
        <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand/0 via-brand to-brand/0" />
      ) : null}
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <Link href={`/proiecte/${project.id}`} className="text-[1.0625rem] leading-snug font-semibold tracking-[-0.012em] underline-offset-4 hover:underline">
            {project.title}
          </Link>
          <div className="mt-1 text-xs text-muted-foreground tabular-nums">
            {describeBudget(project)} · {labels.workMode[project.workMode]} · proiect {labels.projectStatus[project.status].toLowerCase()}
          </div>
        </div>
        <span className={cn("inline-flex h-[22px] items-center rounded-md border px-2 text-xs font-medium", STATUS_STYLE[app.status])}>{labels.applicationStatus[app.status]}</span>
      </div>

      <div className="mt-4">
        <Timeline row={row} />
      </div>

      <p className="mt-4 text-sm leading-relaxed [overflow-wrap:anywhere] text-muted-foreground">{truncate(app.message, 240)}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {app.isAuto && (
          <Badge variant="outline" className="gap-1">
            <Bot /> Auto Bid
          </Badge>
        )}
        {app.boostedAt && (
          <Badge variant="brand" className="gap-1">
            <Sparkles /> Evidențiată
          </Badge>
        )}
        {app.priceAmount && (
          <Badge variant="secondary" className="tabular-nums">
            {formatLei(app.priceAmount)}
            {app.priceType === "hourly" ? "/oră" : app.priceType === "monthly" ? "/lună" : ""}
          </Badge>
        )}
        {app.estimatedDays && <Badge variant="secondary">{app.estimatedDays} zile</Badge>}
      </div>

      {app.status === "rejected" && app.rejectionReason && (
        <p className="mt-3 rounded-lg border bg-surface px-3.5 py-2.5 text-sm leading-relaxed dark:bg-muted/40">
          <span className="font-medium">Motivul clientului:</span> {app.rejectionReason}
        </p>
      )}

      {row.contact && <ContactDetails contact={row.contact} label="Contact client" className="mt-4" />}

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t pt-4">
        <ChatLink conversationId={row.conversationId} />
        {app.status === "hired" && (
          <Button asChild size="sm">
            <Link href="/colaborari">Confirmă colaborarea</Link>
          </Button>
        )}
        {active && <WithdrawButton applicationId={app.id} />}
        <span className="ml-auto text-xs text-muted-foreground">Trimisă {timeAgo(app.createdAt)}</span>
      </div>
    </div>
  );
}

export default async function MyApplicationsPage() {
  const user = await requireProvider();
  const [rows, stats] = await Promise.all([loadApplications(user.id), providerStats(user.id)]);
  const active = rows.filter((r) => ["submitted", "viewed", "shortlisted"].includes(r.app.status));
  const won = rows.filter((r) => r.app.status === "hired");
  const closed = rows.filter((r) => ["rejected", "withdrawn", "refunded"].includes(r.app.status));
  const viewRate = stats.applications ? Math.round((stats.viewed / stats.applications) * 100) : 0;

  const list = (items: Row[], empty: string) =>
    items.length === 0 ? (
      <EmptyState icon={Inbox} title={empty} className="py-10" />
    ) : (
      <div className="space-y-4">
        {items.map((r) => (
          <div key={r.app.id} className="reveal">
            <ApplicationItem row={r} />
          </div>
        ))}
      </div>
    );

  return (
    <div className="container-page pb-16">
      <PageHeader
        eyebrow="Pentru prestatori"
        title="Aplicările mele"
        description="Vezi exact ce se întâmplă cu fiecare ofertă: livrată, citită, pe lista scurtă sau aleasă."
        actions={
          <Button asChild>
            <Link href="/recomandari">Găsește proiecte</Link>
          </Button>
        }
      />

      <section className="enter mb-10 overflow-hidden rounded-2xl border bg-card shadow-xs" style={cssVars({ i: 1 })} aria-label="Statistici aplicări">
        <div className="flex items-center justify-between gap-3 border-b px-5 py-3.5 sm:px-6">
          <span className="eyebrow">Drumul ofertelor tale</span>
          <span className="text-xs text-muted-foreground">rata de citire: <span className="font-semibold text-foreground tabular-nums">{viewRate}%</span></span>
        </div>
        <dl className="grid grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Aplicări trimise", value: stats.applications, icon: Send },
            { label: "Citite de client", value: stats.viewed, icon: Eye },
            { label: "Pe lista scurtă", value: stats.shortlisted, icon: ListChecks },
            { label: "Proiecte câștigate", value: stats.hired, icon: Trophy },
          ].map((s, n) => {
            const pct = stats.applications ? Math.max(4, Math.round((s.value / stats.applications) * 100)) : 0;
            return (
              <div key={s.label} className={cn("relative p-5 sm:p-6", n % 2 === 1 && "border-l", n >= 2 && "border-t lg:border-t-0", n === 2 && "lg:border-l")}>
                <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <s.icon className="size-3.5" /> {s.label}
                </dt>
                <dd className="mt-3 text-[2rem] leading-none font-semibold tracking-[-0.03em] tabular-nums">
                  <span aria-hidden className="count-in" style={cssVars({ to: s.value, i: n })} />
                  <span className="sr-only">{s.value}</span>
                </dd>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                  <div
                    className={cn("h-full rounded-full", n === 3 ? "bg-success" : "bg-gradient-to-r from-primary to-brand")}
                    style={{ width: `${pct}%`, opacity: 1 - n * 0.12 }}
                  />
                </div>
              </div>
            );
          })}
        </dl>
      </section>

      {rows.length === 0 ? (
        <EmptyState
          icon={Send}
          title="Nu ai trimis încă nicio aplicare"
          description="Alege un proiect din recomandări și trimite o ofertă. Planul Gratuit include aplicări în fiecare lună."
          action={
            <Button asChild>
              <Link href="/recomandari">Vezi recomandările</Link>
            </Button>
          }
        />
      ) : (
        <Tabs defaultValue="active" className="gap-6">
          <TabsList>
            <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
            <TabsTrigger value="won">Câștigate ({won.length})</TabsTrigger>
            <TabsTrigger value="closed">Închise ({closed.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="mt-0">
            {list(active, "Nicio aplicare activă")}
          </TabsContent>
          <TabsContent value="won" className="mt-0">
            {list(won, "Încă niciun proiect câștigat — continuă să aplici!")}
          </TabsContent>
          <TabsContent value="closed" className="mt-0">
            {list(closed, "Nicio aplicare închisă")}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
