"use client";

import { MailCheck } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { requestEmailChangeAction } from "@/app/setari/actions";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * „Schimbă adresa de email”: linkul de confirmare pleacă la adresa nouă; contul rămâne pe cea veche până la confirmare.
 * Conturile cu parolă confirmă cu parola curentă; cele create cu Google, printr-o reconectare recentă cu Google.
 */
export function EmailChangeForm({
  hasPassword,
  googleEnabled,
  pending,
}: {
  hasPassword: boolean;
  googleEnabled: boolean;
  pending: { newEmail: string } | null;
}) {
  const [state, action] = useActionState(requestEmailChangeAction, null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <div id="email" className="scroll-mt-24 space-y-3">
      {pending && !state?.ok && (
        <div role="status" className="flex items-start gap-2 rounded-lg border border-brand/20 bg-brand-soft p-3.5 text-sm">
          <MailCheck className="mt-0.5 size-4 shrink-0 text-brand" />
          <span className="min-w-0">
            Așteptăm confirmarea pentru <span className="font-medium break-all">{pending.newEmail}</span>. Deschide linkul din emailul trimis la acea adresă (verifică și Spam).
          </span>
        </div>
      )}
      {!open ? (
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          Schimbă adresa de email
        </Button>
      ) : (
        <form ref={ref} action={action} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Adresa nouă de email" htmlFor="new-email">
              <Input id="new-email" name="email" type="email" autoComplete="email" maxLength={200} required />
            </Field>
            {hasPassword && (
              <Field label="Parola curentă" htmlFor="email-change-password">
                <Input id="email-change-password" name="password" type="password" autoComplete="current-password" maxLength={200} required />
              </Field>
            )}
          </div>
          {!hasPassword && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              Te autentifici cu Google, așa că nu ai o parolă de confirmat. Pentru siguranță, cererea trebuie făcută în cel mult 15 minute de la
              autentificare.{" "}
              {googleEnabled && (
                <a href={`/api/auth/google?next=${encodeURIComponent("/setari#email")}`} className="font-medium text-brand underline-offset-4 hover:underline">
                  Reconectează-te cu Google
                </a>
              )}
            </p>
          )}
          <p className="text-xs leading-relaxed text-muted-foreground">
            Îți trimitem un link de confirmare la adresa nouă. Până îl deschizi, contul folosește adresa actuală.
          </p>
          <FormMessage state={state} />
          <div className="flex flex-wrap gap-2">
            <SubmitButton variant="outline" pendingText="Se trimite…">
              Trimite linkul de confirmare
            </SubmitButton>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Renunță
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
