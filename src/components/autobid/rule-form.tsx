"use client";

import { Pencil, Plus } from "lucide-react";
import { useActionState, useState } from "react";
import { toast } from "sonner";
import { saveRuleAction } from "@/app/auto-bid/actions";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { NativeSelect } from "@/components/shared/native-select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type RuleFormValue = {
  id: string;
  name: string;
  enabled: boolean;
  mode: "review" | "automatic";
  categoryIds: number[];
  keywords: string[];
  excludeKeywords: string[];
  minScore: number;
  minBudget: number | null;
  maxBudget: number | null;
  workModes: string[];
  maxDistanceKm: number | null;
  requireVerifiedClient: boolean;
  dailyCap: number;
  template: string;
  priceAmount: number | null;
  priceType: "fixed" | "hourly" | "monthly" | "to_discuss";
  estimatedDays: number | null;
  personalizeWithAi: boolean;
};

const DEFAULT_TEMPLATE =
  "Bună ziua, {client}! Am văzut proiectul „{proiect}” și cred că vă pot ajuta. Lucrez de mai mulți ani în {categorie} și am livrat proiecte similare.\n\nAș propune o scurtă discuție ca să clarificăm detaliile, apoi vă trimit o ofertă exactă. Ce termen aveți în minte?";

const SAMPLE = { client: "Ioana", proiect: "Site de prezentare pentru restaurant", categorie: "Dezvoltare web", localitate: "Cluj-Napoca" };

function preview(t: string) {
  return t
    .replaceAll("{client}", SAMPLE.client)
    .replaceAll("{proiect}", SAMPLE.proiect)
    .replaceAll("{categorie}", SAMPLE.categorie)
    .replaceAll("{localitate}", SAMPLE.localitate);
}

const WORK_MODES = [
  { v: "remote", l: "Remote" },
  { v: "on_site", l: "La fața locului" },
  { v: "hybrid", l: "Hibrid" },
];

