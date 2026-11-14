"use client";

import { Ban, CheckCircle2, Flag } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/lib/action";
import { cn } from "@/lib/utils";
import { cancelAction, completeAction, confirmAction } from "./actions";
import { StarRating } from "./star-rating";

type Props = { id: string; status: string; isProvider: boolean; confirmed: boolean; otherName: string };

export function CollaborationActions({ id, status, isProvider, confirmed, otherName }: Props) {
  const [pending, start] = useTransition();
  const [ending, setEnding] = useState<"complete" | "cancel" | null>(null);
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
        <Button size="sm" variant="outline" disabled={pending} onClick={() => setEnding("complete")}>
          <Flag /> Marchează finalizată
        </Button>
      )}
      {status === "pending_confirmation" && !isProvider && (
        <span className="self-center text-xs text-muted-foreground">Așteaptă confirmarea prestatorului.</span>
      )}
      {(status === "active" || status === "pending_confirmation") && (
        <Button size="sm" variant="ghost" className="text-muted-foreground" disabled={pending} onClick={() => setEnding("cancel")}>
          <Ban /> Anulează
        </Button>
      )}
      <EndDialog
        mode={ending}
        onClose={() => setEnding(null)}
        isProvider={isProvider}
        confirmed={confirmed}
        otherName={otherName}
        pending={pending}
        onSubmit={(feedback, reopen) =>
          run(
            () => (ending === "complete" ? completeAction(id, feedback) : cancelAction(id, feedback, reopen)),
            () => setEnding(null),
          )
        }
      />
    </div>
  );
}

/** Încheierea colaborării (finalizare sau anulare) cere feedback; clientul care anulează alege ce se întâmplă cu proiectul. */
function EndDialog({
  mode,
  onClose,
  isProvider,
  confirmed,
  otherName,
  pending,
  onSubmit,
}: {
  mode: "complete" | "cancel" | null;
  onClose: () => void;
  isProvider: boolean;
  confirmed: boolean;
  otherName: string;
  pending: boolean;
  onSubmit: (feedback: { rating: number; comment: string; hideAuthor: boolean }, reopen: boolean) => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hide, setHide] = useState(false);
  const [reopen, setReopen] = useState(true);
  const cancel = mode === "cancel";
  const commentOk = !cancel || comment.trim().length >= 10;

  return (
    <Dialog open={mode !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{cancel ? "Anulezi colaborarea?" : "Marchezi colaborarea ca finalizată?"}</DialogTitle>
          <DialogDescription>
            {cancel
              ? `${otherName} primește o notificare, iar noi îi cerem și feedbackul despre colaborare.`
              : `Proiectul se închide, iar de la ${otherName} cerem și o recenzie.`}{" "}
            {confirmed ? "Feedbackul tău apare ca recenzie verificată pe profil." : "Colaborarea nu a fost confirmată, așa că feedbackul rămâne privat."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Cum a fost colaborarea cu {otherName}?</div>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder={cancel ? "De ce anulezi? (obligatoriu, câteva cuvinte)" : "Ce a mers bine? Ce ar putea fi îmbunătățit? (opțional)"}
          />
          {confirmed && (
            <label className="flex items-start justify-between gap-3 text-sm">
              <span>
                <span className="font-medium">Ascunde numele meu public</span>
                <span className="block text-xs text-muted-foreground">
                  Public vei apărea ca „{isProvider ? "Prestator verificat" : "Client verificat"}”. {otherName} vede totuși cine a scris.
                </span>
              </span>
              <Switch checked={hide} onCheckedChange={setHide} />
            </label>
          )}
          {cancel && !isProvider && (
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-medium">Ce faci cu proiectul?</legend>
              {[
                { v: true, t: "Proiectul nu e gata: redeschid aplicările", d: "Primește din nou oferte, cu locuri noi." },
                { v: false, t: "Închid proiectul", d: "Nu mai primește oferte." },
              ].map((o) => (
                <label
                  key={String(o.v)}
                  className={cn("flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm", reopen === o.v && "border-primary/50 bg-primary/5")}
                >
                  <input type="radio" name="reopen" className="mt-1 accent-primary" checked={reopen === o.v} onChange={() => setReopen(o.v)} />
                  <span>
                    <span className="font-medium">{o.t}</span>
                    <span className="block text-xs text-muted-foreground">{o.d}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Renunță</Button>
          </DialogClose>
          <Button
            variant={cancel ? "destructive" : "default"}
            disabled={pending || rating === 0 || !commentOk}
            onClick={() => onSubmit({ rating, comment, hideAuthor: hide }, reopen)}
          >
            {cancel ? "Anulează colaborarea" : "Finalizează"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
