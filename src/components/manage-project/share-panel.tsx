"use client";

import { Check, Copy, Link2, Loader2, Share2, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { shareTextAction } from "@/app/proiectele-mele/[id]/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function SharePanel({ projectId, publicUrl, initialText }: { projectId: string; publicUrl: string; initialText: string | null }) {
  const [text, setText] = useState(initialText);
  const [copied, setCopied] = useState<"text" | "link" | null>(null);
  const [pending, start] = useTransition();

  const copy = async (value: string, kind: "text" | "link") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Nu am putut copia. Selectează textul manual.");
    }
  };

  const generate = () =>
    start(async () => {
      const res = await shareTextAction(projectId);
      if (res?.ok && res.data) setText(res.data.text);
      else if (res && !res.ok) toast.error(res.error);
    });

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-xs">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Share2 className="size-4 text-muted-foreground" /> Distribuie proiectul
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Postează textul în grupurile de Facebook în care ești activ. Prestatorii aplică prin link, iar tu primești ofertele organizat, aici.
        </p>
      </div>
      {text ? (
        <>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} className="text-sm" />
          <Button size="sm" onClick={() => copy(text, "text")} className="w-full">
            {copied === "text" ? <Check /> : <Copy />} {copied === "text" ? "Copiat!" : "Copiază textul"}
          </Button>
        </>
      ) : (
        <Button size="sm" variant="outline" onClick={generate} disabled={pending} className="w-full">
          {pending ? <Loader2 className="animate-spin" /> : <Sparkles className="text-brand" />} Generează textul pentru postare
        </Button>
      )}
      <div className="flex items-center gap-2 rounded-lg border bg-surface px-3 py-2 dark:bg-muted/40">
        <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-xs">{publicUrl}</span>
        <Button size="xs" variant="ghost" onClick={() => copy(publicUrl, "link")}>
          {copied === "link" ? <Check /> : <Copy />}
        </Button>
      </div>
    </div>
  );
}
