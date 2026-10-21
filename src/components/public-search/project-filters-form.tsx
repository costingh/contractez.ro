import Link from "next/link";
import { CategorySelect, type CategoryOption } from "@/components/shared/category-select";
import { LocalityCombobox, type LocalityValue } from "@/components/shared/locality-combobox";
import { NativeSelect } from "@/components/shared/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProjectFilters } from "@/server/search/projects";

function Check({ name, value = "1", checked, label }: { name: string; value?: string; checked: boolean; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-0.5 text-sm text-foreground/90 hover:text-foreground">
      <input type="checkbox" name={name} value={value} defaultChecked={checked} className="size-4 rounded border-border-strong accent-primary dark:accent-brand" />
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

/** Formular GET (funcționează și fără JavaScript). */
export function ProjectFiltersForm({
  filters,
  categories,
  locality,
  showVerifiedFilter,
}: {
  filters: ProjectFilters;
  categories: CategoryOption[];
  locality: LocalityValue;
  /** Filtrul „telefon verificat” apare doar când verificarea prin SMS este activă. */
  showVerifiedFilter: boolean;
}) {
  return (
    <form action="/proiecte" className="space-y-5">
      <input type="hidden" name="sort" value={filters.sort} />
      <Section title="Cuvinte cheie">
        <Input name="q" defaultValue={filters.q ?? ""} placeholder="ex: WordPress, centrală, logo" aria-label="Cuvinte cheie" />
      </Section>

      <Section title="Domeniu">
        <CategorySelect categories={categories} name="cat" defaultValue={filters.cat ?? null} allowRoot placeholder="Toate domeniile" />
      </Section>

      <Section title="Buget (lei)">
        <div className="grid grid-cols-2 gap-2">
          <Input name="min" type="number" min={0} inputMode="numeric" defaultValue={filters.min ?? ""} placeholder="Minim" aria-label="Buget minim" />
          <Input name="max" type="number" min={0} inputMode="numeric" defaultValue={filters.max ?? ""} placeholder="Maxim" aria-label="Buget maxim" />
        </div>
        <NativeSelect name="bt" defaultValue={filters.bt ?? ""} aria-label="Tip buget">
          <option value="">Orice tip de buget</option>
          <option value="fixed">Preț fix</option>
          <option value="hourly">Tarif orar</option>
          <option value="monthly">Lunar</option>
          <option value="unknown">De discutat</option>
        </NativeSelect>
      </Section>

      <Section title="Mod de lucru">
        <Check name="mode" value="remote" checked={filters.mode.includes("remote")} label="Remote" />
        <Check name="mode" value="on_site" checked={filters.mode.includes("on_site")} label="La fața locului" />
        <Check name="mode" value="hybrid" checked={filters.mode.includes("hybrid")} label="Hibrid" />
      </Section>

      <Section title="Localitate">
        <LocalityCombobox name="loc" defaultValue={locality} placeholder="Orice localitate" />
        <div className="space-y-1">
          <Label htmlFor="pf-r" className="text-xs text-muted-foreground">
            Rază (km) pentru lucrările fizice
          </Label>
          <NativeSelect id="pf-r" name="r" defaultValue={String(filters.r ?? (locality ? 30 : ""))}>
            <option value="">Fără limită</option>
            {[10, 20, 30, 50, 100, 200].map((r) => (
              <option key={r} value={r}>
                {r} km
              </option>
            ))}
          </NativeSelect>
        </div>
      </Section>

      <Section title="Factură">
        <NativeSelect name="inv" defaultValue={filters.inv ?? ""} aria-label="Factură">
          <option value="">Indiferent</option>
          <option value="required">Doar cu factură obligatorie</option>
          <option value="not_required">Fără factură obligatorie</option>
        </NativeSelect>
      </Section>

      <Section title="Termen">
        <NativeSelect name="urg" defaultValue={filters.urg ?? ""} aria-label="Urgență">
          <option value="">Oricând</option>
          <option value="urgent">Urgent</option>
          <option value="this_week">Săptămâna aceasta</option>
          <option value="this_month">Luna aceasta</option>
        </NativeSelect>
        <NativeSelect name="days" defaultValue={String(filters.days ?? "")} aria-label="Publicat în ultimele">
          <option value="">Publicat oricând</option>
          <option value="1">Ultimele 24 de ore</option>
          <option value="3">Ultimele 3 zile</option>
          <option value="7">Ultima săptămână</option>
          <option value="30">Ultima lună</option>
        </NativeSelect>
      </Section>

      <Section title="Încredere & concurență">
        {showVerifiedFilter && <Check name="verified" checked={Boolean(filters.verified)} label="Client cu telefon verificat" />}
        <Check name="few" checked={Boolean(filters.few)} label="Sub 2 oferte primite" />
      </Section>

      <div className="flex gap-2 pt-1">
        <Button type="submit" className="flex-1">
          Aplică filtrele
        </Button>
        <Button asChild variant="ghost">
          <Link href="/proiecte">Resetează</Link>
        </Button>
      </div>
    </form>
  );
}
