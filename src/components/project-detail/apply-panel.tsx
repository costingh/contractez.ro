"use client";

import { AlertCircle, CheckCircle2, Loader2, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";
import { applyAction, draftProposalAction, type ApplyState } from "@/app/proiecte/[id]/actions";
import { Field } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { NativeSelect } from "@/components/shared/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const ERROR_LINKS: Record<string, { href: string; label: string }> = {
  quota: { href: "/abonament#planuri", label: "Vezi planurile" },
  provider_unverified: { href: "/verifica-email", label: "Confirmă emailul" },
  invoice_required: { href: "/profil", label: "Actualizează profilul" },
  not_provider: { href: "/onboarding?rol=prestator", label: "Activează profilul de prestator" },
};

export function ApplyPanel({
  projectId,
  remaining,
  limit,
  planName,
  renewsOn,
}: {
  projectId: string;
  remaining: number;
  limit: number;
  planName: string;
  renewsOn: string;
}) {
  const [state, action] = useActionState<ApplyState, FormData>(applyAction, null);
  const [message, setMessage] = useState("");
  const [drafting, startDraft] = useTransition();

  const generate = () =>
    startDraft(async () => {
      const res = await draftProposalAction(projectId);
      if (res.ok) {
        setMessage(res.text);
        toast.success("Propunere generată. Verific-o și personalizeaz-o înainte de trimitere.");
      } else toast.error(res.error);
    });

  if (state?.ok) {
    return (
      <div className="space-y-3 rounded-xl border border-success/25 bg-success/6 p-4 text-sm leading-relaxed dark:bg-success/10">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
          <span>{state.message}</span>
        </div>
        {state.conversationId && (
          <Button asChild size="sm" className="w-full">
            <Link href={`/mesaje/${state.conversationId}`}>Deschide conversația</Link>
          </Button>
        )}
      </div>
    );
  }

  const exhausted = remaining <= 0;
  const errLink = state && !state.ok && state.code ? ERROR_LINKS[state.code] : undefined;

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="rounded-xl border bg-surface px-3.5 py-3 text-sm dark:bg-muted/40">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Send className="size-4" /> Îți rămân <strong className="text-foreground tabular-nums">{remaining}</strong> din {limit} aplicări
          </span>
          <Link href="/abonament" className="text-xs font-medium text-brand underline-offset-4 hover:underline">
            Plan {planName}
          </Link>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-border" aria-hidden>
          <div
            className={exhausted ? "h-full rounded-full bg-destructive" : "h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--brand))]"}
            style={{ width: `${limit > 0 ? Math.max(4, (remaining / limit) * 100) : 0}%` }}
          />
        </div>
      </div>

      <Field
        label={
          <span className="flex w-full items-center justify-between">
            Mesajul tău către client
            <Button type="button" variant="ghost" size="xs" onClick={generate} disabled={drafting}>
              {drafting ? <Loader2 className="animate-spin" /> : <Sparkles className="text-brand" />} Generează cu AI
            </Button>
          </span>
        }
        htmlFor="apply-message"
        hint="Arată că ai înțeles cerința și propune pașii următori. Datele de contact le schimbați în chat."
      >
        <Textarea
          id="apply-message"
          name="message"
          rows={7}
          minLength={30}
          maxLength={5000}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Bună ziua! Am citit cererea și…"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
        <Field label="Preț estimativ (lei)" htmlFor="apply-price" optional>
          <Input id="apply-price" name="priceAmount" type="number" min={0} inputMode="numeric" />
        </Field>
        <Field label="Tip preț" htmlFor="apply-pt">
          <NativeSelect id="apply-pt" name="priceType" defaultValue="to_discuss">
            <option value="to_discuss">De discutat</option>
            <option value="fixed">Preț fix</option>
            <option value="hourly">Pe oră</option>
            <option value="monthly">Pe lună</option>
          </NativeSelect>
        </Field>
      </div>
      <Field label="Termen estimat (zile)" htmlFor="apply-days" optional>
        <Input id="apply-days" name="estimatedDays" type="number" min={1} inputMode="numeric" />
      </Field>

      {state && !state.ok && (
        <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/6 px-3.5 py-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div className="space-y-1">
            <p>{state.error}</p>
            {errLink && (
              <Link href={errLink.href} className="font-medium underline underline-offset-4">
                {errLink.label}
              </Link>
            )}
          </div>
        </div>
      )}

      {exhausted ? (
        <Button asChild className="w-full" size="lg">
          <Link href="/abonament">Ai folosit toate aplicările — vezi planurile</Link>
        </Button>
      ) : (
        <SubmitButton className="w-full" size="lg" pendingText="Se trimite oferta…">
          Trimite oferta
        </SubmitButton>
      )}
      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        {exhausted
          ? `Aplicările se reînnoiesc pe ${renewsOn}.`
          : "Aplicarea se socotește doar dacă oferta ajunge la client. Dacă proiectul se dovedește fraudulos, o restituim."}
      </p>
    </form>
  );
}
