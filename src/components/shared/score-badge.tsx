import { cn } from "@/lib/utils";

/** Scorul de compatibilitate (calculat determinist, nu inventat de AI). */
export function ScoreBadge({ score, className }: { score: number; className?: string }) {
  const tone =
    score >= 80
      ? "border-brand/25 bg-brand-soft text-brand"
      : score >= 60
        ? "border-border-strong bg-card text-foreground"
        : "border-border bg-muted text-muted-foreground";
  return (
    <span className={cn("inline-flex h-[22px] items-center rounded-md border px-2 text-xs font-semibold tabular-nums", tone, className)} title="Compatibilitate calculată din categorie, competențe, buget, distanță și reputație">
      {score}% compatibil
    </span>
  );
}
