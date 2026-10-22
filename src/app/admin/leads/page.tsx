import { and, desc, eq, gte, isNotNull, sql, type SQL } from "drizzle-orm";
import { AlertTriangle, KeyRound } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { NativeSelect } from "@/components/shared/native-select";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { categoryPath, getCatalog } from "@/server/catalog/taxonomy";
import { db } from "@/server/db";
import { outreachLeads, outreachStatus, outreachType } from "@/server/db/schema";
import { features } from "@/server/env";
import { messengerUrl } from "@/server/outreach/person-key";
import { dailyCap, sentToday } from "@/server/outreach/service";
import { Stat } from "../_components/stat";
import { LeadCard, type LeadView } from "./lead-card";

export const metadata = { title: "Lead-uri outreach" };

type Status = (typeof outreachStatus.enumValues)[number];
type LeadType = (typeof outreachType.enumValues)[number];

const STATUS_LABEL: Record<Status, string> = {
  new: "În analiză",
  scored: "De contactat",
  irrelevant: "Irelevant",
  contacted: "Trimis",
  skipped: "Sărit",
  already_contacted: "Deja contactat",
  replied: "A răspuns",
  signed_up: "S-a înscris",
};
const TYPE_LABEL: Record<LeadType, string> = { client: "Clienți", provider: "Prestatori", irrelevant: "Irelevanți" };
const LIMIT = 100;

type Search = { status?: string; type?: string; min?: string; group?: string; cat?: string };

