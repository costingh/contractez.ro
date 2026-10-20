import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** Etichetă mică deasupra titlului (secțiune / context). Pentru un cuvânt evidențiat în titlu: <span className="serif-em text-gradient">. */
  eyebrow?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("enter flex flex-col gap-4 pt-8 pb-7 sm:flex-row sm:items-end sm:justify-between sm:pt-12", className)}>
      <div className="min-w-0 space-y-2">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1 className="text-[1.875rem] leading-[1.1] font-semibold tracking-[-0.032em] sm:text-[2.375rem]">{title}</h1>
        {description && <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
