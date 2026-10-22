"use client";

import { useActionState, useEffect, useState } from "react";
import { unstable_rethrow } from "next/navigation";
import { saveBasicInfoAction } from "@/app/profil/actions";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { LocalityCombobox, type LocalityValue } from "@/components/shared/locality-combobox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/action";
import { initials } from "@/lib/format";
import { prepareImage, UPLOAD_FAILED } from "@/lib/upload-client";

type State = (NonNullable<ActionState> & { submittedName?: string }) | null;

export function BasicInfoForm({ name, avatarPath, locality }: { name: string; avatarPath: string | null; locality: LocalityValue }) {
  // Fotografia aleasă (deja micșorată în browser). React golește câmpul de fișier după fiecare trimitere,
  // așa că o păstrăm aici și o punem noi în cerere: la o eroare nu trebuie aleasă din nou.
  const [picked, setPicked] = useState<{ file: File; url: string } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [remove, setRemove] = useState(false);
  const [state, action] = useActionState(async (_prev: State, fd: FormData): Promise<State> => {
    if (picked && !fd.get("removeAvatar")) fd.set("avatar", picked.file);
    else fd.delete("avatar");
    let r: ActionState;
    try {
      r = await saveBasicInfoAction(null, fd);
    } catch (err) {
      unstable_rethrow(err); // redirect (ex. sesiune expirată)
      r = { ok: false, error: UPLOAD_FAILED };
    }
    if (r?.ok) {
      setPicked(null);
      setRemove(false);
      return r;
    }
    // La eroare React resetează formularul: numele introdus revine prin `defaultValue`.
    return { ...r, submittedName: String(fd.get("name") ?? "") } as State;
  }, null);

  useEffect(() => () => void (picked && URL.revokeObjectURL(picked.url)), [picked]);

  const saved = avatarPath ? `/api/files/${avatarPath}` : null;
  const preview = picked?.url ?? saved;
  const nameValue = state && !state.ok && state.submittedName !== undefined ? state.submittedName : name;

  return (
    <form action={action} className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          {preview && !remove && <AvatarImage src={preview} alt="" />}
          <AvatarFallback className="text-lg">{initials(name)}</AvatarFallback>
        </Avatar>
        <div className="space-y-1.5">
          <label className="inline-flex cursor-pointer items-center rounded-lg border px-3 py-1.5 text-sm hover:bg-muted has-focus-visible:ring-2 has-focus-visible:ring-ring">
            {preparing ? "Se pregătește…" : "Încarcă fotografie"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={preparing}
              onChange={async (e) => {
                const input = e.currentTarget;
                const f = input.files?.[0];
                if (!f) return;
                setPreparing(true);
                const r = await prepareImage(f, 1024);
                setPreparing(false);
                input.value = "";
                if (!r.ok) {
                  setFileError(r.error);
                  return;
                }
                setFileError(null);
                setPicked({ file: r.file, url: URL.createObjectURL(r.file) });
                setRemove(false);
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
          <Input id="name" name="name" defaultValue={nameValue} required maxLength={80} />
        </Field>
        <Field label="Localitate">
          <LocalityCombobox name="localityId" defaultValue={locality} />
        </Field>
      </div>
      <FormMessage state={fileError ? { ok: false, error: fileError } : state} />
      <SubmitButton pendingText="Se salvează…" disabled={preparing}>
        Salvează
      </SubmitButton>
    </form>
  );
}
