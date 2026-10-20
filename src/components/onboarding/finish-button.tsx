"use client";

import { ArrowRight } from "lucide-react";
import { useActionState } from "react";
import { finishOnboardingAction } from "@/app/onboarding/actions";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";

export function FinishButton({ label }: { label: string }) {
  const [state, action] = useActionState(finishOnboardingAction, null);
  return (
    <form action={action} className="space-y-3">
      <FormMessage state={state} />
      <SubmitButton size="lg" className="w-full sm:w-auto" pendingText="Se finalizează…">
        {label} <ArrowRight />
      </SubmitButton>
    </form>
  );
}
