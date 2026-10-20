import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "enter relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border-strong bg-card/60 px-6 py-16 text-center",
        className,
      )}
    >
      {/* punctaj fin, estompat spre margini */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(var(--border-strong)_1px,transparent_1px)] [background-size:16px_16px] opacity-60 [mask-image:radial-gradient(ellipse_50%_60%_at_50%_35%,black,transparent)]"
      />
      {Icon && (
        <div className="relative mb-5">
          <div aria-hidden className="absolute -inset-4 rounded-full bg-brand/10 blur-xl" />
          <div className="relative flex size-12 items-center justify-center rounded-2xl border bg-card shadow-md">
            <Icon className="size-5 text-foreground/75" strokeWidth={1.75} />
          </div>
        </div>
      )}
      <h3 className="relative text-lg font-semibold tracking-[-0.015em]">{title}</h3>
      {description && <p className="relative mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>}
      {action && <div className="relative mt-6 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
