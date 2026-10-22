"use client";

import { Loader2 } from "lucide-react";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { addFirstServiceAction } from "@/app/onboarding/actions";
import { updateServiceAction } from "@/app/profil/actions";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { NativeSelect } from "@/components/shared/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { labels } from "@/config/site";
import type { ActionState } from "@/lib/action";

type PriceUnit = keyof typeof labels.priceUnit;
/** `defaultUnit`: unitatea tipică pentru categorie (din prețurile orientative); implicit „proiect”. */
export type ServiceCategory = { id: number; name: string; defaultUnit?: PriceUnit };
export type EditableService = { id: string; categoryId: number; title: string; description: string; priceFrom: number | null; priceUnit: PriceUnit };

/**
 * Formularul de servicii: adăugare (onboarding, profil) sau editare (cu `service`, inline în listă).
 * La adăugare, unitatea urmează categoria aleasă până când utilizatorul o schimbă singur.
 */
export function ServiceForm({
  categories,
  submitLabel,
  service,
  onDone,
  onCancel,
}: {
  categories: ServiceCategory[];
  submitLabel?: string;
  service?: EditableService;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const editing = Boolean(service);
  const [state, setState] = useState<ActionState>(null);
  const [pending, startTransition] = useTransition();
  // Golirea după adăugare: formular nou (cheie nouă), nu `form.reset()`, care ar readuce select-urile la prima opțiune.
  const [formKey, setFormKey] = useState(0);
  const id = useId();
  const unitFor = (categoryId: number) => categories.find((c) => c.id === categoryId)?.defaultUnit ?? "project";
  const initialCategory = service?.categoryId ?? categories[0]?.id ?? 0;
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [unit, setUnit] = useState<PriceUnit>(service?.priceUnit ?? unitFor(initialCategory));
  const [unitTouched, setUnitTouched] = useState(editing);

  function submit(fd: FormData) {
    startTransition(async () => {
      const result = editing ? await updateServiceAction(null, fd) : await addFirstServiceAction(null, fd);
      if (result?.ok && editing) {
        toast.success(result.message ?? "Salvat");
        onDone?.();
        return;
      }
      setState(result);
      if (result?.ok) {
        setFormKey((k) => k + 1);
        setCategoryId(initialCategory);
        setUnit(unitFor(initialCategory));
        setUnitTouched(false);
      }
    });
  }

  return (
    <form
      key={formKey}
      className="space-y-3"
      // Fără resetarea automată a formularelor cu `action`: la o eroare, câmpurile completate rămân.
      onSubmit={(e) => {
        e.preventDefault();
        submit(new FormData(e.currentTarget));
      }}
    >
      {service && <input type="hidden" name="serviceId" value={service.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Categorie" htmlFor={`${id}-cat`}>
          <NativeSelect
            id={`${id}-cat`}
            name="categoryId"
            required
            value={categoryId}
            onChange={(e) => {
              const next = Number(e.target.value);
              setCategoryId(next);
              if (!unitTouched) setUnit(unitFor(next));
            }}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Denumire serviciu" htmlFor={`${id}-title`}>
          <Input id={`${id}-title`} name="title" defaultValue={service?.title} placeholder="Ex: Montaj centrală termică" minLength={3} maxLength={120} required />
        </Field>
      </div>
      <Field label="Descriere scurtă" htmlFor={`${id}-desc`} optional>
        <Input id={`${id}-desc`} name="description" defaultValue={service?.description} maxLength={2000} placeholder="Ce include, în cât timp livrezi" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Preț de la (lei)" htmlFor={`${id}-price`} optional>
          <Input id={`${id}-price`} name="priceFrom" type="number" inputMode="numeric" min={0} defaultValue={service?.priceFrom ?? undefined} />
        </Field>
        <Field label="Unitate" htmlFor={`${id}-unit`}>
          <NativeSelect
            id={`${id}-unit`}
            name="priceUnit"
            value={unit}
            onChange={(e) => {
              setUnit(e.target.value as PriceUnit);
              setUnitTouched(true);
            }}
          >
            {(Object.keys(labels.priceUnit) as PriceUnit[]).map((u) => (
              <option key={u} value={u}>
                / {labels.priceUnit[u]}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <FormMessage state={state} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant={editing ? "default" : "outline"} disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {pending ? (editing ? "Se salvează…" : "Se adaugă…") : (submitLabel ?? (editing ? "Salvează modificările" : "Adaugă serviciul"))}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Anulează
          </Button>
        )}
      </div>
    </form>
  );
}
