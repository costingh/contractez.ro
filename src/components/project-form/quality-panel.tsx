import { AlertTriangle, CheckCircle2, HelpCircle, Lightbulb, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { QualityView } from "./types";

function tone(score: number) {
  if (score >= 80) return { label: "Cerere foarte clară", cls: "text-success" };
  if (score >= 60) return { label: "Cerere bună, se poate îmbunătăți", cls: "text-primary" };
  return { label: "Lipsesc detalii importante", cls: "text-warning" };
}

/** „AI Quality Check”: cât de ușor pot prestatorii să facă o ofertă corectă. */
export function QualityPanel({ quality, className, compact }: { quality: QualityView; className?: string; compact?: boolean }) {
  const t = tone(quality.score);
  const clean = quality.missing.length === 0 && quality.questions.length === 0 && !quality.budgetInsight;
  return (
    <div className={cn("space-y-3 rounded-2xl border bg-card p-5 shadow-xs", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-2">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-brand" />
          <div className="min-w-0">
            <div className="text-sm font-semibold">Verificarea calității</div>
            <div className="text-xs text-muted-foreground">{quality.source === "ai" ? "Analiză AI" : "Reguli automate"}</div>
          </div>
        </div>
        <span className={cn("shrink-0 text-2xl leading-none font-semibold tracking-[-0.03em] tabular-nums", t.cls)}>
          {Math.round(quality.score)}
          <span className="text-sm font-medium text-muted-foreground">/100</span>
        </span>
      </div>
      <Progress value={quality.score} className="h-1.5" />
      <p className={cn("text-xs font-medium", t.cls)}>{t.label}</p>

      {quality.budgetInsight && (
        <div className="flex gap-2 rounded-lg border border-warning/30 bg-warning/8 p-2.5 text-sm">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-warning" />
          <div>
            <div className="font-medium">Observație despre buget</div>
            <p className="text-muted-foreground">{quality.budgetInsight}</p>
          </div>
        </div>
      )}
      {quality.missing.length > 0 && (
        <div className="space-y-1.5">
          <div className="eyebrow">Ce lipsește</div>
          <ul className="space-y-1 text-sm">
            {quality.missing.map((m) => (
              <li key={m} className="flex gap-2">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" /> {m}
              </li>
            ))}
          </ul>
        </div>
      )}
      {!compact && quality.questions.length > 0 && (
        <div className="space-y-1.5">
          <div className="eyebrow">Întrebări pe care le vor pune prestatorii</div>
          <ul className="space-y-1 text-sm">
            {quality.questions.map((q) => (
              <li key={q} className="flex gap-2">
                <HelpCircle className="mt-0.5 size-3.5 shrink-0 text-brand" /> {q}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">Răspunde la ele direct în descriere — primești oferte mai precise.</p>
        </div>
      )}
      {clean && (
        <p className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="size-4 text-success" /> Prestatorii au toate informațiile pentru o ofertă corectă.
        </p>
      )}
    </div>
  );
}
