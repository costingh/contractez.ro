"use client";

import { ImageUp, Trash2 } from "lucide-react";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { removeCoverAction, saveCoverAction } from "@/app/profil/actions";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { rules } from "@/config/site";

const MAX_MB = Math.round(rules.maxUploadBytes / 1024 / 1024);

/** Încărcare / înlocuire / eliminare a copertei de pe profilul public. */
export function CoverManager({ coverPath }: { coverPath: string | null }) {
  const [picked, setPicked] = useState<string | null>(null);
  // După trimitere React golește câmpul de fișier, așa că renunțăm și la previzualizarea locală.
  const [state, action] = useActionState(async (prev: Awaited<ReturnType<typeof saveCoverAction>>, fd: FormData) => {
    const r = await saveCoverAction(prev, fd);
    setPicked(null);
    return r;
  }, null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const saved = coverPath ? `/api/files/${coverPath}` : null;
  const preview = picked ?? saved;

  useEffect(() => () => void (picked && URL.revokeObjectURL(picked)), [picked]);

  const clear = () => {
    setPicked(null);
    setError(null);
    if (input.current) input.current.value = "";
  };

  return (
    <form action={action} className="space-y-4">
      <div className="relative overflow-hidden rounded-xl border bg-muted">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Previzualizare copertă" className="aspect-[12/5] w-full object-cover sm:aspect-[16/5]" />
        ) : (
          <div className="ink-panel flex aspect-[12/5] items-center justify-center sm:aspect-[16/5]">
            <div aria-hidden className="aurora aurora-a -top-40 -left-20 size-[420px]" />
            <div aria-hidden className="aurora aurora-b -right-24 -bottom-48 size-[380px] opacity-45" />
            <span className="relative px-4 text-center text-sm text-white/70">Fără copertă: profilul folosește fundalul implicit.</span>
          </div>
        )}
        {picked && (
          <span className="absolute top-2.5 left-2.5 rounded-full bg-black/65 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">Nesalvată</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border-strong bg-card px-3.5 text-sm font-medium shadow-xs transition-colors hover:bg-muted has-focus-visible:ring-2 has-focus-visible:ring-ring dark:border-input">
          <ImageUp className="size-4" />
          {saved ? "Schimbă coperta" : "Încarcă o copertă"}
          <input
            ref={input}
            type="file"
            name="cover"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return clear();
              if (f.size > rules.maxUploadBytes) {
                clear();
                setError(`Imaginea depășește ${MAX_MB} MB.`);
                return;
              }
              setError(null);
              setPicked(URL.createObjectURL(f));
            }}
          />
        </label>
        {picked ? (
          <>
            <SubmitButton pendingText="Se încarcă…">Salvează coperta</SubmitButton>
            <Button type="button" variant="ghost" onClick={clear}>
              Renunță
            </Button>
          </>
        ) : (
          saved && (
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await removeCoverAction();
                  if (r && !r.ok) toast.error(r.error);
                  else toast.success("Coperta a fost eliminată.");
                })
              }
            >
              <Trash2 /> Elimină coperta
            </Button>
          )
        )}
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        JPG, PNG sau WebP, max {MAX_MB} MB. Recomandat: imagine lată, cel puțin 1600 × 500 px. Pe telefon marginile laterale se decupează, așa că
        păstrează elementele importante spre centru.
      </p>
      {error ? <FormMessage state={{ ok: false, error }} /> : <FormMessage state={picked ? null : state} />}
    </form>
  );
}
