"use client";

import { Ban, Bot, CheckCircle2, Lock, Pencil, PlusCircle, Send } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { closeAction, publishAction, reopenAction, toggleAutoBidsAction } from "@/app/proiectele-mele/[id]/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { ActionState } from "@/lib/action";

function useAction() {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<ActionState<unknown>>, after?: () => void) =>
    start(async () => {
      const res = await fn();
      if (res?.ok) {
        if (res.message) toast.success(res.message);
        after?.();
      } else if (res) toast.error(res.error);
    });
  return { pending, run };
}

export function ProjectControls({
  projectId,
  status,
  locked = false,
  canReopen,
  allowAutoBids,
}: {
  projectId: string;
  status: string;
  /** În verificare după raportări: doar un administrator îl poate debloca. */
  locked?: boolean;
  canReopen: boolean;
  allowAutoBids: boolean;
}) {
  const { pending, run } = useAction();
  const [confirm, setConfirm] = useState<null | "closed" | "cancelled">(null);
  const editable = ["draft", "pending_review", "open"].includes(status) && !locked;
  const active = ["draft", "pending_review", "open", "in_progress"].includes(status);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "draft" && (
        <Button onClick={() => run(() => publishAction(projectId))} disabled={pending}>
          <Send /> Publică gratuit
        </Button>
      )}
      {editable && (
        <Button asChild variant="outline">
          <Link href={`/proiecte/${projectId}/editeaza`}>
            <Pencil /> Editează
          </Link>
        </Button>
      )}
      {status === "open" && canReopen && (
        <Button variant="outline" onClick={() => run(() => reopenAction(projectId))} disabled={pending}>
          <PlusCircle /> Încă 5 locuri
        </Button>
      )}
      {active && (
        <Dialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
          {status === "in_progress" || status === "open" ? (
            <DialogTrigger asChild>
              <Button variant="ghost" onClick={() => setConfirm("closed")} disabled={pending}>
                <Lock /> Închide
              </Button>
            </DialogTrigger>
          ) : null}
          <DialogTrigger asChild>
            <Button variant="ghost" className="text-destructive" onClick={() => setConfirm("cancelled")} disabled={pending}>
              <Ban /> Anulează
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{confirm === "closed" ? "Închizi proiectul?" : "Anulezi proiectul?"}</DialogTitle>
              <DialogDescription>
                {confirm === "closed"
                  ? "Proiectul nu va mai primi oferte. Conversațiile existente rămân disponibile."
                  : "Proiectul va fi retras. Prestatorii nu vor mai putea aplica. Conversațiile existente rămân disponibile."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Renunță</Button>
              </DialogClose>
              <Button
                variant={confirm === "cancelled" ? "destructive" : "default"}
                disabled={pending}
                onClick={() => confirm && run(() => closeAction(projectId, confirm), () => setConfirm(null))}
              >
                <CheckCircle2 /> Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {["draft", "pending_review", "open"].includes(status) && (
        <label className="flex h-9 items-center gap-2 rounded-lg border bg-card px-3 text-sm shadow-xs">
          <Bot className="size-4 text-muted-foreground" />
          Aplicări automate
          <Switch
            checked={allowAutoBids}
            disabled={pending}
            onCheckedChange={(c) => run(() => toggleAutoBidsAction(projectId, c))}
            aria-label="Permite aplicări automate"
          />
        </label>
      )}
    </div>
  );
}
