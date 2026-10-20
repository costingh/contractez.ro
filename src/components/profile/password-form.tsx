"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePasswordAction } from "@/app/setari/actions";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";

export function PasswordForm({ hasPassword = true }: { hasPassword?: boolean }) {
  const [state, action] = useActionState(changePasswordAction, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-3">
      {hasPassword ? (
        <Field label="Parola curentă" htmlFor="current">
          <Input id="current" name="current" type="password" autoComplete="current-password" required />
        </Field>
      ) : (
        <p className="text-sm text-muted-foreground">
          Te autentifici cu Google. Poți seta și o parolă, ca să intri și cu email + parolă.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Parola nouă" htmlFor="next" hint="Minimum 8 caractere.">
          <Input id="next" name="next" type="password" autoComplete="new-password" minLength={8} required />
        </Field>
        <Field label="Confirmă parola nouă" htmlFor="confirm">
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
        </Field>
      </div>
      <FormMessage state={state} />
      <SubmitButton variant="outline" pendingText="Se salvează…">
        {hasPassword ? "Schimbă parola" : "Setează parola"}
      </SubmitButton>
    </form>
  );
}
