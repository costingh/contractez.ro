import { desc, eq, sql } from "drizzle-orm";
import { CalendarClock, Eye, FolderOpen, MapPin, Pencil, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SlotMeter } from "@/components/projects/project-card";
import { cssVars } from "@/components/home/css-vars";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { labels } from "@/config/site";
import { describeBudget, formatDate, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { requireOnboardedUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { categories, localities, projects } from "@/server/db/schema";

export const metadata: Metadata = { title: "Proiectele mele" };

type Row = Awaited<ReturnType<typeof loadProjects>>[number];

async function loadProjects(clientId: string) {
  return db
    .select({
      project: projects,
      categoryName: categories.name,
      localityName: localities.name,
      newOffers: sql<number>`(SELECT count(*)::int FROM applications a WHERE a.project_id = ${projects.id} AND a.viewed_at IS NULL AND a.status = 'submitted')`,
      matches: sql<number>`(SELECT count(*)::int FROM project_matches m WHERE m.project_id = ${projects.id})`,
    })
    .from(projects)
    .innerJoin(categories, eq(categories.id, projects.categoryId))
    .leftJoin(localities, eq(localities.id, projects.localityId))
    .where(eq(projects.clientId, clientId))
    .orderBy(desc(projects.updatedAt))
    .limit(200);
}

const GROUPS = [
  { key: "open", label: "Deschise", statuses: ["open"] },
  { key: "drafts", label: "Ciorne & în verificare", statuses: ["draft", "pending_review"] },
  { key: "progress", label: "În desfășurare", statuses: ["in_progress"] },
  { key: "closed", label: "Închise", statuses: ["closed", "cancelled", "removed"] },
] as const;

function statusVariant(status: string) {
  if (status === "open") return "brand" as const;
  if (status === "removed") return "destructive" as const;
  if (status === "pending_review") return "warning" as const;
  if (status === "in_progress") return "secondary" as const;
  return "outline" as const;
}

function ProjectRow({ r }: { r: Row }) {
  const p = r.project;
  const where = p.workMode === "remote" ? "Remote" : (r.localityName ?? labels.workMode[p.workMode]);
  const editable = ["draft", "pending_review", "open"].includes(p.status);
  return (
    <div className={cn("lift relative overflow-hidden rounded-2xl border bg-card p-5 shadow-xs sm:p-6", r.newOffers > 0 && "border-brand/35")}>
      {r.newOffers > 0 && <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand/0 via-brand to-brand/0" />}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant={statusVariant(p.status)}>{labels.projectStatus[p.status]}</Badge>
        <span className="font-medium text-foreground/80">{r.categoryName}</span>
        <span aria-hidden className="text-border-strong">/</span>
        <span>{p.publishedAt ? `publicat ${timeAgo(p.publishedAt)}` : `actualizat ${timeAgo(p.updatedAt)}`}</span>
        {r.newOffers > 0 && (
          <Badge variant="default" className="ml-auto gap-1.5 tabular-nums">
            <span className="live-dot size-1.5!" /> {r.newOffers} {r.newOffers === 1 ? "ofertă nouă" : "oferte noi"}
          </Badge>
        )}
      </div>
      <Link href={`/proiectele-mele/${p.id}`} className="mt-2 block text-[1.0625rem] leading-snug font-semibold tracking-[-0.012em] text-balance underline-offset-4 hover:underline">
        {p.title}
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground tabular-nums">{describeBudget(p)}</span>
        <span className="flex items-center gap-1.5">
          <MapPin className="size-3.5" /> {where}
        </span>
        {p.status !== "draft" && (
          <>
            <span className="flex items-center gap-1.5 tabular-nums">
              <Eye className="size-3.5" /> {p.viewsCount} vizualizări
            </span>
          </>
        )}
        {p.status === "open" && p.expiresAt && (
          <span className="flex items-center gap-1.5">
            <CalendarClock className="size-3.5" /> expiră pe {formatDate(p.expiresAt)}
          </span>
        )}
      </div>
      {p.status === "pending_review" && p.moderationNote && (
        <p className="mt-3 rounded-lg border border-warning/30 bg-warning/8 px-3 py-2 text-xs leading-relaxed">În verificare: {p.moderationNote}</p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
        {p.status !== "draft" && <SlotMeter used={p.applicationsCount} max={p.maxApplications} className="mr-auto text-xs text-muted-foreground max-sm:w-full max-sm:pb-1" />}
        <Button asChild size="sm">
          <Link href={`/proiectele-mele/${p.id}`}>{p.applicationsCount > 0 ? "Vezi ofertele" : "Gestionează"}</Link>
        </Button>
        {editable && (
          <Button asChild size="sm" variant="outline">
            <Link href={`/proiecte/${p.id}/editeaza`}>
              <Pencil /> Editează
            </Link>
          </Button>
        )}
        {p.status === "open" && (
          <Button asChild size="sm" variant="ghost">
            <Link href={`/proiecte/${p.id}`}>Vezi pagina publică</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export default async function MyProjectsPage() {
  const user = await requireOnboardedUser("/proiectele-mele");
  const rows = await loadProjects(user.id);
  const grouped = GROUPS.map((g) => ({ ...g, rows: rows.filter((r) => (g.statuses as readonly string[]).includes(r.project.status)) }));
  const initial = grouped.find((g) => g.rows.length > 0)?.key ?? "open";

  return (
    <div className="container-page pb-16">
      <PageHeader
        eyebrow="Pentru clienți"
        title="Proiectele mele"
        description="Urmărește ofertele primite, discută cu prestatorii și alege cu cine colaborezi."
        actions={
          <Button asChild>
            <Link href="/proiecte/nou">
              <Plus /> Proiect nou
            </Link>
          </Button>
        }
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Încă nu ai publicat niciun proiect"
          description="Descrie ce ai nevoie și primești oferte de la prestatori compatibili. Publicarea e gratuită."
          action={
            <Button asChild>
              <Link href="/proiecte/nou">Publică primul proiect</Link>
            </Button>
          }
        />
      ) : (
        <Tabs defaultValue={initial} className="gap-6">
          {/* Pe telefon, cele 4 tab-uri nu încap pe un rând: bara se derulează orizontal în loc să se rupă peste chenar. */}
          <TabsList className="no-scrollbar w-full touch-pan-x justify-start overflow-x-auto overflow-y-hidden overscroll-x-contain sm:w-auto">
            {grouped.map((g) => (
              <TabsTrigger key={g.key} value={g.key} className="flex-none">
                {g.label}
                <span className="ml-0.5 rounded-sm bg-foreground/8 px-1.5 text-xs font-medium text-muted-foreground tabular-nums">{g.rows.length}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {grouped.map((g) => (
            <TabsContent key={g.key} value={g.key} className="space-y-4">
              {g.rows.length === 0 ? (
                <EmptyState title="Nimic aici încă" className="py-8" />
              ) : (
                g.rows.map((r, n) => (
                  <div key={r.project.id} className="reveal" style={cssVars({ i: n % 3 })}>
                    <ProjectRow r={r} />
                  </div>
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
