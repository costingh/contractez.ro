"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { pluralRo } from "@/lib/text";
import { cn } from "@/lib/utils";

const LABELS = ["", "Slab", "Sub așteptări", "OK", "Foarte bine", "Excelent"];

/** Nota 1–5, cu etichetă la hover; folosită de recenzii și de feedbackul de la încheierea colaborării. */
export function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          aria-label={pluralRo(n, "stea", "stele")}
          aria-pressed={n === value}
          className="rounded-md p-0.5 transition-transform duration-150 hover:scale-115 active:scale-95"
        >
          <Star className={cn("size-7 transition-colors", n <= shown ? "fill-warning text-warning" : "text-muted-foreground/35")} />
        </button>
      ))}
      {shown > 0 && <span className="ml-2 text-sm font-medium text-foreground/80">{LABELS[shown]}</span>}
    </div>
  );
}
