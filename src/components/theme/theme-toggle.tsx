"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const options = [
  { value: "light", label: "Luminoasă", icon: Sun },
  { value: "dark", label: "Întunecată", icon: Moon },
  { value: "system", label: "Sistem", icon: Monitor },
] as const;

const subscribe = () => () => {};

/** Comutator segmentat pentru temă (luminoasă / întunecată / sistem). */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const current = mounted ? (theme ?? "system") : null;
  return (
    <div role="radiogroup" aria-label="Temă" className={cn("inline-flex items-center gap-0.5 rounded-lg border bg-muted/60 p-0.5", className)}>
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={current === value}
          aria-label={label}
          title={label}
          onClick={() => setTheme(value)}
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60",
            current === value && "bg-card text-foreground shadow-xs dark:bg-input",
          )}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
