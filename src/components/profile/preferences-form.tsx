"use client";

import { useActionState, useState } from "react";
import { savePreferencesAction } from "@/app/setari/actions";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export type Prefs = {
  matchFrequency: "instant" | "daily" | "weekly" | "off";
  messagesEmail: boolean;
  applicationUpdatesEmail: boolean;
  autoBidEmail: boolean;
  productEmail: boolean;
  minMatchScore: number;
};

const FREQ: { v: Prefs["matchFrequency"]; label: string; d: string }[] = [
  { v: "instant", label: "Instant", d: "Un email pentru fiecare proiect potrivit" },
  { v: "daily", label: "Zilnic", d: "Un rezumat la 08:00" },
  { v: "weekly", label: "Săptămânal", d: "Un rezumat luni dimineața" },
  { v: "off", label: "Fără email", d: "Doar în aplicație" },
];

function Toggle({ name, label, description, initial }: { name: string; label: string; description: string; initial: boolean }) {
  const [v, setV] = useState(initial);
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
      <input type="hidden" name={name} value={v ? "1" : "0"} />
      <Switch checked={v} onCheckedChange={setV} />
    </label>
  );
}

export function PreferencesForm({ initial, isProvider }: { initial: Prefs; isProvider: boolean }) {
  const [state, action] = useActionState(savePreferencesAction, null);
  const [freq, setFreq] = useState(initial.matchFrequency);
  const [score, setScore] = useState(initial.minMatchScore);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="matchFrequency" value={freq} />
      <input type="hidden" name="minMatchScore" value={score} />
      {isProvider && (
        <div className="space-y-3">
          <div className="text-sm font-medium">Proiecte noi potrivite</div>
          <div className="grid gap-2 sm:grid-cols-4">
            {FREQ.map((f) => (
              <button
                key={f.v}
                type="button"
                onClick={() => setFreq(f.v)}
                className={cn("rounded-lg border p-3 text-left text-sm", freq === f.v ? "border-primary bg-brand-soft ring-1 ring-primary" : "hover:bg-muted")}
              >
                <div className="font-medium">{f.label}</div>
                <div className="text-xs text-muted-foreground">{f.d}</div>
              </button>
            ))}
          </div>
          <div className="space-y-2 pt-1">
            <div className="flex justify-between text-sm">
              <span>Compatibilitate minimă pentru alerte</span>
              <span className="font-medium tabular-nums">{score}%</span>
            </div>
            <Slider min={30} max={100} step={5} value={[score]} onValueChange={(v) => setScore(v[0] ?? 60)} />
            <p className="text-xs text-muted-foreground">Un prag mai mare înseamnă mai puține alerte, dar mai relevante.</p>
          </div>
        </div>
      )}
      <div className="divide-y rounded-lg border px-3">
        <Toggle name="messagesEmail" label="Mesaje noi" description="Email când primești un mesaj în chat (max. unul la 15 minute per conversație)" initial={initial.messagesEmail} />
        <Toggle name="applicationUpdatesEmail" label="Oferte și aplicări" description="Oferte noi primite, oferte citite, selectate sau respinse" initial={initial.applicationUpdatesEmail} />
        {isProvider && <Toggle name="autoBidEmail" label="Auto Bid" description="Propuneri de confirmat și aplicări trimise automat" initial={initial.autoBidEmail} />}
        <Toggle name="productEmail" label="Noutăți despre platformă" description="Ocazional, funcții noi și sfaturi" initial={initial.productEmail} />
      </div>
      <FormMessage state={state} />
      <SubmitButton pendingText="Se salvează…">Salvează preferințele</SubmitButton>
    </form>
  );
}
