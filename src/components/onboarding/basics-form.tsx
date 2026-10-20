"use client";

import { Briefcase, Check, Search } from "lucide-react";
import { useActionState, useState } from "react";
import { saveBasicsAction } from "@/app/onboarding/actions";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { LocalityCombobox, type LocalityValue } from "@/components/shared/locality-combobox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function RoleCard({
  checked,
  onToggle,
  icon: Icon,
  title,
  description,
  points,
}: {
  checked: boolean;
  onToggle: () => void;
  icon: typeof Search;
  title: string;
  description: string;
  points: string[];
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={cn(
        "relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all",
        checked ? "border-primary bg-brand-soft ring-2 ring-primary/30" : "hover:border-primary/40 hover:bg-muted/50",
      )}
    >
      <span
        className={cn(
          "absolute top-3 right-3 flex size-5 items-center justify-center rounded-full border",
          checked ? "border-primary bg-primary text-primary-foreground" : "bg-background",
        )}
      >
        {checked && <Check className="size-3" />}
      </span>
      <Icon className="size-6 text-primary" />
      <span className="font-semibold">{title}</span>
      <span className="text-sm text-muted-foreground">{description}</span>
      <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
        {points.map((p) => (
          <li key={p}>• {p}</li>
        ))}
      </ul>
    </button>
  );
}

export function BasicsForm({
  initial,
  freeApplications,
}: {
  initial: { name: string; isClient: boolean; isProvider: boolean; locality: LocalityValue };
  freeApplications: number;
}) {
  const [state, action] = useActionState(saveBasicsAction, null);
  const [isClient, setClient] = useState(initial.isClient);
  const [isProvider, setProvider] = useState(initial.isProvider);
  const fe = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="isClient" value={isClient ? "1" : "0"} />
      <input type="hidden" name="isProvider" value={isProvider ? "1" : "0"} />
      <div className="space-y-2">
        <div className="text-sm font-medium">Cum vrei să folosești platforma?</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <RoleCard
            checked={isClient}
            onToggle={() => setClient((v) => !v)}
            icon={Search}
            title="Am nevoie de servicii"
            description="Public proiecte și aleg prestatorul potrivit."
            points={["Publicare gratuită", "Maximum 5 oferte relevante", "AI te ajută să scrii cererea"]}
          />
          <RoleCard
            checked={isProvider}
            onToggle={() => setProvider((v) => !v)}
            icon={Briefcase}
            title="Ofer servicii"
            description="Primesc proiecte compatibile și aplic."
            points={[`${freeApplications} aplicări gratuite în fiecare lună`, "Alerte doar pentru proiecte potrivite", "Chat gratuit cu clienții"]}
          />
        </div>
        <p className="text-xs text-muted-foreground">Poți alege ambele. Un singur cont, două roluri.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Numele tău" htmlFor="name" error={fe.name}>
          <Input id="name" name="name" defaultValue={initial.name} autoComplete="name" required />
        </Field>
        <Field label="Localitate" hint="Pentru proiecte și prestatori din zona ta." optional>
          <LocalityCombobox name="localityId" defaultValue={initial.locality} />
        </Field>
      </div>
      <FormMessage state={state} />
      <SubmitButton size="lg" className="w-full sm:w-auto" disabled={!isClient && !isProvider} pendingText="Se salvează…">
        Continuă
      </SubmitButton>
    </form>
  );
}
