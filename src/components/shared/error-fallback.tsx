"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Ecranul afișat de granițele de eroare (`error.tsx`): păstrează antetul și navigarea site-ului, explică
 * pe scurt ce s-a întâmplat și oferă reîncercarea segmentului, fără reîncărcarea întregii pagini.
 */
export function ErrorFallback({ error, retry, className }: { error: unknown; retry: () => void; className?: string }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const digest = error instanceof Error && "digest" in error && typeof error.digest === "string" ? error.digest : null;
  return (
    <div className={cn("flex flex-1 flex-col items-center justify-center px-4 py-16 text-center", className)} role="alert">
      <div className="mb-5 flex size-12 items-center justify-center rounded-2xl border bg-card shadow-xs">
        <AlertTriangle className="size-5 text-warning" />
      </div>
      <h2 className="text-lg font-semibold tracking-[-0.01em]">Ceva nu a mers cum trebuia</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Acțiunea nu a putut fi finalizată. Dacă încărcai un fișier, verifică să aibă cel mult 5 MB. Încearcă din nou; datele salvate deja nu s-au pierdut.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button type="button" onClick={() => retry()}>
          <RotateCw /> Încearcă din nou
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Prima pagină</Link>
        </Button>
      </div>
      {digest && <p className="mt-6 font-mono text-[11px] text-muted-foreground">Cod eroare: {digest}</p>}
    </div>
  );
}
