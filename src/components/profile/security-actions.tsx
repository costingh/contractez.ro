"use client";

import { Download } from "lucide-react";
import { useActionState, useState } from "react";
import { deleteAccountAction, logoutEverywhereAction } from "@/app/setari/actions";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function LogoutEverywhere() {
  const [state, action] = useActionState(logoutEverywhereAction, null);
  return (
    <form action={action} className="space-y-2">
      <SubmitButton variant="outline" pendingText="Se deconectează…">
        Ieși de pe toate celelalte dispozitive
      </SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

export function ExportData() {
  return (
    <Button asChild variant="outline">
      <a href="/api/account/export" download>
        <Download /> Descarcă datele mele (JSON)
      </a>
    </Button>
  );
}

export function DeleteAccount() {
  const [state, action] = useActionState(deleteAccountAction, null);
  const [text, setText] = useState("");
  const ok = ["ȘTERGE", "ŞTERGE", "STERGE"].includes(text.trim().toUpperCase());
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Șterge contul</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ștergi definitiv contul?</DialogTitle>
          <DialogDescription>
            Profilul și datele de identificare vor fi eliminate, proiectele deschise anulate, iar aplicările active retrase. Abonamentul plătit se anulează imediat, fără alte plăți.
            Păstrăm doar evidențele financiare cerute de lege, anonimizate.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-3">
          <label className="block space-y-1.5 text-sm">
            <span>
              Scrie <span className="font-semibold">ȘTERGE</span> pentru a confirma:
            </span>
            <Input name="confirm" value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" />
          </label>
          <FormMessage state={state} />
          <DialogFooter>
            <SubmitButton variant="destructive" disabled={!ok} pendingText="Se șterge…">
              Șterge definitiv
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
