"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { forgotPasswordAction } from "../actions";
import { AuthCard } from "../auth-card";

export default function ForgotPasswordPage() {
  const [state, action] = useActionState(forgotPasswordAction, null);
  return (
    <AuthCard
      title="Ai uitat parola?"
      description="Îți trimitem un link pentru a seta o parolă nouă."
      footer={<Link href="/autentificare" className="font-medium text-foreground underline-offset-4 hover:underline">← Înapoi la autentificare</Link>}
    >
      <form action={action} className="space-y-5">
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required className="h-11" />
        </Field>
        <FormMessage state={state} />
        <SubmitButton className="w-full" size="lg" pendingText="Se trimite…">
          Trimite linkul
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
