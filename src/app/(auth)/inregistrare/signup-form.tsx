"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { signupAction } from "../actions";

export function SignupForm({ role, referral }: { role?: string; referral?: string }) {
  const [state, action] = useActionState(signupAction, null);
  const fe = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="rol" value={role ?? ""} />
      <input type="hidden" name="ref" value={referral ?? ""} />
      <Field label="Nume și prenume" htmlFor="name" error={fe?.name}>
        <Input id="name" name="name" autoComplete="name" required className="h-11" />
      </Field>
      <Field label="Email" htmlFor="email" error={fe?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required className="h-11" />
      </Field>
      <Field label="Parolă" htmlFor="password" hint="Minimum 8 caractere." error={fe?.password}>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className="h-11" />
      </Field>
      <label className="flex items-start gap-2.5 text-sm leading-relaxed">
        <Checkbox name="terms" className="mt-0.5" required />
        <span className="text-muted-foreground">
          Accept <Link href="/termeni" className="font-medium text-foreground underline underline-offset-4" target="_blank">termenii</Link> și{" "}
          <Link href="/confidentialitate" className="font-medium text-foreground underline underline-offset-4" target="_blank">politica de confidențialitate</Link>.
        </span>
      </label>
      <FormMessage state={state} />
      <SubmitButton className="mt-1 w-full" size="lg" pendingText="Se creează contul…">
        Creează cont
      </SubmitButton>
    </form>
  );
}
