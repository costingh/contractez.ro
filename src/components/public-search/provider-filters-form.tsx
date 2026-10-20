import Link from "next/link";
import { CategorySelect, type CategoryOption } from "@/components/shared/category-select";
import { LocalityCombobox, type LocalityValue } from "@/components/shared/locality-combobox";
import { NativeSelect } from "@/components/shared/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProviderFilters } from "@/server/search/providers";

function Check({ name, checked, label }: { name: string; checked: boolean; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-0.5 text-sm text-foreground/90 hover:text-foreground">
      <input type="checkbox" name={name} value="1" defaultChecked={checked} className="size-4 rounded border-border-strong accent-primary dark:accent-brand" />
      {label}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-2.5 border-b pb-5 last:border-0 last:pb-0">
      <legend className="eyebrow mb-1.5">{title}</legend>
      {children}
    </fieldset>
  );
}

export const LANGUAGES: { code: string; name: string }[] = [
  { code: "ro", name: "Română" },
  { code: "en", name: "Engleză" },
  { code: "de", name: "Germană" },
  { code: "fr", name: "Franceză" },
  { code: "it", name: "Italiană" },
  { code: "es", name: "Spaniolă" },
  { code: "hu", name: "Maghiară" },
];

export function ProviderFiltersForm({
  filters,
  categories,
  locality,
}: {
  filters: ProviderFilters;
  categories: CategoryOption[];
  locality: LocalityValue;
}) {
  return (
    <form action="/prestatori" className="space-y-5">
      <input type="hidden" name="sort" value={filters.sort} />
      <Section title="Caută">
        <Input name="q" defaultValue={filters.q ?? ""} placeholder="ex: electrician, logo, contabil" aria-label="Cuvinte cheie" />
      </Section>

      <Section title="Serviciu">
        <CategorySelect categories={categories} name="cat" defaultValue={filters.cat ?? null} allowRoot placeholder="Toate serviciile" />
      </Section>

      <Section title="Zonă">
        <LocalityCombobox name="loc" defaultValue={locality} placeholder="Orice localitate" />
        <div className="space-y-1">
          <Label htmlFor="vf-r" className="text-xs text-muted-foreground">
            Rază în jurul localității
          </Label>
          <NativeSelect id="vf-r" name="r" defaultValue={String(filters.r ?? (locality ? 30 : ""))}>
            <option value="">Fără limită</option>
            {[10, 20, 30, 50, 100, 200].map((r) => (
              <option key={r} value={r}>
                {r} km
              </option>
            ))}
          </NativeSelect>
        </div>
        <Check name="onsite" checked={Boolean(filters.onsite)} label="Vine la fața locului" />
        <Check name="remote" checked={Boolean(filters.remote)} label="Lucrează remote" />
      </Section>

      <Section title="Factură & formă juridică">
        <NativeSelect name="inv" defaultValue={filters.inv ?? ""} aria-label="Factură">
          <option value="">Factură: indiferent</option>
          <option value="yes">Emite factură</option>
          <option value="no">Nu emite factură</option>
        </NativeSelect>
        <NativeSelect name="le" defaultValue={filters.le ?? ""} aria-label="Formă juridică">
          <option value="">Orice formă juridică</option>
          <option value="company">Firmă sau PFA</option>
          <option value="pfa">PFA / Întreprindere individuală</option>
          <option value="srl">SRL</option>
          <option value="none">Persoană fizică</option>
        </NativeSelect>
      </Section>

      <Section title="Preț">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="vf-rate" className="text-xs text-muted-foreground">Max lei/oră</Label>
            <Input id="vf-rate" name="rate" type="number" min={0} inputMode="numeric" defaultValue={filters.rate ?? ""} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="vf-budget" className="text-xs text-muted-foreground">Bugetul tău (lei)</Label>
            <Input id="vf-budget" name="budget" type="number" min={0} inputMode="numeric" defaultValue={filters.budget ?? ""} />
          </div>
        </div>
      </Section>

      <Section title="Reputație">
        <NativeSelect name="rating" defaultValue={String(filters.rating ?? "")} aria-label="Rating minim">
          <option value="">Orice rating</option>
          <option value="4.5">4,5★ și peste</option>
          <option value="4">4★ și peste</option>
          <option value="3">3★ și peste</option>
        </NativeSelect>
        <Check name="anaf" checked={Boolean(filters.anaf)} label="Doar firme verificate ANAF" />
        <Check name="done" checked={Boolean(filters.done)} label="Are colaborări confirmate" />
        <Check name="portfolio" checked={Boolean(filters.portfolio)} label="Are portofoliu" />
        <Check name="fast" checked={Boolean(filters.fast)} label="Răspunde în sub 3 ore" />
        <Check name="avail" checked={Boolean(filters.avail)} label="Disponibil acum" />
      </Section>

      <Section title="Limbă">
        <NativeSelect name="lang" defaultValue={filters.lang ?? ""} aria-label="Limbă vorbită">
          <option value="">Orice limbă</option>
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.name}
            </option>
          ))}
        </NativeSelect>
      </Section>

      <div className="flex gap-2 pt-1">
        <Button type="submit" className="flex-1">
          Aplică filtrele
        </Button>
        <Button asChild variant="ghost">
          <Link href="/prestatori">Resetează</Link>
        </Button>
      </div>
    </form>
  );
}
