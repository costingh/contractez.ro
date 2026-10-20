"use client";

import { ExternalLink, ImageIcon, Trash2 } from "lucide-react";
import { useActionState, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { addPortfolioAction, deletePortfolioAction } from "@/app/profil/actions";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type PortfolioRow = { id: string; title: string; description: string; url: string | null; imagePath: string | null };

export function PortfolioManager({ items }: { items: PortfolioRow[] }) {
  const [state, action] = useActionState(addPortfolioAction, null);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
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
                  <div className="font-medium leading-tight">{it.title}</div>
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
                {it.url && (
                  <a href={it.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-xs font-medium text-brand underline-offset-4 hover:underline">
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
          <Field label="Titlu" htmlFor="pf-title">
            <Input id="pf-title" name="title" required maxLength={120} placeholder="Ex: Renovare baie 6 mp, Floreasca" />
          </Field>
          <Field label="Link" htmlFor="pf-url" optional>
            <Input id="pf-url" name="url" type="url" placeholder="https://" />
          </Field>
        </div>
        <Field label="Descriere" htmlFor="pf-desc" optional>
          <Textarea id="pf-desc" name="description" rows={2} maxLength={1000} />
        </Field>
        <Field label="Imagine" htmlFor="pf-img" optional hint="JPG, PNG sau WebP, max 5 MB.">
          <Input id="pf-img" name="image" type="file" accept="image/jpeg,image/png,image/webp" />
        </Field>
        <FormMessage state={state} />
        <SubmitButton variant="outline" pendingText="Se încarcă…">
          Adaugă în portofoliu
        </SubmitButton>
      </form>
    </div>
  );
}
