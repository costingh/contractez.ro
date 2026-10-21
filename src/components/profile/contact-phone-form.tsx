"use client";

import { Smartphone } from "lucide-react";
import { useActionState } from "react";
import { saveContactPhoneAction } from "@/app/setari/actions";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { CONTACT_PHONE_HINT, formatPhone } from "@/lib/phone";

/** Telefon de contact, fără verificare SMS. Un câmp gol șterge numărul. */
export function ContactPhoneForm({ phone }: { phone: string | null }) {
  const [state, action] = useActionState(saveContactPhoneAction, null);
  const current = state?.ok ? (state.data?.phone ?? null) : phone;
  return (
    <div className="space-y-2">
      <form action={action} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Smartphone className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            key={current ?? ""}
            name="phone"
            type="tel"
            inputMode="tel"
            placeholder="07xx xxx xxx"
            autoComplete="tel"
            defaultValue={current ? formatPhone(current) : ""}
            maxLength={30}
            className="pl-8"
            aria-label="Telefon de contact"
            aria-describedby="contact-phone-hint"
          />
        </div>
        <SubmitButton variant="outline" pendingText="Se salvează…">
          Salvează
        </SubmitButton>
      </form>
      <p id="contact-phone-hint" className="text-xs text-muted-foreground">
        {CONTACT_PHONE_HINT}
      </p>
      <FormMessage state={state} />
    </div>
  );
}
