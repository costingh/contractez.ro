"use client";

import { Ban, CheckCircle2, Flag } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/action";
import { cancelAction, completeAction, confirmAction } from "./actions";

export function CollaborationActions({ id, status, isProvider }: { id: string; status: string; isProvider: boolean }) {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<ActionState>) =>
    start(async () => {
      const res = await fn();
      if (res?.ok) toast.success(res.message ?? "Gata");
      else if (res) toast.error(res.error);
    });
  return (
    <div className="flex flex-wrap gap-2">
      {status === "pending_confirmation" && isProvider && (
        <Button size="sm" disabled={pending} onClick={() => run(() => confirmAction(id))}>
          <CheckCircle2 /> Confirm colaborarea
        </Button>
      )}
      {status === "active" && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => completeAction(id))}>
          <Flag /> Marchează finalizată
        </Button>
      )}
      {status === "pending_confirmation" && !isProvider && (
        <span className="self-center text-xs text-muted-foreground">Așteaptă confirmarea prestatorului.</span>
      )}
      {(status === "active" || status === "pending_confirmation") && (
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground"
          disabled={pending}
          onClick={() => window.confirm("Sigur anulezi colaborarea?") && run(() => cancelAction(id))}
        >
          <Ban /> Anulează
        </Button>
      )}
    </div>
  );
}
