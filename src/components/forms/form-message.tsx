import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ActionState } from "@/lib/action";
import { cn } from "@/lib/utils";

export function FormMessage({ state, className }: { state: ActionState<unknown>; className?: string }) {
  if (!state) return null;
  if (state.ok && !state.message) return null;
  return (
    <div
      role={state.ok ? "status" : "alert"}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm leading-relaxed",
        state.ok ? "border-success/25 bg-success/6 text-foreground dark:bg-success/10" : "border-destructive/25 bg-destructive/6 text-destructive dark:bg-destructive/10",
        className,
      )}
    >
      {state.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : <AlertCircle className="mt-0.5 size-4 shrink-0" />}
      <span>{state.ok ? state.message : state.error}</span>
    </div>
  );
}

export function FieldError({ state, name }: { state: ActionState<unknown>; name: string }) {
  if (!state || state.ok || !state.fieldErrors?.[name]) return null;
  return <p className="text-xs text-destructive">{state.fieldErrors[name]}</p>;
}
