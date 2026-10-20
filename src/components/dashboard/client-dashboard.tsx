import { and, desc, eq, ne, sql } from "drizzle-orm";
import { ArrowRight, FolderOpen, Inbox, Lightbulb, Plus, UserPlus } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { labels } from "@/config/site";
import { describeBudget, timeAgo } from "@/lib/format";
import { getCatalog } from "@/server/catalog/taxonomy";
import { db } from "@/server/db";
import { projects } from "@/server/db/schema";
import { categoryDemand } from "@/server/insights";
import { SlotMeter } from "@/components/projects/project-card";
import { cssVars } from "@/components/home/css-vars";
import { StatTile } from "./stat-tile";

const statusVariant: Record<string, "secondary" | "warning" | "brand" | "outline" | "destructive"> = {
  draft: "secondary",
  pending_review: "warning",
  open: "brand",
  in_progress: "outline",
  closed: "secondary",
  cancelled: "secondary",
  removed: "destructive",
};

export async function ClientDashboard({ userId, countyCode }: { userId: string; countyCode: string | null }) {
  const catalog = await getCatalog();
  const [mine, demand] = await Promise.all([
    db
      .select({
        project: projects,
        unseen: sql<number>`(SELECT count(*)::int FROM applications a WHERE a.project_id = ${projects.id} AND a.viewed_at IS NULL AND a.status = 'submitted')`,
      })
      .from(projects)
      .where(and(eq(projects.clientId, userId), ne(projects.status, "removed")))
      .orderBy(desc(projects.createdAt))
      .limit(8),
    categoryDemand(countyCode),
  ]);
  const open = mine.filter((m) => m.project.status === "open").length;
  const offers = mine.reduce((s, m) => s + m.project.applicationsCount, 0);
  const unseen = mine.reduce((s, m) => s + m.unseen, 0);
  const missing = demand.filter((d) => d.label === "Cerere mare").slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={FolderOpen} label="Proiecte deschise" value={open} href="/proiectele-mele" />
        <StatTile icon={Inbox} label="Oferte primite" value={offers} href="/proiectele-mele" />
        <StatTile icon={Inbox} label="Oferte necitite" value={unseen} hint={unseen > 0 ? "Prestatorii văd când le citești" : undefined} />
        <Link href="/proiecte/nou" className="ink-panel lift group flex flex-col justify-between rounded-2xl p-5">
          <div aria-hidden className="aurora aurora-a -top-24 -right-16 size-[220px] opacity-70" />
          <span className="flex size-8 items-center justify-center rounded-lg bg-white text-[#0b1426] shadow-sm transition-transform group-hover:rotate-90">
            <Plus className="size-4" />
          </span>
          <div>
            <div className="mt-4 font-semibold text-white">Publică un proiect</div>
            <div className="text-xs text-white/60">Gratuit, în 2 minute</div>
          </div>
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <section className="min-w-0 space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="eyebrow">Activitate</div>
              <h2 className="mt-1.5 text-[1.375rem] font-semibold tracking-[-0.022em]">Proiectele tale</h2>
            </div>
            <Link href="/proiectele-mele" className="flex items-center gap-1 text-sm font-medium text-brand underline-offset-4 hover:underline">
              Toate <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {mine.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="Nu ai publicat încă niciun proiect"
              description="Descrie ce ai nevoie în cuvintele tale — AI-ul transformă textul într-o cerere clară, iar noi o trimitem prestatorilor potriviți."
              action={
                <Button asChild>
                  <Link href="/proiecte/nou">
                    <Plus /> Publică primul proiect
                  </Link>
                </Button>
              }
            />
          ) : (
            <ul className="reveal divide-y overflow-hidden rounded-2xl border bg-card shadow-xs">
              {mine.map(({ project: p, unseen: u }) => (
                <li key={p.id}>
                  <Link href={`/proiectele-mele/${p.id}`} className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant={statusVariant[p.status] ?? "secondary"}>{labels.projectStatus[p.status]}</Badge>
                        <span>{catalog.byId.get(p.categoryId)?.name}</span>
                        <span className="text-border-strong">/</span>
                        <span>{timeAgo(p.publishedAt ?? p.createdAt)}</span>
                      </div>
                      <div className="mt-1.5 truncate font-semibold tracking-[-0.01em]">{p.title}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground tabular-nums">{describeBudget(p)}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                      <SlotMeter used={p.applicationsCount} max={p.maxApplications} />
                      {u > 0 && (
                        <Badge variant="brand" className="gap-1.5">
                          <span className="live-dot size-1.5!" /> {u} noi
                        </Badge>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="reveal min-w-0 space-y-4" style={cssVars({ i: 1 })}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="size-4 text-muted-foreground" /> Sfaturi pentru oferte mai bune
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed text-muted-foreground marker:text-border-strong">
                <li>Un buget orientativ dublează, în medie, numărul de oferte.</li>
                <li>Răspunde la întrebările sugerate de AI înainte de publicare.</li>
                <li>Citește ofertele rapid — prestatorii văd când oferta a fost deschisă.</li>
                <li>Alege „preferabil cu factură” dacă factura nu e obligatorie.</li>
              </ul>
            </CardContent>
          </Card>
          {missing.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserPlus className="size-4 text-muted-foreground" /> Lipsesc prestatori
                </CardTitle>
                <CardDescription>Domenii cu multe cereri și puțini prestatori{countyCode ? ` în ${countyCode}` : ""}.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {missing.map((m) => (
                  <div key={m.categoryId} className="flex items-baseline justify-between gap-2 border-b pb-2 last:border-0">
                    <span className="font-medium">{m.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {m.projects30d} cereri · {m.providers} prestatori
                    </span>
                  </div>
                ))}
                <p className="pt-1 text-xs text-muted-foreground">
                  Cunoști pe cineva bun în aceste domenii?{" "}
                  <Link href="/setari#invita" className="font-medium text-brand underline-offset-4 hover:underline">
                    Invită-l pe platformă
                  </Link>
                  .
                </p>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
