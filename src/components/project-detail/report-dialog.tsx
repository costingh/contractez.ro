"use client";

import { Flag } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { reportAction } from "@/app/proiecte/[id]/actions";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { NativeSelect } from "@/components/shared/native-select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const REASONS: { value: string; label: string }[] = [
  { value: "fake_project", label: "Proiect fals / nu există cerere reală" },
  { value: "fraud", label: "Tentativă de fraudă" },
  { value: "spam", label: "Spam sau reclamă" },
  { value: "duplicate", label: "Duplicat" },
  { value: "abusive", label: "Limbaj abuziv" },
  { value: "inappropriate", label: "Conținut nepotrivit" },
  { value: "other", label: "Alt motiv" },
];

export function ReportDialog({
  targetType,
  targetId,
  signedIn,
  label = "Raportează",
}: {
  targetType: "project" | "user" | "review";
  targetId: string;
  signedIn: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(reportAction, null);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Flag /> {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Raportează</DialogTitle>
          <DialogDescription>Raportările sunt confidențiale. Dacă un proiect este confirmat fraudulos, aplicările prestatorilor sunt restituite.</DialogDescription>
        </DialogHeader>
        {!signedIn ? (
          <p className="text-sm">
            <Link href="/autentificare" className="font-medium text-brand underline-offset-4 hover:underline">
              Autentifică-te
            </Link>{" "}
            pentru a trimite o raportare.
          </p>
        ) : state?.ok ? (
          <FormMessage state={state} />
        ) : (
          <form action={action} className="space-y-4">
            <input type="hidden" name="targetType" value={targetType} />
            <input type="hidden" name="targetId" value={targetId} />
            <Field label="Motiv" htmlFor="report-reason">
              <NativeSelect id="report-reason" name="reason" required defaultValue="">
                <option value="" disabled>
                  Alege motivul
                </option>
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Detalii" htmlFor="report-details" optional>
              <Textarea id="report-details" name="details" rows={4} maxLength={2000} />
            </Field>
            <FormMessage state={state} />
            <SubmitButton className="w-full" pendingText="Se trimite…">
              Trimite raportarea
            </SubmitButton>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
