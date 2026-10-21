import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cssVars } from "@/components/home/css-vars";
import { Badge } from "@/components/ui/badge";
import { plans, type PlanId } from "@/config/site";
import { cn } from "@/lib/utils";

/** Bara cu aplicările lunare, pe scară logaritmică (5 → 40 → 200), ca diferența să se vadă fără să strivească Gratuit. */
function quotaShare(n: number) {
  const max = Math.max(...plans.map((p) => p.monthlyApplications));
  return Math.max(0.08, Math.log(n + 1) / Math.log(max + 1));
}

/**
 * Cardurile planurilor, folosite în pagina publică de prețuri și în pagina de abonament.
 * Planul recomandat e un panou „ink” cu chenar luminos; planul curent primește un inel cobalt.
 */
export function PlanCards({ currentPlanId, actions }: { currentPlanId?: PlanId | null; actions: Partial<Record<PlanId, ReactNode>> }) {
  return (
    <div className="grid items-stretch gap-4 md:grid-cols-3">
      {plans.map((p, n) => {
        const current = currentPlanId === p.id;
        const ink = Boolean(p.highlight);
        const body = (
          <>
            <div className="flex items-center justify-between gap-2">
              <div className={cn("text-lg font-semibold tracking-[-0.015em]", ink && "text-white")}>{p.name}</div>
              {current ? (
                <Badge variant="brand" className={cn(ink && "bg-white/12 text-white")}>
                  Planul tău
                </Badge>
              ) : ink ? (
                <Badge className="bg-white text-[#0b1426]">Recomandat</Badge>
              ) : null}
            </div>
            <div className={cn("mt-1 min-h-10 text-sm leading-snug", ink ? "text-white/60" : "text-muted-foreground")}>{p.tagline}</div>

            <div className="mt-6 flex items-baseline gap-1.5">
              <span className={cn("text-[3.5rem] leading-none font-semibold tracking-[-0.05em] tabular-nums", ink && "text-white")}>{p.priceLei}</span>
              <span className={cn("text-sm", ink ? "text-white/55" : "text-muted-foreground")}>lei / lună</span>
            </div>

            <div className={cn("mt-6 rounded-xl border p-3.5", ink ? "border-white/10 bg-white/[0.05]" : "bg-surface dark:bg-muted/40")}>
              <div className="flex items-baseline justify-between text-sm">
                <span className={ink ? "text-white/60" : "text-muted-foreground"}>Aplicări pe lună</span>
                <span className={cn("text-lg font-semibold tabular-nums", ink && "text-white")}>{p.monthlyApplications}</span>
              </div>
              <div className={cn("mt-2.5 h-1.5 overflow-hidden rounded-full", ink ? "bg-white/10" : "bg-border")}>
                <div
                  className={cn("h-full rounded-full", ink ? "bg-[linear-gradient(90deg,#7d97ff,#5ee0ff)]" : "bg-primary")}
                  style={{ width: `${quotaShare(p.monthlyApplications) * 100}%` }}
                />
              </div>
            </div>

            <ul className="mt-6 flex-1 space-y-3 text-sm">
              {p.features.map((f) => (
                <li key={f} className={cn("flex gap-2.5 leading-snug", ink && "text-white/85")}>
                  <span
                    className={cn(
                      "mt-px flex size-4.5 shrink-0 items-center justify-center rounded-full",
                      ink ? "bg-white/12 text-white" : "bg-muted text-foreground/70",
                    )}
                  >
                    <Check className="size-3" strokeWidth={2.75} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            {actions[p.id] && (
              <div
                data-vt-goal={`plan_click_${p.id}`}
                className={cn(
                  "mt-7",
                  // Pe panoul ink, orice buton din acțiuni devine alb cu text ink (contrast maxim, în ambele teme).
                  ink &&
                    "[&_[data-slot=button]]:border-transparent [&_[data-slot=button]]:bg-white [&_[data-slot=button]]:text-[#0b1426] [&_[data-slot=button]:hover]:bg-[#eef1fc] [&_[data-slot=button]:disabled]:opacity-70",
                )}
              >
                {actions[p.id]}
              </div>
            )}
          </>
        );

        return ink ? (
          <div key={p.id} className="reveal ring-glow order-first rounded-[1.4rem] md:order-none md:-my-3" style={cssVars({ i: n })}>
            <div
              className={cn(
                "ink-panel flex h-full flex-col rounded-[1.4rem] p-7 shadow-[0_30px_60px_-30px_rgb(20_35_64/0.7)] md:py-10",
                current && "ring-2 ring-brand/60 ring-offset-2 ring-offset-background",
              )}
            >
              <div aria-hidden className="aurora aurora-a -top-32 -right-24 size-[360px] opacity-50" />
              <div aria-hidden className="aurora aurora-b -bottom-40 -left-24 size-[320px] opacity-30" />
              {body}
            </div>
          </div>
        ) : (
          <div
            key={p.id}
            className={cn(
              "reveal lift flex flex-col rounded-[1.4rem] border bg-card p-7 shadow-xs",
              current && "ring-2 ring-brand/40 ring-offset-2 ring-offset-background",
            )}
            style={cssVars({ i: n })}
          >
            {body}
          </div>
        );
      })}
    </div>
  );
}
