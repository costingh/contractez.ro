"use client";

import { CheckCircle2, Loader2, MinusCircle, PlusCircle, Sparkles, XCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { compareAction } from "@/app/proiectele-mele/[id]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ApplicationComparison } from "@/server/ai/features";

export function ComparePanel({ projectId, names, disabled }: { projectId: string; names: Record<string, string>; disabled?: boolean }) {
  const [criteria, setCriteria] = useState("");
  const [result, setResult] = useState<ApplicationComparison | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const compare = () =>
    start(async () => {
      setError(null);
      const res = await compareAction(projectId, criteria);
      if (res?.ok && res.data) setResult(res.data);
      else if (res && !res.ok) setError(res.error);
    });

  return (
    <div className="space-y-4 rounded-xl border border-brand/20 bg-brand-soft p-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-brand" /> Compară ofertele cu AI
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Opțional, scrie ce contează pentru tine. AI-ul analizează doar ofertele și profilurile, obiectiv. Decizia rămâne a ta.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={criteria}
          onChange={(e) => setCriteria(e.target.value)}
          placeholder="ex: doar cu factură, sub 2.500 lei, cu experiență la restaurante"
          maxLength={500}
          className="bg-card"
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), compare())}
        />
        <Button onClick={compare} disabled={pending || disabled}>
          {pending ? <Loader2 className="animate-spin" /> : <Sparkles />} Compară
        </Button>
      </div>
      {error && <p className="text-sm text-muted-foreground">{error}</p>}
      {result && (
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <p className="text-sm">{result.summary}</p>
          <ul className="space-y-2.5">
            {result.items.map((it) => (
              <li key={it.applicationId} className="space-y-1 border-t pt-2.5 text-sm first:border-t-0 first:pt-0">
                <div className="flex items-center gap-2 font-medium">
                  {it.matchesCriteria ? <CheckCircle2 className="size-4 text-success" /> : <XCircle className="size-4 text-muted-foreground" />}
                  {names[it.applicationId] ?? "Prestator"}
                  <span className="text-xs font-normal text-muted-foreground">
                    {it.matchesCriteria ? "respectă criteriile" : "nu respectă toate criteriile"}
                  </span>
                </div>
                {it.strengths.map((s) => (
                  <div key={s} className="flex gap-1.5 text-muted-foreground">
                    <PlusCircle className="mt-0.5 size-3.5 shrink-0 text-foreground/70" /> {s}
                  </div>
                ))}
                {it.concerns.map((s) => (
                  <div key={s} className="flex gap-1.5 text-muted-foreground">
                    <MinusCircle className="mt-0.5 size-3.5 shrink-0 text-warning" /> {s}
                  </div>
                ))}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
