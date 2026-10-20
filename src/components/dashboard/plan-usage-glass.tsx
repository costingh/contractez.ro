import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cssVars } from "@/components/home/css-vars";
import { formatDate } from "@/lib/format";
import type { PlanUsage } from "@/server/billing/plans";

/** Aplicările rămase din plan, pentru panourile „ink” (panou, Auto Bid). */
export function PlanUsageGlass({ usage, i = 1 }: { usage: PlanUsage; i?: number }) {
  const pct = usage.limit > 0 ? Math.min(100, (usage.used / usage.limit) * 100) : 0;
  const out = usage.remaining === 0;
  return (
    <Link href="/abonament" className="glass group block rounded-2xl p-5 transition-colors hover:bg-white/[0.06]">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium tracking-[0.08em] text-white/50 uppercase">Plan {usage.plan.name}</span>
        {usage.comp && <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-white/70">oferit de echipă</span>}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-[2.75rem] leading-none font-semibold tracking-[-0.04em] text-white tabular-nums">
          <span aria-hidden className="count-in" style={cssVars({ to: usage.remaining, i })} />
          <span className="sr-only">{usage.remaining}</span>
        </span>
        <span className="text-sm text-white/55">
          {usage.remaining === 1 ? "aplicare rămasă" : "aplicări rămase"} din {usage.limit}
        </span>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
        <div className={out ? "h-full rounded-full bg-[#f2766b]" : "h-full rounded-full bg-gradient-to-r from-[#7d97ff] to-[#5ee0ff]"} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-white/55">
        <span>Se reînnoiesc pe {formatDate(usage.periodEnd)}</span>
        <span className="flex items-center gap-1 font-medium text-white/80 group-hover:text-white">
          {usage.plan.id === "business" ? "Abonament" : usage.plan.id === "free" ? "Vezi planurile" : "Treci la Business"}
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
