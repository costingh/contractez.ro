"use client";

import { Star } from "lucide-react";
import { useActionState, useState } from "react";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { site } from "@/config/site";
import { reviewAction } from "./actions";
import { StarRating } from "./star-rating";

/**
 * Feedbackul lăsat separat de încheiere (de cealaltă parte sau în timpul colaborării).
 * `isPublic` = colaborarea a fost confirmată, deci devine recenzie publică; altfel e feedback privat.
 */
export function ReviewForm({
  collaborationId,
  targetName,
  asClient,
  isPublic,
  ended,
}: {
  collaborationId: string;
  targetName: string;
  asClient: boolean;
  isPublic: boolean;
  ended: boolean;
}) {
  const [state, action] = useActionState(reviewAction, null);
  const [rating, setRating] = useState(0);
  const [hide, setHide] = useState(false);
  if (state?.ok)
    return (
      <div className="enter flex items-center gap-3.5 rounded-xl border border-success/25 bg-success/6 p-4">
        <span className="flex gap-0.5 text-warning" aria-hidden>
          {Array.from({ length: rating }, (_, k) => (
            <Star key={k} className="size-4 fill-current" />
          ))}
        </span>
        <FormMessage state={state} />
      </div>
    );
  return (
    <form action={action} className="space-y-4 rounded-xl border bg-surface p-4 sm:p-5 dark:bg-muted/30">
      <input type="hidden" name="collaborationId" value={collaborationId} />
      <input type="hidden" name="rating" value={rating || ""} />
      <input type="hidden" name="hideAuthor" value={hide ? "1" : ""} />
      <div className="space-y-0.5">
        <div className="text-sm font-medium">Cum a fost colaborarea cu {targetName}?</div>
        {ended && <p className="text-xs text-muted-foreground">Colaborarea s-a încheiat. Te rugăm să lași un feedback scurt, durează un minut.</p>}
      </div>
      <StarRating value={rating} onChange={setRating} />
      <Textarea name="comment" rows={3} maxLength={2000} placeholder="Ce a mers bine? Ce ar putea fi îmbunătățit? (opțional)" />
      {isPublic ? (
        <label className="flex items-start justify-between gap-3 text-sm">
          <span>
            <span className="font-medium">Ascunde numele meu public</span>
            <span className="block text-xs text-muted-foreground">
              Public vei apărea ca „{asClient ? "Client verificat" : "Prestator verificat"}”. {targetName} vede totuși cine a scris recenzia.
            </span>
          </span>
          <Switch checked={hide} onCheckedChange={setHide} />
        </label>
      ) : (
        <p className="text-xs text-muted-foreground">Colaborarea nu a fost confirmată, așa că feedbackul rămâne privat: îl vede doar echipa {site.name}.</p>
      )}
      <FormMessage state={state} />
      <SubmitButton size="sm" disabled={rating === 0} pendingText="Se trimite…">
        {isPublic ? "Trimite recenzia" : "Trimite feedbackul"}
      </SubmitButton>
    </form>
  );
}
