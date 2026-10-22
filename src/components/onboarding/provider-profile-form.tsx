"use client";

import { Lightbulb, Plus, Search, X } from "lucide-react";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { saveProviderProfileAction, suggestSkillsAction } from "@/app/onboarding/actions";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import type { CategoryOption } from "@/components/shared/category-select";
import { LocalityCombobox, type LocalityValue } from "@/components/shared/locality-combobox";
import { NativeSelect } from "@/components/shared/native-select";
import { SocialIcon } from "@/components/providers/social-links";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { labels } from "@/config/site";
import { SOCIAL_KEYS, SOCIAL_NETWORKS, type SocialLinks } from "@/lib/social-links";
import { cn } from "@/lib/utils";

export type ProviderFormInitial = {
  headline: string;
  bio: string;
  pricingModel: "hourly" | "fixed" | "quote";
  hourlyRate: number | null;
  minProjectBudget: number | null;
  remote: boolean;
  onSite: boolean;
  travelRadiusKm: number;
  locality: LocalityValue;
  yearsExperience: number | null;
  languages: string[];
  availability: "available" | "busy" | "unavailable";
  hoursPerWeek: number | null;
  websiteUrl: string | null;
  socialLinks: SocialLinks;
  certifications: string | null;
  categoryIds: number[];
  skills: string[];
  issuesInvoice: boolean;
  legalEntity: "none" | "pfa" | "ii" | "srl" | "other";
  companyName: string | null;
  companyCui: string | null;
};

export const emptyProviderForm: ProviderFormInitial = {
  headline: "",
  bio: "",
  pricingModel: "hourly",
  hourlyRate: null,
  minProjectBudget: null,
  remote: true,
  onSite: false,
  travelRadiusKm: 25,
  locality: null,
  yearsExperience: null,
  languages: ["ro"],
  availability: "available",
  hoursPerWeek: null,
  websiteUrl: null,
  socialLinks: {},
  certifications: null,
  categoryIds: [],
  skills: [],
  issuesInvoice: false,
  legalEntity: "none",
  companyName: null,
  companyCui: null,
};

const LANGUAGES: { code: string; label: string }[] = [
  { code: "ro", label: "Română" },
  { code: "en", label: "Engleză" },
  { code: "de", label: "Germană" },
  { code: "fr", label: "Franceză" },
  { code: "it", label: "Italiană" },
  { code: "es", label: "Spaniolă" },
  { code: "hu", label: "Maghiară" },
];

