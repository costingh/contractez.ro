import { Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Pașii onboarding-ului; `ink` pentru afișarea pe panourile întunecate.
 * `done`: pașii deja salvați (bifați, chiar dacă utilizatorul a revenit la un pas anterior);
 * `hrefs`: linkuri către pașii la care se poate reveni (null = nu se poate sări încă la el).
 */
export function OnboardingSteps({
  steps,
  current,
  done: doneSteps,
  hrefs,
  tone = "default",
}: {
  steps: string[];
  current: number;
  done?: boolean[];
  hrefs?: (string | null)[];
  tone?: "default" | "ink";
}) {
  const ink = tone === "ink";
  return (
    <ol className="flex items-center gap-2" aria-label={`Pasul ${current} din ${steps.length}`}>
      {steps.map((label, i) => {
        const n = i + 1;
        const done = doneSteps ? Boolean(doneSteps[i]) : n < current;
        const active = n === current;
        const href = !active ? hrefs?.[i] : null;
        const marker = (
          <>
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums transition-colors",
                ink ? "border-white/20 bg-white/[0.06] text-white/60" : "bg-card",
                done && (ink ? "border-white bg-white text-[#0b1426]" : "border-primary bg-primary text-primary-foreground"),
                active && (ink ? "border-[#8ea6ff] ring-4 ring-[#5b7cff]/25" : "border-primary ring-4 ring-primary/10"),
                active && !done && (ink ? "text-white" : "text-foreground"),
                !done && !active && !ink && "text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : n}
            </span>
            <span className={cn("hidden text-sm sm:inline", ink ? (active ? "font-medium text-white" : "text-white/55") : active ? "font-medium" : "text-muted-foreground")}>
              {label}
            </span>
            {done && <span className="sr-only"> (salvat)</span>}
          </>
        );
        return (
          <li key={label} className="flex flex-1 items-center gap-2" aria-current={active ? "step" : undefined}>
            {href ? (
              <Link href={href} className={cn("-m-1 flex shrink-0 items-center gap-2 rounded-full p-1 transition-opacity hover:opacity-80", ink ? "focus-visible:ring-2 focus-visible:ring-white/60" : "")} aria-label={`${label}${done ? " (salvat)" : ""}`}>
                {marker}
              </Link>
            ) : (
              <span className="flex shrink-0 items-center gap-2">{marker}</span>
            )}
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
