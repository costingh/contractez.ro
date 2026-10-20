import { cssVars } from "@/components/home/css-vars";
import { cn } from "@/lib/utils";

export function Stat({ label, value, hint, className }: { label: string; value: React.ReactNode; hint?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border bg-card p-5 shadow-xs", className)}>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-2.5 text-[1.75rem] leading-none font-semibold tracking-[-0.03em] tabular-nums">
        {typeof value === "number" ? (
          <>
            <span aria-hidden className="count-in" style={cssVars({ to: value })} />
            <span className="sr-only">{value}</span>
          </>
        ) : (
          value
        )}
      </div>
      {hint && <div className="mt-2 text-xs leading-relaxed text-muted-foreground">{hint}</div>}
    </div>
  );
}
