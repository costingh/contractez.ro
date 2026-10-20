"use client";

import { useActionState, useEffect, useRef } from "react";
import { addFirstServiceAction } from "@/app/onboarding/actions";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { NativeSelect } from "@/components/shared/native-select";
import { Input } from "@/components/ui/input";
import { labels } from "@/config/site";

export function ServiceForm({ categories, submitLabel = "Adaugă serviciul" }: { categories: { id: number; name: string }[]; submitLabel?: string }) {
  const [state, formAction] = useActionState(addFirstServiceAction, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Categorie" htmlFor="svc-cat">
          <NativeSelect id="svc-cat" name="categoryId" required defaultValue={categories[0]?.id ?? ""}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Denumire serviciu" htmlFor="svc-title">
          <Input id="svc-title" name="title" placeholder="Ex: Montaj centrală termică" maxLength={120} required />
        </Field>
      </div>
      <Field label="Descriere scurtă" htmlFor="svc-desc" optional>
        <Input id="svc-desc" name="description" maxLength={2000} placeholder="Ce include, în cât timp livrezi" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Preț de la (lei)" htmlFor="svc-price" optional>
          <Input id="svc-price" name="priceFrom" type="number" min={0} />
        </Field>
        <Field label="Unitate" htmlFor="svc-unit">
          <NativeSelect id="svc-unit" name="priceUnit" defaultValue="hour">
            {(Object.keys(labels.priceUnit) as (keyof typeof labels.priceUnit)[]).map((u) => (
              <option key={u} value={u}>
                / {labels.priceUnit[u]}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <FormMessage state={state} />
      <SubmitButton variant="outline" pendingText="Se adaugă…">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
