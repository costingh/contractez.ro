import { ChevronDown } from "lucide-react";

export function Faq({ items }: { items: { q: string; a: React.ReactNode }[] }) {
  return (
    <div className="divide-y rounded-xl border bg-card shadow-xs">
      {items.map((item) => (
        <details key={item.q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
            {item.q}
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="max-w-prose pt-2.5 text-sm leading-relaxed text-muted-foreground">{item.a}</div>
        </details>
      ))}
    </div>
  );
}