export default async function AdminLeadsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const status = sp.status === "all" ? null : outreachStatus.enumValues.includes(sp.status as Status) ? (sp.status as Status) : "scored";
  const type = outreachType.enumValues.includes(sp.type as LeadType) ? (sp.type as LeadType) : null;
  const min = sp.min && /^\d{1,3}$/.test(sp.min) ? Math.min(100, Number(sp.min)) : null;
  const group = sp.group?.trim() ? sp.group.trim().slice(0, 64) : null;
  const cat = sp.cat && /^\d+$/.test(sp.cat) ? Number(sp.cat) : null;

  const where: SQL[] = [];
  if (status) where.push(eq(outreachLeads.status, status));
  if (type) where.push(eq(outreachLeads.type, type));
  if (min !== null) where.push(gte(outreachLeads.score, min));
  if (group) where.push(eq(outreachLeads.groupId, group));
  if (cat) where.push(eq(outreachLeads.categoryId, cat));

  const [rows, totals, groups, cats, sent, catalog] = await Promise.all([
    db
      .select({
        lead: outreachLeads,
        personContacted: sql<boolean>`EXISTS (
          SELECT 1 FROM outreach_leads o2
          WHERE o2.person_key = ${outreachLeads.personKey} AND o2.id <> ${outreachLeads.id}
            AND o2.status IN ('contacted', 'replied', 'signed_up', 'already_contacted'))`,
      })
      .from(outreachLeads)
      .where(where.length ? and(...where) : undefined)
      .orderBy(sql`${outreachLeads.score} DESC NULLS LAST`, desc(outreachLeads.createdAt))
      .limit(LIMIT),
    db.select({ status: outreachLeads.status, n: sql<number>`count(*)::int` }).from(outreachLeads).groupBy(outreachLeads.status),
    db
      .select({ groupId: outreachLeads.groupId, groupName: sql<string | null>`max(${outreachLeads.groupName})`, n: sql<number>`count(*)::int` })
      .from(outreachLeads)
      .groupBy(outreachLeads.groupId)
      .orderBy(desc(sql`count(*)`)),
    db.selectDistinct({ categoryId: outreachLeads.categoryId }).from(outreachLeads).where(isNotNull(outreachLeads.categoryId)),
    sentToday(),
    getCatalog(),
  ]);
  const cap = dailyCap();
  const capReached = sent >= cap;
  const byStatus = new Map(totals.map((t) => [t.status, t.n]));
  const total = totals.reduce((s, t) => s + t.n, 0);
  const groupNames = new Map(groups.map((g) => [g.groupId, g.groupName ?? g.groupId]));
  const catOptions = cats
    .map((c) => ({ id: c.categoryId!, label: categoryPath(catalog, c.categoryId!) }))
    .filter((c) => c.label)
    .sort((a, b) => a.label.localeCompare(b.label, "ro"));

  const leads: LeadView[] = rows.map(({ lead: l, personContacted }) => ({
    id: l.id,
    kind: l.kind,
    status: l.status,
    statusLabel: STATUS_LABEL[l.status],
    type: l.type,
    groupName: groupNames.get(l.groupId) ?? l.groupName ?? l.groupId,
    authorName: l.authorName,
    authorProfileUrl: l.authorProfileUrl,
    permalink: l.permalink,
    postedAtText: l.postedAtText,
    commentCount: l.commentCount,
    text: l.text,
    category: l.categoryId ? categoryPath(catalog, l.categoryId) || null : null,
    locality: l.locality,
    score: l.score,
    reason: l.reason,
    message: l.message,
    messengerUrl: messengerUrl(l.personKey, l.authorFbId),
    personContacted: Boolean(personContacted),
    createdAt: l.createdAt.toISOString(),
  }));

  const statusHref = (s: Status | "all") => {
    const p = new URLSearchParams(Object.entries({ ...sp, status: s }).filter(([, v]) => v) as [string, string][]);
    return `/admin/leads?${p}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lead-uri outreach"
        description="Postări și comentarii din grupurile de Facebook, clasificate de AI. Copiezi mesajul, îl trimiți tu din Messenger, apoi marchezi aici. Nimic nu se trimite automat."
        actions={
          <Button asChild size="sm">
            <Link href="/admin/leads/coada">Coadă rapidă →</Link>
          </Button>
        }
        className="pt-0"
      />

      {!features.outreach && (
        <Alert variant="warning">
          <KeyRound />
          <AlertTitle>Extensia nu se poate conecta: lipsește OUTREACH_TOKEN</AlertTitle>
          <AlertDescription>
            Generează un token (<code>openssl rand -hex 32</code>), pune-l în <code>.env</code> ca <code>OUTREACH_TOKEN=…</code> și repornește aplicația. Apoi lipește tokenul și URL-ul site-ului în pagina de opțiuni a extensiei (vezi <code>docs/OUTREACH.md</code>). Până atunci, <code>/api/outreach/*</code> răspunde 503.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label="Trimise azi"
          value={
            <span className={cn(capReached && "text-warning")}>
              {sent} / {cap}
            </span>
          }
          hint={sent > cap ? "Ai depășit limita zilnică. Continuă mâine." : capReached ? "Limita zilnică atinsă." : `Mai poți trimite ${cap - sent} azi.`}
          className={cn(capReached && "border-warning/40")}
        />
        <Stat label="De contactat" value={byStatus.get("scored") ?? 0} hint={`${byStatus.get("new") ?? 0} în analiză AI`} />
        <Stat label="Total lead-uri" value={total} hint={`${byStatus.get("replied") ?? 0} au răspuns · ${byStatus.get("signed_up") ?? 0} înscriși`} />
      </div>

      {capReached && (
        <Alert variant="warning">
          <AlertTriangle />
          <AlertTitle>{sent > cap ? `Peste limită: ${sent} mesaje azi (limita ${cap})` : `Ai atins limita de ${cap} mesaje pe azi`}</AlertTitle>
          <AlertDescription>„Am trimis” e dezactivat. Dacă ai trimis totuși un mesaj, bifează „Peste limită” pe lead-ul respectiv.</AlertDescription>
        </Alert>
      )}

      <nav aria-label="Statusuri" className="flex flex-wrap gap-1.5">
        {(["all", ...outreachStatus.enumValues] as const).map((s) => {
          const active = s === "all" ? status === null : status === s;
          const n = s === "all" ? total : (byStatus.get(s) ?? 0);
          return (
            <Link
              key={s}
              href={statusHref(s)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                active && "border-foreground bg-card font-medium text-foreground",
              )}
            >
              {s === "all" ? "Toate" : STATUS_LABEL[s]}
              <span className="tabular-nums opacity-70">{n}</span>
            </Link>
          );
        })}
      </nav>

      <form className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="status" value={status ?? "all"} />
        <label className="space-y-1 text-xs text-muted-foreground">
          <span>Tip</span>
          <NativeSelect name="type" defaultValue={type ?? ""} className="w-36">
            <option value="">Toate</option>
            {outreachType.enumValues.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </NativeSelect>
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">
          <span>Scor minim</span>
          <Input name="min" type="number" min={0} max={100} defaultValue={min ?? ""} className="w-24" />
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">
          <span>Grup</span>
          <NativeSelect name="group" defaultValue={group ?? ""} className="w-56">
            <option value="">Toate grupurile</option>
            {groups.map((g) => (
              <option key={g.groupId} value={g.groupId}>
                {g.groupName ?? g.groupId} ({g.n})
              </option>
            ))}
          </NativeSelect>
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">
          <span>Categorie</span>
          <NativeSelect name="cat" defaultValue={cat ? String(cat) : ""} className="w-56">
            <option value="">Toate categoriile</option>
            {catOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </NativeSelect>
        </label>
        <Button type="submit" variant="outline">
          Filtrează
        </Button>
        <Button asChild variant="ghost">
          <Link href="/admin/leads">Resetează</Link>
        </Button>
      </form>

      {leads.length === 0 ? (
        <EmptyState
          title="Niciun lead"
          description={total === 0 ? "Instalează extensia din tools/fb-copilot și derulează un grup: postările apar aici." : "Niciun lead pentru filtrele alese."}
        />
      ) : (
        <div className="space-y-4">
          {leads.map((l) => (
            <LeadCard key={l.id} lead={l} capReached={capReached} />
          ))}
          {leads.length === LIMIT && <p className="text-center text-xs text-muted-foreground">Primele {LIMIT} lead-uri. Restrânge filtrele pentru a vedea altele.</p>}
        </div>
      )}
    </div>
  );
}
