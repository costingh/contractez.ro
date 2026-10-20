"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";
import { removeCompanyVerificationAction, verifyCompanyAction } from "@/app/profil/actions";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CompanyVerification as Info } from "@/server/db/schema";

export function CompanyVerification({
  cui,
  verifiedAt,
  info,
  hasCompany,
}: {
  cui: string | null;
  verifiedAt: string | null;
  info: Info | null;
  /** Utilizatorul a declarat PFA/II/SRL sau are deja un CUI. Altfel secțiunea pornește restrânsă. */
  hasCompany: boolean;
}) {
  const [state, action] = useActionState(verifyCompanyAction, null);
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(hasCompany);
  const verified = Boolean(verifiedAt && info);

  if (!verified && !open) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border-strong p-5 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">
          Opțional. Dacă lucrezi ca persoană fizică nu ai nevoie de CUI: poți primi proiecte și aplica normal. Badge-ul ANAF e doar un plus de
          încredere pentru cei care au firmă.
        </p>
        <Button variant="outline" size="sm" className="shrink-0" onClick={() => setOpen(true)}>
          Am firmă — vreau s-o verific
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {verified && info ? (
        <div className="rounded-xl border border-success/25 bg-success/6 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" />
            <div className="min-w-0 flex-1 space-y-1 text-sm">
              <div className="font-semibold">{info.name}</div>
              <div className="text-muted-foreground">
                CUI {info.cui} · {info.legalForm.toLowerCase()}
                {info.regCom ? ` · ${info.regCom}` : ""}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                <span>{info.vatPayer ? "Plătitor de TVA" : "Neplătitor de TVA"}</span>
                <span>e-Factura: {info.eInvoice ? "da" : "nu"}</span>
                {info.caen && <span>CAEN principal: {info.caen}</span>}
                {info.county && <span>Sediu: {info.county.toLowerCase()}</span>}
              </div>
              <div className="text-xs text-muted-foreground">
                Verificat la ANAF pe {new Date(info.checkedAt).toLocaleDateString("ro-RO")}. Reverificăm automat lunar.
              </div>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await removeCompanyVerificationAction();
                  if (r?.ok) toast.success(r.message);
                })
              }
            >
              Elimină verificarea
            </Button>
          </div>
        </div>
      ) : (
        <>
          {info && !info.active && (
            <div className="flex gap-2 rounded-lg border border-warning/30 bg-warning/8 p-3 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>
                Ultima verificare: <strong>{info.name}</strong> apare inactivă sau radiată în registrul ANAF.
              </span>
            </div>
          )}
          <form action={action} className="space-y-3">
            <Field
              label="CUI / cod fiscal"
              htmlFor="cui"
              hint="Verificăm gratuit în registrul public ANAF: firma trebuie să fie activă. Datele oficiale (denumire, formă juridică) se completează automat."
            >
              <div className="flex gap-2">
                <Input id="cui" name="cui" defaultValue={cui ?? ""} placeholder="ex: RO12345678" inputMode="numeric" maxLength={14} required />
                <SubmitButton pendingText="Se verifică…" className="shrink-0">
                  <ShieldCheck /> Verifică la ANAF
                </SubmitButton>
              </div>
            </Field>
            <FormMessage state={state} />
          </form>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• Primești badge-ul „Firmă verificată ANAF” pe profil, pe card și în rezultatele căutării.</li>
            <li>• Clienții care cer factură te pot găsi cu filtrul „Doar firme verificate”.</li>
            <li>• Un CUI poate fi confirmat pe un singur cont. Folosirea datelor altei firme duce la suspendarea contului.</li>
          </ul>
        </>
      )}
    </div>
  );
}
