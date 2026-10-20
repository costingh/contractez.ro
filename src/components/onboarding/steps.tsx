import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Pașii onboarding-ului; `ink` pentru afișarea pe panourile întunecate. */
export function OnboardingSteps({ steps, current, tone = "default" }: { steps: string[]; current: number; tone?: "default" | "ink" }) {
  const ink = tone === "ink";
  return (
    <ol className="flex items-center gap-2" aria-label={`Pasul ${current} din ${steps.length}`}>
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2" aria-current={active ? "step" : undefined}>
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums transition-colors",
                ink ? "border-white/20 bg-white/[0.06] text-white/60" : "bg-card",
                done && (ink ? "border-white bg-white text-[#0b1426]" : "border-primary bg-primary text-primary-foreground"),
                active && (ink ? "border-[#8ea6ff] text-white ring-4 ring-[#5b7cff]/25" : "border-primary text-foreground ring-4 ring-primary/10"),
                !done && !active && !ink && "text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5" strokeWidth={3} /> : n}
            </span>
            <span className={cn("hidden text-sm sm:inline", ink ? (active ? "font-medium text-white" : "text-white/55") : active ? "font-medium" : "text-muted-foreground")}>
              {label}
            </span>
            {n < steps.length && (
              <span
                className={cn(
                  "h-px flex-1",
                  done ? (ink ? "bg-gradient-to-r from-white to-[#8ea6ff]" : "bg-primary") : ink ? "bg-white/15" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
