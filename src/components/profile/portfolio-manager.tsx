"use client";

import { ExternalLink, ImageIcon, Trash2 } from "lucide-react";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { toast } from "sonner";
import { addPortfolioAction, deletePortfolioAction } from "@/app/profil/actions";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/lib/action";
import { prepareImage, UPLOAD_FAILED } from "@/lib/upload-client";
import { safeWebUrl } from "@/lib/web-url";

type State = (NonNullable<ActionState> & { submitted?: { title: string; url: string; description: string } }) | null;

export type PortfolioRow = { id: string; title: string; description: string; url: string | null; imagePath: string | null };

export function PortfolioManager({ items }: { items: PortfolioRow[] }) {
  // Imaginea aleasă, micșorată în browser; o păstrăm în stare pentru că React golește câmpul de fișier
  // după fiecare trimitere (la o eroare nu trebuie aleasă din nou).
  const [image, setImage] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [state, action] = useActionState(async (_prev: State, fd: FormData): Promise<State> => {
    if (image) fd.set("image", image);
    else fd.delete("image");
    let r: ActionState;
    try {
      r = await addPortfolioAction(null, fd);
    } catch (err) {
      unstable_rethrow(err); // redirect (ex. sesiune expirată)
      r = { ok: false, error: UPLOAD_FAILED };
    }
    if (r?.ok) {
      setImage(null);
      return r;
    }
    // La eroare React resetează formularul: valorile trimise revin prin `defaultValue`.
    const str = (k: string) => String(fd.get(k) ?? "");
    return { ...r, submitted: { title: str("title"), url: str("url"), description: str("description") } } as State;
  }, null);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  const sub = state && !state.ok ? state.submitted : undefined;
  const fileRef = useRef<HTMLInputElement>(null);
  // După o eroare React golește câmpul de fișier; îl repunem, ca utilizatorul să vadă că imaginea e încă aleasă.
  useEffect(() => {
    const el = fileRef.current;
    if (!el || !image || el.files?.length) return;
    try {
      const dt = new DataTransfer();
      dt.items.add(image);
      el.files = dt.files;
    } catch {
      /* browser fără DataTransfer: rămâne indiciul de sub câmp */
    }
  }, [state, image]);
  const fe = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  return (
    <div className="space-y-5">
      {items.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <div key={it.id} className="overflow-hidden rounded-2xl border bg-card shadow-xs">
              <div className="flex aspect-[4/3] items-center justify-center bg-muted">
                {it.imagePath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/files/${it.imagePath}`} alt={it.title} className="size-full object-cover" />
                ) : (
                  <ImageIcon className="size-8 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-1 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium leading-tight [overflow-wrap:anywhere]">{it.title}</div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    disabled={pending}
                    aria-label="Șterge"
                    onClick={() =>
                      start(async () => {
                        const r = await deletePortfolioAction(it.id);
                        if (r && !r.ok) toast.error(r.error);
                      })
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
                {it.description && <p className="line-clamp-2 text-xs text-muted-foreground">{it.description}</p>}
                {safeWebUrl(it.url) && (
                  <a href={safeWebUrl(it.url) ?? undefined} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-xs font-medium text-brand underline-offset-4 hover:underline">
                    Vezi online <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Adaugă 2–3 lucrări reprezentative. Clienții compară portofoliile înainte să aleagă.</p>
      )}
      <form ref={ref} action={action} className="space-y-4 rounded-xl border border-dashed border-border-strong p-5">
        <div className="text-sm font-medium">Adaugă o lucrare</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Titlu" htmlFor="pf-title" error={fe.title}>
            <Input id="pf-title" name="title" required maxLength={120} placeholder="Ex: Renovare baie 6 mp, Floreasca" defaultValue={sub?.title} />
          </Field>
          <Field label="Link" htmlFor="pf-url" optional error={fe.url}>
            <Input
              id="pf-url"
              name="url"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={400}
              placeholder="https://"
              defaultValue={sub?.url}
              aria-invalid={fe.url ? true : undefined}
            />
          </Field>
        </div>
        <Field label="Descriere" htmlFor="pf-desc" optional>
          <Textarea id="pf-desc" name="description" rows={2} maxLength={1000} defaultValue={sub?.description} />
        </Field>
        <Field
          label="Imagine"
          htmlFor="pf-img"
          optional
          error={imageError ?? undefined}
          hint={image ? `Aleasă: ${image.name}` : "JPG, PNG sau WebP, max 5 MB. Fotografiile mari se micșorează automat."}
        >
          <Input
            ref={fileRef}
            id="pf-img"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={preparing}
            onChange={async (e) => {
              const input = e.currentTarget;
              const f = input.files?.[0];
              if (!f) {
                setImage(null);
                return;
              }
              setPreparing(true);
              const r = await prepareImage(f, 2000);
              setPreparing(false);
              if (!r.ok) {
                input.value = "";
                setImage(null);
                setImageError(r.error);
                return;
              }
              setImageError(null);
              setImage(r.file);
            }}
          />
        </Field>
        <FormMessage state={state} />
        <SubmitButton variant="outline" pendingText="Se încarcă…" disabled={preparing}>
          Adaugă în portofoliu
        </SubmitButton>
      </form>
    </div>
  );
}
