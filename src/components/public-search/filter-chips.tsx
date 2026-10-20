import { X } from "lucide-react";
import Link from "next/link";

export type Chip = { key: string; label: string };

/** Filtre active, fiecare cu link de eliminare. */
export function FilterChips({ chips, params, basePath }: { chips: Chip[]; params: Record<string, string | undefined>; basePath: string }) {
  if (chips.length === 0) return null;
  const without = (key: string) => {
    const sp = new URLSearchParams(
      Object.entries(params).filter(([k, v]) => k !== key && k !== "page" && k !== "aiexp" && v !== undefined && v !== "") as [string, string][],
    );
    if (key === "loc") sp.delete("r");
    const s = sp.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((c) => (
        <Link
          key={c.key}
          href={without(c.key)}
          className="inline-flex h-7 items-center gap-1.5 rounded-md border bg-card px-2.5 text-xs font-medium shadow-xs transition-colors hover:border-destructive/40 hover:text-destructive"
          title="Elimină filtrul"
        >
          {c.label} <X className="size-3 text-muted-foreground" />
        </Link>
      ))}
      <Link href={basePath} className="px-1.5 text-xs font-medium text-brand underline-offset-4 hover:underline">
        Șterge tot
      </Link>
    </div>
  );
}
