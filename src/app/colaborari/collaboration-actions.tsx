"use client";

import { Ban, CheckCircle2, Flag } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
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
import type { ActionState } from "@/lib/action";
import { cancelAction, completeAction, confirmAction } from "./actions";

export function CollaborationActions({ id, status, isProvider }: { id: string; status: string; isProvider: boolean }) {
  const [pending, start] = useTransition();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const run = (fn: () => Promise<ActionState>, after?: () => void) =>
    start(async () => {
      const res = await fn();
      if (res?.ok) {
        toast.success(res.message ?? "Gata");
        after?.();
      } else if (res) toast.error(res.error);
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
        <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost" className="text-muted-foreground" disabled={pending}>
              <Ban /> Anulează
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Anulezi colaborarea?</DialogTitle>
              <DialogDescription>
                {isProvider
                  ? "Clientul va fi anunțat, iar proiectul lui se redeschide pentru alte oferte. Nu vă veți mai putea lăsa recenzii pentru această colaborare."
                  : "Prestatorul va fi anunțat, iar proiectul se redeschide pentru oferte (dacă nu a expirat). Nu vă veți mai putea lăsa recenzii pentru această colaborare."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Renunță</Button>
              </DialogClose>
              <Button variant="destructive" disabled={pending} onClick={() => run(() => cancelAction(id), () => setConfirmCancel(false))}>
                Anulează colaborarea
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
