import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function StatTile({ icon: Icon, label, value, hint, href }: { icon: LucideIcon; label: string; value: React.ReactNode; hint?: string; href?: string }) {
  const body = (
    <>
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="flex size-6 items-center justify-center rounded-md bg-muted text-foreground/70">
          <Icon className="size-3.5" />
        </span>
        {label}
      </div>
      <div className="mt-3 text-[2rem] leading-none font-semibold tracking-[-0.03em] tabular-nums">
        {typeof value === "number" ? (
          <>
            <span aria-hidden className="count-in" style={{ "--to": value } as React.CSSProperties} />
            <span className="sr-only">{value}</span>
          </>
        ) : (
          value
        )}
      </div>
      {hint && <div className="mt-2 truncate text-xs text-muted-foreground">{hint}</div>}
    </>
  );
  const cls = "block min-w-0 rounded-2xl border bg-card p-4 shadow-xs sm:p-5";
  return href ? (
    <Link href={href} className={cn(cls, "lift")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
