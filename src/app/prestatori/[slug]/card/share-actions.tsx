"use client";

import { Check, Copy, Download, Printer, QrCode, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ShareActions({ url, slug, name, headline, isOwner }: { url: string; slug: string; name: string; headline: string; isOwner: boolean }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${url}?s=share`;
  const text = `${name} — ${headline}`;
  const enc = encodeURIComponent;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copiat");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Nu am putut copia. Selectează linkul manual.");
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: name, text, url: shareUrl });
      } catch {
        /* anulat */
      }
    } else copy();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input readOnly value={shareUrl} onFocus={(e) => e.currentTarget.select()} aria-label="Link către profil" />
        <Button onClick={copy} variant="outline" className="shrink-0">
          {copied ? <Check /> : <Copy />} {copied ? "Copiat" : "Copiază"}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Button asChild variant="outline">
          <a href={`https://wa.me/?text=${enc(`${text}\n${shareUrl}`)}`} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${enc(shareUrl)}`} target="_blank" rel="noopener noreferrer">
            Facebook
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(shareUrl)}`} target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
        </Button>
        <Button variant="outline" onClick={nativeShare}>
          <Share2 /> Altele
        </Button>
      </div>
      {isOwner && (
        <div className="rounded-xl border p-4">
          <div className="mb-3 flex items-center gap-2 font-medium">
            <QrCode className="size-4 text-primary" /> Cod QR și imagini
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="secondary">
              <a href={`/api/qr?slug=${enc(slug)}&format=png&download`}>
                <Download /> QR (PNG)
              </a>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <a href={`/api/qr?slug=${enc(slug)}&format=svg&download`}>
                <Download /> QR (SVG, pentru tipar)
              </a>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <a href={`/prestatori/${slug}/opengraph-image`} download={`profil-${slug}.png`}>
                <Download /> Imagine pentru postări
              </a>
            </Button>
            <Button size="sm" variant="secondary" onClick={() => window.print()}>
              <Printer /> Printează cardul
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Când pui linkul pe Facebook sau WhatsApp, apare automat o imagine de previzualizare cu numele, specializarea și tariful tău.
          </p>
        </div>
      )}
    </div>
  );
}
