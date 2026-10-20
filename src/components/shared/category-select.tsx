"use client";

import { NativeSelect } from "./native-select";

export type CategoryOption = { id: number; name: string; children: { id: number; name: string }[] };

/** Select cu grupuri: categorie principală → subcategorii. `allowRoot` permite alegerea categoriei principale. */
export function CategorySelect({
  categories,
  name = "categoryId",
  defaultValue,
  value,
  onChange,
  allowRoot = false,
  placeholder = "Alege categoria",
  id,
  required,
}: {
  categories: CategoryOption[];
  name?: string;
  defaultValue?: number | null;
  value?: number | null;
  onChange?: (id: number | null) => void;
  allowRoot?: boolean;
  placeholder?: string;
  id?: string;
  required?: boolean;
}) {
  return (
    <NativeSelect
      id={id}
      name={name}
      required={required}
      {...(value !== undefined ? { value: value ?? "" } : { defaultValue: defaultValue ?? "" })}
      onChange={(e) => onChange?.(e.target.value ? Number(e.target.value) : null)}
    >
      <option value="">{placeholder}</option>
      {categories.map((c) =>
        allowRoot ? (
          <optgroup key={c.id} label={c.name}>
            <option value={c.id}>{c.name} — toate</option>
            {c.children.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </optgroup>
        ) : (
          <optgroup key={c.id} label={c.name}>
            {c.children.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </optgroup>
        ),
      )}
    </NativeSelect>
  );
}
