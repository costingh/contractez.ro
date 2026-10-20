"use client";

import { BadgeCheck, Smartphone } from "lucide-react";
import { useActionState, useState } from "react";
import { sendOtpAction, verifyOtpAction } from "@/app/setari/actions";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";

/** Verificarea telefonului prin cod SMS (OTP, 6 cifre, valabil 10 minute). */
export function PhoneVerification({ verifiedPhone, devHint }: { verifiedPhone: string | null; devHint?: boolean }) {
  const [sent, sendAction] = useActionState(sendOtpAction, null);
  const [verified, verifyAction] = useActionState(verifyOtpAction, null);
  const [changing, setChanging] = useState(false);

  if ((verifiedPhone && !changing) || verified?.ok) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-success/25 bg-success/6 p-3.5 text-sm">
        <span className="flex items-center gap-2">
          <BadgeCheck className="size-4 text-success" /> Telefon verificat{verifiedPhone ? `: ${verifiedPhone}` : ""}
        </span>
        <button type="button" className="text-xs text-muted-foreground underline" onClick={() => setChanging(true)}>
          Schimbă numărul
        </button>
      </div>
    );
  }

  const codeSent = sent?.ok === true;
  return (
    <div className="space-y-3">
      <form action={sendAction} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Smartphone className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="phone" type="tel" inputMode="tel" placeholder="07xx xxx xxx" autoComplete="tel" className="pl-8" required />
        </div>
        <SubmitButton variant={codeSent ? "outline" : "default"} pendingText="Se trimite…">
          {codeSent ? "Retrimite codul" : "Trimite cod SMS"}
        </SubmitButton>
      </form>
      <FormMessage state={sent} />
      {codeSent && (
        <form action={verifyAction} className="flex flex-col gap-2 sm:flex-row">
          <Input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="Codul de 6 cifre" className="sm:max-w-48 tracking-widest" required autoFocus />
          <SubmitButton pendingText="Se verifică…">Verifică</SubmitButton>
        </form>
      )}
      <FormMessage state={verified} />
      {devHint && <p className="text-xs text-muted-foreground">Mod dezvoltare: codul apare în consola serverului (nu se trimite SMS real).</p>}
    </div>
  );
}
