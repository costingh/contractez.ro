"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { resendVerificationAction } from "../actions";

export function ResendButton() {
  const [state, action] = useActionState(resendVerificationAction, null);
  return (
    <form action={action} className="space-y-3">
      <FormMessage state={state} />
      <SubmitButton variant="outline" className="w-full" pendingText="Se trimite…">
        Retrimite emailul de confirmare
      </SubmitButton>
    </form>
  );
}
