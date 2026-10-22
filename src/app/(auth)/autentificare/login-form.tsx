"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { loginAction } from "../actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(loginAction, null);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required maxLength={200} className="h-11" />
      </Field>
      <Field
        label={
          <span className="flex w-full justify-between">
            Parolă
            <Link href="/parola-uitata" className="text-xs font-normal text-brand underline-offset-4 hover:underline">
              Ai uitat parola?
            </Link>
          </span>
        }
        htmlFor="password"
      >
        <Input id="password" name="password" type="password" autoComplete="current-password" required className="h-11" />
      </Field>
      <FormMessage state={state} />
      <SubmitButton className="mt-1 w-full" size="lg" pendingText="Se verifică…">
        Intră în cont
      </SubmitButton>
    </form>
  );
}
