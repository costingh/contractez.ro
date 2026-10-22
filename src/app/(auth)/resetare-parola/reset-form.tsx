"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPasswordAction } from "../actions";

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, null);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <Field label="Parolă nouă" htmlFor="password" hint="Minimum 8 caractere.">
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={200} required className="h-11" />
      </Field>
      <Field label="Confirmă parola" htmlFor="confirm">
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} maxLength={200} required className="h-11" />
      </Field>
      <FormMessage state={state} />
      {state && !state.ok && state.fieldErrors?.token ? (
        <Button asChild size="lg" className="w-full">
          <Link href="/parola-uitata">Cere un link nou</Link>
        </Button>
      ) : (
        <SubmitButton className="w-full" size="lg" pendingText="Se salvează…">
          Salvează parola
        </SubmitButton>
      )}
    </form>
  );
}
