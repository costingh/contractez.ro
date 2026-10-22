import { ArrowUpRight, BadgeCheck, MapPin, Receipt, Zap } from "lucide-react";
import Link from "next/link";
import { ScoreBadge } from "@/components/shared/score-badge";
import { labels } from "@/config/site";
import { describeBudget, formatDistance, timeAgo } from "@/lib/format";
import { truncate } from "@/lib/text";
import { cn } from "@/lib/utils";

export type ProjectCardData = {
  project: {
    id: string;
    title: string;
    description: string;
    aiSummary: string | null;
    budgetType: string;
    budgetMin: number | null;
    budgetMax: number | null;
    workMode: "remote" | "on_site" | "hybrid";
    invoice: "required" | "preferred" | "not_needed";
    urgency: "flexible" | "this_month" | "this_week" | "urgent";
    applicationsCount: number;
    maxApplications: number;
    publishedAt: Date | null;
  };
  categoryName: string;
  localityName: string | null;
  countyCode?: string | null;
  clientPhoneVerified?: boolean;
  clientEmailVerified?: boolean;
  distanceKm?: number | null;
  score?: number;
};

/** Locurile de aplicare, ca segmente: câte oferte mai pot intra. */
export function SlotMeter({ used, max, className }: { used: number; max: number; className?: string }) {
  const full = used >= max;
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="flex gap-0.5" aria-hidden>
        {Array.from({ length: Math.min(max, 15) }, (_, i) => (
          <span key={i} className={cn("h-2.5 w-1.5 rounded-[2px]", i < used ? (full ? "bg-muted-foreground/60" : "bg-foreground/75") : "bg-border-strong/70")} />
        ))}
      </span>
      <span className="tabular-nums">{full ? "Locuri ocupate" : `${used} din ${max} locuri ocupate`}</span>
    </span>
  );
}

export function ProjectCard({ data }: { data: ProjectCardData }) {
  const p = data.project;
  const where = p.workMode === "remote" ? "Remote" : [data.localityName, data.countyCode].filter(Boolean).join(", ");
  const urgent = p.urgency === "urgent" || p.urgency === "this_week";
  return (
    <Link
      href={`/proiecte/${p.id}`}
      className="group relative block min-w-0 rounded-xl border bg-card p-5 shadow-xs lift sm:p-6"
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground/80">{data.categoryName}</span>
        <span aria-hidden className="text-border-strong">/</span>
        <span>{timeAgo(p.publishedAt)}</span>
        {data.score !== undefined ? (
          <ScoreBadge score={data.score} className="ml-auto" />
        ) : (
          <ArrowUpRight className="ml-auto size-4 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground" />
        )}
      </div>
      <h3 className="mt-2 text-[1.0625rem] leading-snug font-semibold tracking-[-0.012em] text-balance [overflow-wrap:anywhere]">{p.title}</h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">{truncate(p.description.replace(/\s+/g, " "), 220)}</p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="font-semibold tabular-nums">{describeBudget(p)}</span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="size-3.5" />
          {where || labels.workMode[p.workMode]}
          {data.distanceKm != null && p.workMode !== "remote" && <span>· {formatDistance(data.distanceKm)}</span>}
        </span>
        {p.invoice === "required" && (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Receipt className="size-3.5" /> Cu factură
          </span>
        )}
        {urgent && (
          <span className="flex items-center gap-1.5 font-medium text-warning">
            <Zap className="size-3.5" /> {labels.urgency[p.urgency]}
          </span>
        )}
        {data.clientPhoneVerified && (
          <span className="flex items-center gap-1.5 font-medium text-success">
            <BadgeCheck className="size-3.5" /> Client verificat
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3.5 text-xs text-muted-foreground">
        <SlotMeter used={p.applicationsCount} max={p.maxApplications} />
        {p.applicationsCount === 0 && <span className="font-medium text-success">Fii primul care aplică</span>}
      </div>
    </Link>
  );
}
