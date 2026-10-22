"use client";

import { Star } from "lucide-react";
import { useActionState, useState } from "react";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { pluralRo } from "@/lib/text";
import { cn } from "@/lib/utils";
import { reviewAction } from "./actions";

const LABELS = ["", "Slab", "Sub așteptări", "OK", "Foarte bine", "Excelent"];

export function ReviewForm({ collaborationId, targetName, asClient }: { collaborationId: string; targetName: string; asClient: boolean }) {
  const [state, action] = useActionState(reviewAction, null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
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
  const shown = hover || rating;
  return (
    <form action={action} className="space-y-4 rounded-xl border bg-surface p-4 sm:p-5 dark:bg-muted/30">
      <input type="hidden" name="collaborationId" value={collaborationId} />
      <input type="hidden" name="rating" value={rating || ""} />
      <input type="hidden" name="hideAuthor" value={hide ? "1" : ""} />
      <div className="text-sm font-medium">Cum a fost colaborarea cu {targetName}?</div>
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            aria-label={pluralRo(n, "stea", "stele")}
            className="rounded-md p-0.5 transition-transform duration-150 hover:scale-115 active:scale-95"
          >
            <Star className={cn("size-7 transition-colors", n <= shown ? "fill-warning text-warning" : "text-muted-foreground/35")} />
          </button>
        ))}
        {shown > 0 && <span className="ml-2 text-sm font-medium text-foreground/80">{LABELS[shown]}</span>}
      </div>
      <Textarea name="comment" rows={3} maxLength={2000} placeholder="Ce a mers bine? Ce ar putea fi îmbunătățit? (opțional)" />
      <label className="flex items-start justify-between gap-3 text-sm">
        <span>
          <span className="font-medium">Ascunde numele meu public</span>
          <span className="block text-xs text-muted-foreground">
            Public vei apărea ca „{asClient ? "Client verificat" : "Prestator verificat"}”. {targetName} vede totuși cine a scris recenzia.
          </span>
        </span>
        <Switch checked={hide} onCheckedChange={setHide} />
      </label>
      <FormMessage state={state} />
      <SubmitButton size="sm" disabled={rating === 0} pendingText="Se trimite…">
        Trimite recenzia
      </SubmitButton>
    </form>
  );
}