function Toggle({ name, label, hint, checked, onChange }: { name: string; label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-lg border bg-card p-3.5">
      <span className="space-y-0.5">
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
      <input type="hidden" name={name} value={checked ? "true" : "false"} />
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

export function RuleFormDialog({
  rule,
  categories,
  hasPlan,
  phoneVerification,
}: {
  rule?: RuleFormValue;
  categories: { id: number; name: string }[];
  hasPlan: boolean;
  /** Fără verificare SMS opțiunea „doar clienți cu telefon verificat” e ascunsă (valoarea salvată se păstrează). */
  phoneVerification: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(async (prev: Awaited<ReturnType<typeof saveRuleAction>>, fd: FormData) => {
    const res = await saveRuleAction(prev, fd);
    if (res?.ok) {
      toast.success(res.message);
      setOpen(false);
    }
    return res;
  }, null);
  const [v, setV] = useState<RuleFormValue>(
    rule ?? {
      id: "",
      name: "Regula mea",
      enabled: true,
      mode: "review",
      categoryIds: [],
      keywords: [],
      excludeKeywords: [],
      minScore: 80,
      minBudget: null,
      maxBudget: null,
      workModes: ["remote", "on_site", "hybrid"],
      maxDistanceKm: null,
      requireVerifiedClient: false,
      dailyCap: 3,
      template: DEFAULT_TEMPLATE,
      priceAmount: null,
      priceType: "to_discuss",
      estimatedDays: null,
      personalizeWithAi: true,
    },
  );
  const [kw, setKw] = useState(v.keywords.join(", "));
  const [ex, setEx] = useState(v.excludeKeywords.join(", "));
  const set = <K extends keyof RuleFormValue>(k: K, val: RuleFormValue[K]) => setV((p) => ({ ...p, [k]: val }));
  const fe = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {rule ? (
          <Button variant="ghost" size="sm">
            <Pencil /> Editează
          </Button>
        ) : (
          <Button>
            <Plus /> Regulă nouă
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{rule ? "Editează regula Auto Bid" : "Regulă Auto Bid nouă"}</DialogTitle>
          <DialogDescription>Platforma aplică doar la proiectele care respectă toate condițiile tale, cu mesajul aprobat de tine.</DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-5">
          <input type="hidden" name="id" value={v.id} />
          <input type="hidden" name="minScore" value={v.minScore} />
          <input type="hidden" name="dailyCap" value={v.dailyCap} />
          <input type="hidden" name="mode" value={v.mode} />
          {v.categoryIds.map((id) => (
            <input key={id} type="hidden" name="categoryIds" value={id} />
          ))}
          {v.workModes.map((m) => (
            <input key={m} type="hidden" name="workModes" value={m} />
          ))}

          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <Field label="Numele regulii" htmlFor="rule-name" error={fe?.name}>
              <Input id="rule-name" name="name" maxLength={80} value={v.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <label className="flex h-9 items-center gap-2 text-sm">
              <input type="hidden" name="enabled" value={v.enabled ? "true" : "false"} />
              <Switch checked={v.enabled} onCheckedChange={(c) => set("enabled", c)} /> Activă
            </label>
          </div>

          <div className="space-y-2">
            <Label>Mod de operare</Label>
            <RadioGroup value={v.mode} onValueChange={(m) => set("mode", m as RuleFormValue["mode"])} className="grid gap-2 sm:grid-cols-2">
              {[
                { val: "review", t: "Propune, eu confirm", d: "Pregătim mesajul și îți trimitem o notificare. Aplici cu un click, după ce îl verifici." },
                { val: "automatic", t: "Aplică automat", d: "Aplicăm imediat ce proiectul respectă regulile. Poți opri oricând." },
              ].map((o) => (
                <label key={o.val} className={cn("flex cursor-pointer gap-3 rounded-lg border bg-card p-3.5 transition-colors hover:border-border-strong", v.mode === o.val && "border-primary ring-1 ring-primary")}>
                  <RadioGroupItem value={o.val} className="mt-0.5" />
                  <span>
                    <span className="block text-sm font-medium">{o.t}</span>
                    <span className="block text-xs text-muted-foreground">{o.d}</span>
                  </span>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Categorii</Label>
            <p className="text-xs text-muted-foreground">Nicio categorie bifată = toate categoriile din profilul tău.</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const on = v.categoryIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => set("categoryIds", on ? v.categoryIds.filter((x) => x !== c.id) : [...v.categoryIds, c.id])}
                    className={cn("rounded-md border px-3 py-1.5 text-sm transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-border-strong hover:bg-muted")}
                  >
                    {c.name}
                  </button>
                );
              })}
              {categories.length === 0 && <span className="text-sm text-muted-foreground">Adaugă categorii în profil.</span>}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Compatibilitate minimă</Label>
              <span className="text-sm font-semibold tabular-nums">{v.minScore}%</span>
            </div>
            <Slider min={50} max={100} step={5} value={[v.minScore]} onValueChange={([n]) => set("minScore", n)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Buget minim (lei)" htmlFor="minBudget" optional error={fe?.minBudget}>
              <Input id="minBudget" name="minBudget" inputMode="numeric" value={v.minBudget ?? ""} onChange={(e) => set("minBudget", e.target.value ? Number(e.target.value) || null : null)} />
            </Field>
            <Field label="Buget maxim (lei)" htmlFor="maxBudget" optional error={fe?.maxBudget}>
              <Input id="maxBudget" name="maxBudget" inputMode="numeric" value={v.maxBudget ?? ""} onChange={(e) => set("maxBudget", e.target.value ? Number(e.target.value) || null : null)} />
            </Field>
          </div>

          <div className="space-y-2">
            <Label>Mod de lucru acceptat</Label>
            <div className="flex flex-wrap gap-4">
              {WORK_MODES.map((m) => (
                <label key={m.v} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={v.workModes.includes(m.v)}
                    onCheckedChange={(c) => set("workModes", c ? [...v.workModes, m.v] : v.workModes.filter((x) => x !== m.v))}
                  />
                  {m.l}
                </label>
              ))}
            </div>
            {fe?.workModes && <p className="text-xs text-destructive">{fe.workModes}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Distanță maximă (km)" htmlFor="maxDistanceKm" optional hint="Doar pentru lucrări la fața locului.">
              <Input id="maxDistanceKm" name="maxDistanceKm" inputMode="numeric" value={v.maxDistanceKm ?? ""} onChange={(e) => set("maxDistanceKm", e.target.value ? Number(e.target.value) || null : null)} />
            </Field>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Aplicări automate / zi</Label>
                <span className="text-sm font-semibold tabular-nums">{v.dailyCap}</span>
              </div>
              <Slider min={1} max={10} step={1} value={[v.dailyCap]} onValueChange={([n]) => set("dailyCap", n)} className="pt-2" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cuvinte cheie obligatorii" htmlFor="keywords" optional hint="Separate prin virgulă. Măcar unul trebuie să apară.">
              <Input id="keywords" name="keywords" value={kw} onChange={(e) => setKw(e.target.value)} />
            </Field>
            <Field label="Cuvinte excluse" htmlFor="excludeKeywords" optional hint="Ex: urgent, gratuit, voluntariat">
              <Input id="excludeKeywords" name="excludeKeywords" value={ex} onChange={(e) => setEx(e.target.value)} />
            </Field>
          </div>

          <Field
            label="Mesajul aprobat"
            htmlFor="template"
            error={fe?.template}
            hint="Variabile: {client}, {proiect}, {categorie}, {localitate}. Nu promite termene sau prețuri pe care nu le-ai stabilit mai jos."
          >
            <Textarea id="template" name="template" rows={6} maxLength={3000} value={v.template} onChange={(e) => set("template", e.target.value)} />
          </Field>
          <div className="rounded-lg border bg-surface p-4 text-sm dark:bg-muted/30">
            <div className="eyebrow mb-2">Previzualizare</div>
            <p className="leading-relaxed whitespace-pre-line">{preview(v.template)}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Tip preț" htmlFor="priceType">
              <NativeSelect id="priceType" name="priceType" value={v.priceType} onChange={(e) => set("priceType", e.target.value as RuleFormValue["priceType"])}>
                <option value="to_discuss">De discutat</option>
                <option value="fixed">Preț fix</option>
                <option value="hourly">Pe oră</option>
                <option value="monthly">Pe lună</option>
              </NativeSelect>
            </Field>
            <Field label="Preț (lei)" htmlFor="priceAmount" error={fe?.priceAmount}>
              <Input
                id="priceAmount"
                name="priceAmount"
                inputMode="numeric"
                disabled={v.priceType === "to_discuss"}
                value={v.priceAmount ?? ""}
                onChange={(e) => set("priceAmount", e.target.value ? Number(e.target.value) || null : null)}
              />
            </Field>
            <Field label="Termen (zile)" htmlFor="estimatedDays" optional>
              <Input id="estimatedDays" name="estimatedDays" inputMode="numeric" value={v.estimatedDays ?? ""} onChange={(e) => set("estimatedDays", e.target.value ? Number(e.target.value) || null : null)} />
            </Field>
          </div>

          <div className="space-y-2">
            <Toggle
              name="personalizeWithAi"
              label="Personalizează mesajul cu AI"
              hint="Adaptează ușor mesajul la fiecare proiect, fără să schimbe prețul sau promisiunile."
              checked={v.personalizeWithAi}
              onChange={(c) => set("personalizeWithAi", c)}
            />
            {phoneVerification ? (
              <Toggle
                name="requireVerifiedClient"
                label="Doar clienți cu telefon verificat"
                checked={v.requireVerifiedClient}
                onChange={(c) => set("requireVerifiedClient", c)}
              />
            ) : (
              <input type="hidden" name="requireVerifiedClient" value={v.requireVerifiedClient ? "true" : "false"} />
            )}
          </div>

          {!hasPlan && (
            <p className="rounded-lg border border-warning/30 bg-warning/8 px-4 py-3 text-sm leading-relaxed">
              Regula se salvează acum și pornește după ce activezi un plan cu Auto Bid (Pro sau Business).
            </p>
          )}
          <FormMessage state={state && !state.ok ? state : null} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Renunță
            </Button>
            <SubmitButton pendingText="Se salvează…">Salvează regula</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
