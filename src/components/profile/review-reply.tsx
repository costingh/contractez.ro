"use client";

import { useActionState, useState } from "react";
import { replyReviewAction } from "@/app/profil/actions";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Textarea } from "@/components/ui/textarea";

export function ReviewReply({ reviewId, existing }: { reviewId: string; existing: string | null }) {
  const [state, action] = useActionState(replyReviewAction, null);
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" className="text-xs font-medium text-brand underline-offset-4 hover:underline" onClick={() => setOpen(true)}>
        {existing ? "Editează răspunsul" : "Răspunde public"}
      </button>
    );
  }
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="reviewId" value={reviewId} />
      <Textarea name="reply" defaultValue={existing ?? ""} rows={2} maxLength={1000} placeholder="Mulțumește clientului sau clarifică o situație, politicos." />
      <FormMessage state={state} />
      <SubmitButton size="sm" pendingText="Se publică…">
        Publică răspunsul
      </SubmitButton>
    </form>
  );
}
