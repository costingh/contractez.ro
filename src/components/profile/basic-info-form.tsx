"use client";

import { useActionState, useState } from "react";
import { saveBasicInfoAction } from "@/app/profil/actions";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { LocalityCombobox, type LocalityValue } from "@/components/shared/locality-combobox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { initials } from "@/lib/format";

export function BasicInfoForm({ name, avatarPath, locality }: { name: string; avatarPath: string | null; locality: LocalityValue }) {
  const [state, action] = useActionState(saveBasicInfoAction, null);
  const [preview, setPreview] = useState<string | null>(avatarPath ? `/api/files/${avatarPath}` : null);
  const [remove, setRemove] = useState(false);
  return (
    <form action={action} className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          {preview && !remove && <AvatarImage src={preview} alt="" />}
          <AvatarFallback className="text-lg">{initials(name)}</AvatarFallback>
        </Avatar>
        <div className="space-y-1.5">
          <label className="inline-flex cursor-pointer items-center rounded-lg border px-3 py-1.5 text-sm hover:bg-muted">
            Încarcă fotografie
            <input
              type="file"
              name="avatar"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setPreview(URL.createObjectURL(f));
                  setRemove(false);
                }
              }}
            />
          </label>
          {preview && (
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <input type="checkbox" name="removeAvatar" value="1" checked={remove} onChange={(e) => setRemove(e.target.checked)} /> Elimină fotografia
            </label>
          )}
          <p className="text-xs text-muted-foreground">JPG, PNG sau WebP, max 5 MB. Profilurile cu fotografie primesc mai multe răspunsuri.</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nume" htmlFor="name">
          <Input id="name" name="name" defaultValue={name} required maxLength={80} />
        </Field>
        <Field label="Localitate">
          <LocalityCombobox name="localityId" defaultValue={locality} />
        </Field>
      </div>
      <FormMessage state={state} />
      <SubmitButton pendingText="Se salvează…">Salvează</SubmitButton>
    </form>
  );
}
