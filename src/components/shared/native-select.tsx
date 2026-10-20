import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Select nativ stilizat (merge în formulare server, fără JS, și pe mobil). */
export function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-9 w-full appearance-none rounded-lg border border-input bg-card px-3 pr-9 text-sm shadow-xs outline-none transition-[color,border-color,box-shadow] hover:border-border-strong focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 disabled:opacity-50 dark:bg-input/25",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
