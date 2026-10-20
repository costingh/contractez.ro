"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/forms/form-message";
import type { ActionState } from "@/lib/action";
import { cn } from "@/lib/utils";

/** Formular mic pentru acțiunile din admin: afișează rezultatul acțiunii sub câmpuri. */
export function ActionForm({
  action,
  children,
  className,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className={cn("space-y-2", className)}>
      {children}
      <FormMessage state={state} />
    </form>
  );
}
