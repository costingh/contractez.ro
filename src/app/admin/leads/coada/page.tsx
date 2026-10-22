import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { categoryPath, getCatalog } from "@/server/catalog/taxonomy";
import { messengerUrl } from "@/server/outreach/person-key";
import { dailyCap, nextQueueLead, sentToday } from "@/server/outreach/service";
import { QueueRunner } from "./queue-runner";

export const metadata = { title: "Coadă outreach" };

const TYPES = { toti: null, clienti: "client", prestatori: "provider" } as const;

/** „Mod rapid”: un singur lead pe ecran, scurtături de tastatură. Omul trimite fiecare mesaj din Messenger. */
export default async function QueuePage({ searchParams }: { searchParams: Promise<{ tip?: string; min?: string; sarite?: string }> }) {
  const sp = await searchParams;
  const tipKey = (sp.tip && sp.tip in TYPES ? sp.tip : "toti") as keyof typeof TYPES;
  const min = Math.max(0, Math.min(100, Number(sp.min) || 0));
  // Lead-urile sărite „pentru acum” (fără să le marcăm) — rămân în URL ca să nu reapară în aceeași sesiune.
  const skippedNow = (sp.sarite ?? "").split(",").filter((x) => /^[0-9a-f-]{36}$/.test(x)).slice(-200);

  const [{ lead, remaining }, sent, catalog] = await Promise.all([
    nextQueueLead({ type: TYPES[tipKey], minScore: min, excludeIds: skippedNow }),
    sentToday(),
    getCatalog(),
  ]);
  const cap = dailyCap();

  const href = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ tip: tipKey, min: String(min), ...patch });
    return `/admin/leads/coada?${p}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coadă rapidă"
        description="Un lead pe ecran. Copiezi, trimiți tu din Messenger, apoi treci la următorul. Nimic nu se trimite automat."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/leads">Toate lead-urile</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {(Object.keys(TYPES) as (keyof typeof TYPES)[]).map((k) => (
          <Link
            key={k}
            href={href({ tip: k })}
            className={cn("rounded-full border px-3 py-1.5 capitalize transition-colors hover:bg-muted", k === tipKey && "border-foreground bg-foreground text-background hover:bg-foreground")}
          >
            {k === "toti" ? "Toți" : k === "clienti" ? "Clienți" : "Prestatori"}
          </Link>
        ))}
        <span className="mx-1 h-5 w-px bg-border" />
        {[0, 50, 70].map((m) => (
          <Link
            key={m}
            href={href({ min: String(m) })}
            className={cn("rounded-full border px-3 py-1.5 transition-colors hover:bg-muted", m === min && "border-foreground bg-foreground text-background hover:bg-foreground")}
          >
            {m === 0 ? "Orice scor" : `Scor ≥ ${m}`}
          </Link>
        ))}
      </div>

      <QueueRunner
        key={lead?.id ?? "empty"}
        sent={sent}
        cap={cap}
        remaining={remaining}
        skippedNow={skippedNow}
        baseHref={href({})}
        lead={
          lead && {
            id: lead.id,
            type: lead.type === "client" ? "client" : "provider",
            authorName: lead.authorName,
            authorProfileUrl: lead.authorProfileUrl,
            permalink: lead.permalink,
            postedAtText: lead.postedAtText,
            kind: lead.kind,
            text: lead.text,
            score: lead.score,
            reason: lead.reason,
            category: lead.categoryId ? categoryPath(catalog, lead.categoryId) || null : null,
            locality: lead.locality,
            message: lead.message ?? "",
            messengerUrl: messengerUrl(lead.personKey, lead.authorFbId),
          }
        }
      />
    </div>
  );
}