const MAX_CATEGORIES = 8;

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5 rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
      <div className="space-y-1">
        <h3 className="text-base font-semibold tracking-[-0.01em]">{title}</h3>
        {description && <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function ToggleRow({ label, description, checked, onChange, name }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void; name: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border p-3">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="block text-xs text-muted-foreground">{description}</span>}
      </span>
      <input type="hidden" name={name} value={checked ? "1" : "0"} />
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function CategoryPicker({ categories, value, onChange }: { categories: CategoryOption[]; value: number[]; onChange: (v: number[]) => void }) {
  const [query, setQuery] = useState("");
  const names = useMemo(() => {
    const m = new Map<number, string>();
    for (const c of categories) for (const s of c.children) m.set(s.id, s.name);
    return m;
  }, [categories]);
  const q = query.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const groups = categories
    .map((c) => ({ ...c, children: q ? c.children.filter((s) => norm(s.name).includes(q) || norm(c.name).includes(q)) : c.children }))
    .filter((c) => c.children.length > 0);
  const toggle = (id: number) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else if (value.length < MAX_CATEGORIES) onChange([...value, id]);
  };
  return (
    <div className="space-y-3">
      {value.map((id) => (
        <input key={id} type="hidden" name="categoryIds" value={id} />
      ))}
      <div className="flex min-h-9 flex-wrap gap-1.5">
        {value.length === 0 && <span className="text-sm text-muted-foreground">Nicio categorie aleasă încă.</span>}
        {value.map((id) => (
          <Badge key={id} className="h-7 gap-1 pr-1 text-sm">
            {names.get(id) ?? id}
            <button type="button" onClick={() => toggle(id)} className="rounded-full p-0.5 hover:bg-primary-foreground/20" aria-label="Elimină">
              <X className="size-3.5" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Caută: instalator, logo, SEO, meditații…" className="pl-8" />
      </div>
      <div className="max-h-72 space-y-3 overflow-y-auto rounded-lg border p-3">
        {groups.map((c) => (
          <div key={c.id}>
            <div className="mb-1.5 eyebrow">{c.name}</div>
            <div className="flex flex-wrap gap-1.5">
              {c.children.map((s) => {
                const active = value.includes(s.id);
                const disabled = !active && value.length >= MAX_CATEGORIES;
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggle(s.id)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-sm transition-colors",
                      active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-border-strong hover:bg-muted",
                      disabled && "cursor-not-allowed opacity-40",
                    )}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {groups.length === 0 && <p className="text-sm text-muted-foreground">Nicio categorie găsită. Încearcă „Alte servicii › Diverse”.</p>}
      </div>
      <p className="text-xs text-muted-foreground">
        {value.length}/{MAX_CATEGORIES} categorii. Alege doar ce faci cu adevărat — îți trimitem doar proiecte din aceste categorii.
      </p>
    </div>
  );
}

function SkillsPicker({ categoryIds, value, onChange }: { categoryIds: number[]; value: string[]; onChange: (v: string[]) => void }) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [, startTransition] = useTransition();
  const key = categoryIds.join(",");
  useEffect(() => {
    let alive = true;
    startTransition(async () => {
      const names = categoryIds.length ? await suggestSkillsAction(categoryIds) : [];
      if (alive) setSuggestions(names);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const add = (s: string) => {
    const name = s.trim().slice(0, 60);
    if (name.length < 2 || value.some((v) => v.toLowerCase() === name.toLowerCase()) || value.length >= 30) return;
    onChange([...value, name]);
  };
  const remaining = suggestions.filter((s) => !value.includes(s));
  return (
    <div className="space-y-3">
      {value.map((s) => (
        <input key={s} type="hidden" name="skills" value={s} />
      ))}
      <div className="flex flex-wrap gap-1.5">
        {value.map((s) => (
          <Badge key={s} variant="secondary" className="h-7 gap-1 pr-1 text-sm">
            {s}
            <button type="button" onClick={() => onChange(value.filter((v) => v !== s))} className="rounded-full p-0.5 hover:bg-foreground/10" aria-label="Elimină">
              <X className="size-3.5" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
              setDraft("");
            }
          }}
          placeholder="Adaugă o competență și apasă Enter"
        />
        <button
          type="button"
          onClick={() => {
            add(draft);
            setDraft("");
          }}
          className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border px-3 text-sm hover:bg-muted"
        >
          <Plus className="size-4" /> Adaugă
        </button>
      </div>
      {remaining.length > 0 && (
        <div>
          <div className="mb-1.5 text-xs text-muted-foreground">Sugestii pentru categoriile tale:</div>
          <div className="flex flex-wrap gap-1.5">
            {remaining.map((s) => (
              <button key={s} type="button" onClick={() => add(s)} className="rounded-md border border-dashed border-border-strong px-2.5 py-1 text-sm hover:border-solid hover:bg-muted">
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Câte un câmp pentru fiecare rețea; un câmp gol șterge linkul. Validarea se face pe server. */
function SocialLinksFields({ initial, errors }: { initial: SocialLinks; errors: Record<string, string> }) {
  return (
    <fieldset className="space-y-3 rounded-xl border bg-surface p-4 dark:bg-muted/30">
      <legend className="sr-only">Rețele sociale și profiluri profesionale</legend>
      <div aria-hidden className="text-sm font-medium">
        Rețele sociale și profiluri profesionale <span className="font-normal text-muted-foreground">(opțional)</span>
      </div>
      <p className="-mt-1 text-xs leading-relaxed text-muted-foreground">
        Apar ca iconițe pe profilul public. Lipește linkul profilului sau doar numele de utilizator (ex: @nume). Lasă câmpul gol ca să elimini linkul.
      </p>
      <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
        {SOCIAL_KEYS.map((key) => {
          const net = SOCIAL_NETWORKS[key];
          const value = initial[key] ?? "";
          return (
            <Field
              key={key}
              htmlFor={`social-${key}`}
              error={errors[`socialLinks.${key}`]}
              label={
                <span className="inline-flex items-center gap-1.5">
                  <SocialIcon network={key} className="size-3.5 text-muted-foreground" /> {net.label}
                </span>
              }
            >
              <Input
                // Remontăm câmpul după salvare, ca să afișeze linkul normalizat.
                key={value}
                id={`social-${key}`}
                name={`social.${key}`}
                defaultValue={value}
                placeholder={net.placeholder}
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                maxLength={300}
                aria-invalid={errors[`socialLinks.${key}`] ? true : undefined}
              />
            </Field>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Formularul complet de profil prestator — folosit în onboarding (pasul 2) și în /profil. */
export function ProviderProfileForm({
  categories,
  initial,
  context,
  submitLabel = "Salvează profilul",
}: {
  categories: CategoryOption[];
  initial: ProviderFormInitial;
  context: "onboarding" | "profile";
  submitLabel?: string;
}) {
  const [state, action] = useActionState(saveProviderProfileAction, null);
  const fe = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const [categoryIds, setCategoryIds] = useState(initial.categoryIds);
  const [skills, setSkills] = useState(initial.skills);
  const [pricing, setPricing] = useState(initial.pricingModel);
  const [remote, setRemote] = useState(initial.remote);
  const [onSite, setOnSite] = useState(initial.onSite);
  const [radius, setRadius] = useState(initial.travelRadiusKm || 25);
  const [locality, setLocality] = useState<LocalityValue>(initial.locality);
  const [invoice, setInvoice] = useState(initial.issuesInvoice);
  const [legal, setLegal] = useState(initial.legalEntity);
  const [bio, setBio] = useState(initial.bio);
  const bioWords = bio.trim().split(/\s+/).filter(Boolean).length;

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="context" value={context} />

      <Section title="Ce servicii oferi?" description="Categoriile determină ce proiecte îți recomandăm.">
        <CategoryPicker categories={categories} value={categoryIds} onChange={setCategoryIds} />
        {fe.categoryIds && <p className="text-xs text-destructive">{fe.categoryIds}</p>}
        <Field label="Competențe" hint="Competențele cresc scorul de compatibilitate cu proiectele care le cer.">
          <SkillsPicker categoryIds={categoryIds} value={skills} onChange={setSkills} />
        </Field>
      </Section>

      <Section title="Prezentare" description="Asta văd clienții în primul rând.">
        <Field label="Titlu profesional" htmlFor="headline" error={fe.headline} hint="Ex: „Electrician autorizat ANRE · Cluj” sau „Developer WordPress & WooCommerce”">
          <Input id="headline" name="headline" defaultValue={initial.headline} maxLength={120} required />
        </Field>
        <Field label="Despre tine" htmlFor="bio" error={fe.bio}>
          <Textarea id="bio" name="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={6} maxLength={4000} required />
        </Field>
        <div className="flex gap-3 rounded-lg border border-brand/20 bg-brand-soft p-4 text-sm leading-relaxed">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-brand" />
          <div className="space-y-1">
            <p className="font-medium">Un profil bun are 60–150 de cuvinte {bioWords > 0 && <span className="font-normal text-muted-foreground">(acum: {bioWords})</span>}</p>
            <ul className="list-disc space-y-0.5 pl-4 text-muted-foreground">
              <li>Ce faci concret și pentru cine (ex: apartamente, restaurante, firme mici).</li>
              <li>Experiența și 1–2 proiecte relevante, cu rezultate.</li>
              <li>Cum lucrezi: termene, garanție, ce e inclus în preț.</li>
            </ul>
          </div>
        </div>
        {/* Ancora „#linkuri” din panou: site-ul și, mai jos, rețelele sociale. */}
        <div id={context === "profile" ? "linkuri" : undefined} className="grid scroll-mt-28 gap-4 sm:grid-cols-2">
          <Field label="Ani de experiență" htmlFor="yearsExperience" optional>
            <Input id="yearsExperience" name="yearsExperience" type="number" min={0} max={70} defaultValue={initial.yearsExperience ?? ""} />
          </Field>
          <Field label="Site / portofoliu online" htmlFor="websiteUrl" optional error={fe.websiteUrl}>
            <Input id="websiteUrl" name="websiteUrl" type="url" placeholder="https://" defaultValue={initial.websiteUrl ?? ""} />
          </Field>
        </div>
        {context === "profile" && <SocialLinksFields initial={initial.socialLinks} errors={fe} />}
        <Field label="Certificări / autorizații" htmlFor="certifications" optional hint="Ex: ANRE grad II, Google Ads certified, traducător autorizat MJ">
          <Input id="certifications" name="certifications" defaultValue={initial.certifications ?? ""} maxLength={1000} />
        </Field>
      </Section>

      <Section title="Tarife">
        <input type="hidden" name="pricingModel" value={pricing} />
        <div className="grid gap-2 sm:grid-cols-3">
          {(["hourly", "fixed", "quote"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setPricing(m)}
              className={cn("rounded-lg border p-3 text-left text-sm transition-colors", pricing === m ? "border-primary bg-brand-soft ring-1 ring-primary" : "hover:bg-muted")}
            >
              <div className="font-medium">{labels.pricingModel[m]}</div>
              <div className="text-xs text-muted-foreground">
                {m === "hourly" ? "Lei pe oră de lucru" : m === "fixed" ? "Preț stabilit pe proiect" : "Evaluez fiecare cerere"}
              </div>
            </button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tarif orar (lei)" htmlFor="hourlyRate" optional={pricing !== "hourly"} error={fe.hourlyRate}>
            <Input id="hourlyRate" name="hourlyRate" type="number" min={0} defaultValue={initial.hourlyRate ?? ""} />
          </Field>
          <Field label="Buget minim per proiect (lei)" htmlFor="minProjectBudget" optional hint="Nu îți recomandăm proiecte sub această valoare.">
            <Input id="minProjectBudget" name="minProjectBudget" type="number" min={0} defaultValue={initial.minProjectBudget ?? ""} />
          </Field>
        </div>
      </Section>

      <Section title="Unde lucrezi?">
        <div className="grid gap-2 sm:grid-cols-2">
          <ToggleRow name="remote" label="Lucrez remote" description="Online, de oriunde din țară" checked={remote} onChange={setRemote} />
          <ToggleRow name="onSite" label="Mă deplasez la client" description="Lucrări la fața locului" checked={onSite} onChange={setOnSite} />
        </div>
        {!remote && !onSite && <p className="text-xs text-destructive">Alege cel puțin un mod de lucru.</p>}
        <Field label="Localitatea ta" error={fe.localityId} optional={!onSite} hint={onSite ? "Distanța până la proiecte se calculează de aici." : undefined}>
          <LocalityCombobox name="localityId" value={locality} onChange={setLocality} />
        </Field>
        {onSite && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Raza de deplasare</span>
              <span className="tabular-nums">{radius} km</span>
            </div>
            <input type="hidden" name="travelRadiusKm" value={radius} />
            <Slider min={5} max={200} step={5} value={[radius]} onValueChange={(v) => setRadius(v[0] ?? 25)} />
            <p className="text-xs text-muted-foreground">Primești doar proiecte fizice aflate în această rază.</p>
          </div>
        )}
      </Section>

      <Section title="Disponibilitate și limbi">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Disponibilitate" htmlFor="availability">
            <NativeSelect id="availability" name="availability" defaultValue={initial.availability}>
              {(["available", "busy", "unavailable"] as const).map((a) => (
                <option key={a} value={a}>
                  {labels.availability[a]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Ore disponibile pe săptămână" htmlFor="hoursPerWeek" optional>
            <Input id="hoursPerWeek" name="hoursPerWeek" type="number" min={1} max={80} defaultValue={initial.hoursPerWeek ?? ""} />
          </Field>
        </div>
        <Field label="Limbi vorbite">
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => (
              <label key={l.code} className="flex cursor-pointer items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-sm has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground">
                <input type="checkbox" name="languages" value={l.code} defaultChecked={initial.languages.includes(l.code)} className="accent-[var(--primary)]" />
                {l.label}
              </label>
            ))}
          </div>
        </Field>
      </Section>

      <Section title="Facturare" description="Mulți clienți (mai ales firmele) filtrează după prestatori care emit factură.">
        <ToggleRow name="issuesInvoice" label="Emit factură" description="PFA, II, SRL sau altă formă legală" checked={invoice} onChange={setInvoice} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Forma juridică" htmlFor="legalEntity">
            <NativeSelect id="legalEntity" name="legalEntity" value={legal} onChange={(e) => setLegal(e.target.value as ProviderFormInitial["legalEntity"])}>
              {(["none", "pfa", "ii", "srl", "other"] as const).map((le) => (
                <option key={le} value={le}>
                  {labels.legalEntity[le]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          {legal !== "none" && (
            <>
              <Field label="Denumire" htmlFor="companyName" optional>
                <Input id="companyName" name="companyName" defaultValue={initial.companyName ?? ""} maxLength={200} />
              </Field>
              <Field label="CUI" htmlFor="companyCui" optional error={fe.companyCui}>
                <Input id="companyCui" name="companyCui" placeholder="RO12345678" defaultValue={initial.companyCui ?? ""} maxLength={20} />
              </Field>
            </>
          )}
        </div>
        {invoice && legal === "none" && <p className="text-xs text-warning">Ai bifat că emiți factură — alege și forma juridică.</p>}
      </Section>

      <div className="sticky bottom-0 z-10 -mx-1 space-y-3 border-t bg-background/95 px-1 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur">
        <FormMessage state={state} />
        <SubmitButton size="lg" className="w-full sm:w-auto" pendingText="Se salvează…">
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
