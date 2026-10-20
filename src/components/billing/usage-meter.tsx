import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PlanUsage } from "@/server/billing/plans";

/** Câte aplicări au fost folosite din limita planului în perioada curentă. */
export function UsageMeter({ usage, className, compact }: { usage: PlanUsage; className?: string; compact?: boolean }) {
  const pct = usage.limit > 0 ? Math.min(100, (usage.used / usage.limit) * 100) : 100;
  const out = usage.remaining === 0;
  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex items-end justify-between gap-3 text-sm">
        <span className="font-medium">
          Plan {usage.plan.name}
          {usage.comp && <span className="font-normal text-muted-foreground"> · oferit de echipă</span>}
        </span>
        <span className={cn("tabular-nums", out ? "text-destructive" : "text-muted-foreground")}>
          <span className={cn("font-semibold tracking-[-0.03em]", compact ? "text-base" : "text-[1.75rem] leading-none", !out && "text-foreground")}>{usage.used}</span>{" "}
          / {usage.limit} aplicări
        </span>
      </div>
      <Progress
        value={pct}
        className={cn(
          "h-2",
          out ? "*:data-[slot=progress-indicator]:bg-destructive" : "*:data-[slot=progress-indicator]:bg-[linear-gradient(90deg,var(--primary),var(--brand))]",
        )}
        aria-label="Aplicări folosite în perioada curentă"
      />
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs leading-relaxed text-muted-foreground">
          <span>
            {out ? "Ai folosit toate aplicările." : `Îți mai rămân ${usage.remaining} ${usage.remaining === 1 ? "aplicare" : "aplicări"}.`} Se reînnoiesc pe{" "}
            {formatDate(usage.periodEnd)}.
          </span>
          {usage.plan.id !== "business" && (
            <Link href="/abonament" className="font-medium text-brand underline-offset-4 hover:underline">
              {usage.plan.id === "free" ? "Vezi planurile" : "Treci la Business"}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
