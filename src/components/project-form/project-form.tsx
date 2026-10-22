"use client";

import { Bot, Info, Loader2, MapPin, Plus, Sparkles, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { categoryMetaAction, checkQualityAction, saveProjectAction, type CategoryMeta } from "@/app/proiecte/nou/actions";
import { ResendButton } from "@/app/(auth)/verifica-email/resend-button";
import { Field } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { CategorySelect, type CategoryOption } from "@/components/shared/category-select";
import { LocalityCombobox } from "@/components/shared/locality-combobox";
import { NativeSelect } from "@/components/shared/native-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { labels, rules } from "@/config/site";
import { cn } from "@/lib/utils";
import { QualityPanel } from "./quality-panel";
import type { BudgetType, ProjectFormState, ProjectFormValues, QualityView, WorkMode } from "./types";

type Props = {
  categories: CategoryOption[];
  value: ProjectFormValues;
  onChange: React.Dispatch<React.SetStateAction<ProjectFormValues>>;
  projectId?: string;
  /** Statusul curent (la editare). Pentru proiecte deschise publicarea înseamnă „salvează modificările”. */
  status?: string;
  initialQuality?: QualityView | null;
  emailVerified: boolean;
};

function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string; hint?: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-2", className)} role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
            value === o.value ? "border-primary bg-brand-soft font-medium ring-1 ring-primary/30" : "hover:bg-muted",
          )}
        >
          <div>{o.label}</div>
          {o.hint && <div className="text-xs font-normal text-muted-foreground">{o.hint}</div>}
        </button>
      ))}
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5 rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
      <div className="space-y-1">
        <h2 className="text-base font-semibold tracking-[-0.01em]">{title}</h2>
        {description && <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function ProjectForm({ categories, value: v, onChange, projectId, status, initialQuality, emailVerified }: Props) {
  const [state, action] = useActionState<ProjectFormState, FormData>(saveProjectAction, null);
  const [meta, setMeta] = useState<CategoryMeta | null>(null);
  const [skillInput, setSkillInput] = useState("");
  const [quality, setQuality] = useState<QualityView | null>(initialQuality ?? null);
  const [qualityError, setQualityError] = useState<string | null>(null);
  const [checking, startCheck] = useTransition();
  const modeTouched = useRef(Boolean(projectId) || v.source === "import");
  const set = <K extends keyof ProjectFormValues>(key: K, val: ProjectFormValues[K]) => onChange((prev) => ({ ...prev, [key]: val }));
  const fe = state && !state.ok ? state.fieldErrors : undefined;
  const effectiveProjectId = state?.projectId ?? projectId;
  const isOpen = status === "open";

  // Competențele sugerate și atributele specifice categoriei.
  const categoryId = v.categoryId;
  useEffect(() => {
    if (!categoryId) return;
    let cancelled = false;
    categoryMetaAction(categoryId).then((m) => {
      if (!cancelled) setMeta(m);
    });
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  const changeCategory = (id: number | null) => {
    onChange((prev) => ({ ...prev, categoryId: id, attributes: {} }));
    if (!id) {
      setMeta(null);
      return;
    }
    // La prima alegere, propunem modul de lucru tipic categoriei (ex: instalații → la fața locului).
    categoryMetaAction(id).then((m) => {
      if (!modeTouched.current) onChange((prev) => (prev.categoryId === id ? { ...prev, workMode: m.typicalWorkMode } : prev));
    });
  };

  const addSkill = (name: string) => {
    const s = name.trim();
    if (s.length < 2 || v.skills.some((x) => x.toLowerCase() === s.toLowerCase()) || v.skills.length >= 10) return;
    set("skills", [...v.skills, s]);
    setSkillInput("");
  };

  const suggestions = (meta?.skills ?? []).filter((s) => !v.skills.includes(s)).slice(0, 14);
  const descWords = v.description.trim().split(/\s+/).filter(Boolean).length;

  const runCheck = () => {
    setQualityError(null);
    startCheck(async () => {
      const res = await checkQualityAction(v);
      if (res.ok) setQuality(res.quality);
      else setQualityError(res.error);
    });
  };

  const budgetLabel = v.budgetType === "hourly" ? "lei / oră" : v.budgetType === "monthly" ? "lei / lună" : "lei";

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="payload" value={JSON.stringify(v)} />
      <input type="hidden" name="projectId" value={effectiveProjectId ?? ""} />

      <Section title="Ce ai nevoie" description="Un titlu clar și o descriere concretă aduc oferte mai bune și mai precise.">
        <Field label="Titlu" htmlFor="title" error={fe?.title} hint="Ex: Site de prezentare pentru restaurant, cu meniu și rezervări">
          <Input id="title" value={v.title} onChange={(e) => set("title", e.target.value)} maxLength={120} required />
        </Field>
        <Field label="Categorie" htmlFor="categoryId" error={fe?.categoryId}>
          <CategorySelect id="categoryId" name="_categoryId" categories={categories} value={v.categoryId} onChange={changeCategory} />
        </Field>
        <Field
          label="Descriere"
          htmlFor="description"
          error={fe?.description}
          hint={`${descWords} cuvinte · descrie ce trebuie făcut, ce ai deja și rezultatul dorit. Nu include telefon sau email — prestatorii te contactează prin chat.`}
        >
          <Textarea id="description" value={v.description} onChange={(e) => set("description", e.target.value)} rows={8} maxLength={8000} required />
        </Field>
        <Field label="Competențe necesare" optional hint="Ajută la potrivirea cu prestatorii potriviți. Apasă Enter pentru a adăuga.">
          <div className="space-y-2">
            {v.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {v.skills.map((s) => (
                  <Badge key={s} variant="secondary" className="gap-1 pr-1">
                    {s}
                    <button type="button" onClick={() => set("skills", v.skills.filter((x) => x !== s))} aria-label={`Elimină ${s}`} className="rounded-full p-0.5 hover:bg-background">
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill(skillInput);
                  }
                }}
                placeholder="Ex: WordPress, montaj gresie, Google Ads"
                maxLength={60}
              />
              <Button type="button" variant="outline" onClick={() => addSkill(skillInput)} disabled={!skillInput.trim()}>
                <Plus /> Adaugă
              </Button>
            </div>
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs text-muted-foreground">Sugestii:</span>
                {suggestions.map((s) => (
                  <button key={s} type="button" onClick={() => addSkill(s)} className="rounded-md border bg-card px-2 py-0.5 text-xs hover:border-border-strong hover:bg-muted">
                    + {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Field>
      </Section>

      {meta && meta.attributes.length > 0 && (
        <Section title="Detalii specifice" description="Opțional, dar îi ajută pe prestatori să estimeze corect.">
          <div className="grid gap-4 sm:grid-cols-2">
            {meta.attributes.map((a) => {
              const val = v.attributes[a.key];
              const setAttr = (x: string | number | boolean | null) => {
                const next = { ...v.attributes };
                if (x === null || x === "") delete next[a.key];
                else next[a.key] = x;
                set("attributes", next);
              };
              if (a.kind === "boolean") {
                return (
                  <label key={a.key} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm">
                    {a.label}
                    <Switch checked={val === true} onCheckedChange={(c) => setAttr(c ? true : null)} />
                  </label>
                );
              }
              if (a.kind === "select") {
                return (
                  <Field key={a.key} label={a.label} optional>
                    <NativeSelect value={typeof val === "string" ? val : ""} onChange={(e) => setAttr(e.target.value || null)}>
                      <option value="">—</option>
                      {(a.options ?? []).map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                );
              }
              return (
                <Field key={a.key} label={`${a.label}${a.unit ? ` (${a.unit})` : ""}`} optional>
                  <Input
                    type={a.kind === "number" ? "number" : "text"}
                    inputMode={a.kind === "number" ? "numeric" : undefined}
                    min={0}
                    value={val === undefined || typeof val === "boolean" ? "" : String(val)}
                    onChange={(e) => setAttr(a.kind === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)}
                  />
                </Field>
              );
            })}
          </div>
        </Section>
      )}

      <Section title="Buget" description="Proiectele cu buget orientativ primesc de 2-3 ori mai multe oferte.">
        <Segmented<BudgetType>
          className="grid-cols-2 sm:grid-cols-4"
          value={v.budgetType}
          onChange={(x) => set("budgetType", x)}
          options={(["fixed", "hourly", "monthly", "unknown"] as const).map((k) => ({ value: k, label: labels.budgetType[k] }))}
        />
        {v.budgetType !== "unknown" && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={`Minim (${budgetLabel})`} optional>
              <Input inputMode="numeric" value={v.budgetMin} onChange={(e) => set("budgetMin", e.target.value.replace(/[^\d]/g, ""))} placeholder="ex: 2000" />
            </Field>
            <Field label={`Maxim (${budgetLabel})`} error={fe?.budgetMax}>
              <Input inputMode="numeric" value={v.budgetMax} onChange={(e) => set("budgetMax", e.target.value.replace(/[^\d]/g, ""))} placeholder="ex: 3000" />
            </Field>
            <Field label="Ore estimate" optional>
              <Input inputMode="numeric" value={v.estimatedHours} onChange={(e) => set("estimatedHours", e.target.value.replace(/[^\d]/g, ""))} placeholder="dacă știi" />
            </Field>
          </div>
        )}
      </Section>

      <Section title="Unde se lucrează">
        <Segmented<WorkMode>
          className="sm:grid-cols-3"
          value={v.workMode}
          onChange={(x) => {
            modeTouched.current = true;
            set("workMode", x);
          }}
          options={[
            { value: "remote", label: "Remote", hint: "Online, de oriunde" },
            { value: "on_site", label: "La fața locului", hint: "Prestatorul vine la tine" },
            { value: "hybrid", label: "Hibrid", hint: "Online + întâlniri" },
          ]}
        />
        {v.workMode !== "remote" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Localitate" error={fe?.localityId} hint="Afișăm public doar localitatea, nu adresa exactă.">
              <LocalityCombobox name="_localityId" value={v.locality} onChange={(l) => set("locality", l)} />
            </Field>
            <Field label={`Prestatori pe o rază de ${v.radiusKm} km`}>
              <div className="flex h-9 items-center">
                <Slider min={5} max={200} step={5} value={[v.radiusKm]} onValueChange={([r]) => set("radiusKm", r)} />
              </div>
            </Field>
          </div>
        )}
        {v.workMode !== "remote" && !v.locality && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5" /> Alege localitatea ca să găsim prestatori din zonă.
          </p>
        )}
      </Section>

      <Section title="Alte detalii">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Factură">
            <NativeSelect value={v.invoice} onChange={(e) => set("invoice", e.target.value as ProjectFormValues["invoice"])}>
              {(["required", "preferred", "not_needed"] as const).map((k) => (
                <option key={k} value={k}>
                  {labels.invoice[k]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Când ai nevoie">
            <NativeSelect value={v.urgency} onChange={(e) => set("urgency", e.target.value as ProjectFormValues["urgency"])}>
              {(["urgent", "this_week", "this_month", "flexible"] as const).map((k) => (
                <option key={k} value={k}>
                  {labels.urgency[k]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Data de început" optional>
            <Input type="date" value={v.startDate} onChange={(e) => set("startDate", e.target.value)} />
          </Field>
          <Field label="Durată estimată" optional>
            <Input value={v.durationText} onChange={(e) => set("durationText", e.target.value)} maxLength={120} placeholder="ex: 2-3 săptămâni" />
          </Field>
        </div>
        {v.invoice === "required" && (
          <p className="flex gap-1.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" /> Doar prestatorii care emit factură (PFA, SRL etc.) vor putea aplica.
          </p>
        )}
        <label className="flex items-start justify-between gap-4 rounded-lg border p-3">
          <span className="space-y-0.5">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <Bot className="size-4 text-primary" /> Accept aplicări automate (Auto Bid)
            </span>
            <span className="block text-xs text-muted-foreground">
              Maximum {rules.defaultMaxAutoApplications} din cele {rules.defaultMaxApplications} locuri, după primele {rules.autoBidDelayMinutes} de minute
              rezervate aplicărilor manuale. Ofertele automate sunt marcate vizibil.
            </span>
          </span>
          <Switch checked={v.allowAutoBids} onCheckedChange={(c) => set("allowAutoBids", c)} />
        </label>
      </Section>

      <div className="space-y-3">
        {quality && <QualityPanel quality={quality} />}
        {qualityError && <p className="text-sm text-destructive">{qualityError}</p>}
        <Button type="button" variant="outline" onClick={runCheck} disabled={checking || !v.categoryId || v.description.trim().length < 20}>
          {checking ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {quality ? "Verifică din nou calitatea" : "Verifică calitatea cererii"}
        </Button>
      </div>

      {state && !state.ok && (
        <div role="alert" className="space-y-3 rounded-lg border border-destructive/25 bg-destructive/6 p-4 text-sm text-destructive">
          <p>{state.error}</p>
          {state.code === "email_unverified" && <ResendButton />}
        </div>
      )}
      {state?.warnings?.map((w) => (
        <p key={w} className="rounded-lg border bg-muted/50 p-3 text-sm">
          {w}
        </p>
      ))}

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-col-reverse gap-2 border-t bg-card/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur sm:bottom-[calc(1rem+env(safe-area-inset-bottom))] sm:mx-0 sm:flex-row sm:justify-end sm:rounded-xl sm:border sm:pb-3 sm:shadow-lg">
        {!isOpen && (
          <SubmitButton name="intent" value="draft" variant="outline" size="lg" pendingText="Se salvează…">
            Salvează ciornă
          </SubmitButton>
        )}
        <SubmitButton name="intent" value="publish" size="lg" pendingText={isOpen ? "Se salvează…" : "Se publică…"}>
          {isOpen ? "Salvează modificările" : status === "pending_review" ? "Trimite din nou la publicare" : "Publică gratuit"}
        </SubmitButton>
      </div>
      {!emailVerified && !isOpen && (
        <p className="text-center text-xs text-muted-foreground">Pentru publicare ai nevoie de emailul confirmat. Poți salva oricând o ciornă.</p>
      )}
    </form>
  );
}
