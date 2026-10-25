"use client";

import { Check, Copy, ExternalLink, MapPin, SkipForward, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { leadAction } from "../actions";

type QueueLead = {
  id: string;
  type: "client" | "provider";
  authorName: string | null;
  authorProfileUrl: string | null;
  permalink: string | null;
  postedAtText: string | null;
  kind: "post" | "comment";
  text: string;
  score: number | null;
  reason: string | null;
  category: string | null;
  locality: string | null;
  message: string;
  messengerUrl: string | null;
};

type QueueFilters = { type: "client" | "provider" | null; minScore: number };

/** Extensia Contractez Copilot e instalată? content-queue.js răspunde la „cz-ping” cu „cz-pong”. */
function useCopilotBridge() {
  const [version, setVersion] = useState<string | null>(null);
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== window || e.origin !== window.location.origin) return;
      const d = e.data as { source?: string; type?: string; version?: string; ok?: boolean; error?: string | null } | null;
      if (d?.source !== "cz-extension") return;
      if (d.type === "cz-pong") setVersion(d.version ?? "?");
      if (d.type === "cz-open-lead-result" && !d.ok) toast.error(d.error || "Extensia nu a putut deschide conversația.");
    };
    window.addEventListener("message", onMessage);
    window.postMessage({ source: "cz-page", type: "cz-ping" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);
  return version;
}

/**
 * Scurtături: C = copiază și deschide Messenger · Enter = trimis → următorul · S = sari (marcat) · N = nu acum (sari fără marcare).
 * Cu extensia instalată, ea deschide conversația într-un singur tab Messenger refolosit, apasă „Începe conversația”,
 * marchează singură lead-ul după ce trimiți și trece la următorul (cu mesajul deja copiat). Fără extensie,
 * Messenger se deschide în același tab („cz-messenger”), iar marcarea se face de aici.
 */
export function QueueRunner({
  lead,
  sent,
  cap,
  remaining,
  skippedNow,
  baseHref,
  filters,
}: {
  lead: QueueLead | null;
  sent: number;
  cap: number;
  remaining: number;
  skippedNow: string[];
  baseHref: string;
  filters: QueueFilters;
}) {
  const router = useRouter();
  const [message, setMessage] = useState(lead?.message ?? "");
  const [opened, setOpened] = useState(false);
  const [pending, startTransition] = useTransition();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const capReached = sent >= cap;
  const copilot = useCopilotBridge();

  // Extensia marchează lead-urile din tab-ul Messenger; când revii aici, coada arată starea reală.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [router]);

  const copyAndOpen = useCallback(async () => {
    if (!lead) return;
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      textRef.current?.select();
      document.execCommand("copy");
    }
    if (!lead.messengerUrl) return;
    if (copilot) {
      window.postMessage(
        { source: "cz-page", type: "cz-open-lead", lead: { id: lead.id, messengerUrl: lead.messengerUrl, authorName: lead.authorName }, filters },
        window.location.origin,
      );
      toast.success("Mesaj copiat. În Messenger: ⌘V și Enter. Extensia marchează singură și trece la următorul.");
    } else {
      window.open(lead.messengerUrl, "cz-messenger");
      toast.success("Mesaj copiat. Lipește-l în Messenger (⌘V), citește-l și trimite.");
    }
    setOpened(true);
  }, [lead, message, copilot, filters]);

  const act = useCallback(
    (intent: "sent" | "skipped") => {
      if (!lead || pending) return;
      if (intent === "sent" && capReached && !window.confirm(`Ai atins limita de azi (${sent}/${cap}). Marchezi totuși?`)) return;
      const fd = new FormData();
      fd.set("leadId", lead.id);
      fd.set("intent", intent);
      fd.set("message", message);
      if (intent === "sent" && capReached) fd.set("override", "on");
      startTransition(async () => {
        const r = await leadAction(null, fd);
        if (r && "ok" in r && r.ok) {
          toast.success(intent === "sent" ? "Marcat ca trimis." : "Sărit.");
          router.refresh();
        } else {
          toast.error((r && "error" in r && r.error) || "Nu am putut salva.");
        }
      });
    },
    [lead, pending, capReached, sent, cap, message, router],
  );

  const notNow = useCallback(() => {
    if (!lead) return;
    const next = [...skippedNow, lead.id].join(",");
    router.push(`${baseHref}&sarite=${next}`);
  }, [lead, skippedNow, baseHref, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.activeElement === textRef.current) return; // editezi mesajul
      const k = e.key.toLowerCase();
      if (k === "c") {
        e.preventDefault();
        void copyAndOpen();
      } else if (k === "enter") {
        e.preventDefault();
        act("sent");
      } else if (k === "s") {
        e.preventDefault();
        act("skipped");
      } else if (k === "n") {
        e.preventDefault();
        notNow();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [copyAndOpen, act, notNow]);

  const progress = Math.min(100, Math.round((sent / Math.max(1, cap)) * 100));

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-between text-sm">
          <span>
            Trimise azi: <b className="tabular-nums">{sent}</b> / {cap}
          </span>
          <span className="text-muted-foreground tabular-nums">{remaining} persoane în coadă</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className={capReached ? "h-full bg-amber-500" : "h-full bg-brand"} style={{ width: `${progress}%` }} />
        </div>
        {capReached && <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">Ai atins limita de azi. Continuă mâine — e mai sigur pentru contul tău.</p>}
      </div>

      {!lead ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Coada e goală pentru filtrele alese. Derulează grupul cu extensia pornită ca să aduci lead-uri noi.
          {skippedNow.length > 0 && (
            <div className="mt-3">
              <Button variant="outline" size="sm" onClick={() => router.push(baseHref)}>
                <Undo2 /> Reia lead-urile lăsate pentru mai târziu ({skippedNow.length})
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-3 rounded-2xl border bg-card p-5 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={lead.type === "client" ? "brand" : "secondary"}>{lead.type === "client" ? "Client" : "Prestator"}</Badge>
              {lead.score !== null && <Badge variant="outline" className="tabular-nums">{lead.score}/100</Badge>}
              {lead.category && <span className="text-xs text-muted-foreground">{lead.category}</span>}
              {lead.locality && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" /> {lead.locality}
                </span>
              )}
            </div>
            <div className="flex items-baseline justify-between gap-3">
              {lead.authorProfileUrl ? (
                <a href={lead.authorProfileUrl} target="_blank" rel="noreferrer" className="text-lg font-semibold hover:underline">
                  {lead.authorName ?? "Profil"}
                </a>
              ) : (
                <span className="text-lg font-semibold">{lead.authorName}</span>
              )}
              <span className="shrink-0 text-xs text-muted-foreground">
                {lead.kind === "comment" ? "comentariu" : "postare"}
                {lead.postedAtText ? ` · ${lead.postedAtText}` : ""}
              </span>
            </div>
            <p className="max-h-72 overflow-y-auto text-sm leading-relaxed whitespace-pre-line text-foreground/85">{lead.text}</p>
            {lead.reason && <p className="text-xs text-muted-foreground">De ce: {lead.reason}</p>}
            {lead.permalink && (
              <a href={lead.permalink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                Vezi postarea <ExternalLink className="size-3" />
              </a>
            )}
          </div>

          <div className="space-y-3 rounded-2xl border bg-card p-5 shadow-xs">
            <label htmlFor="queue-message" className="text-sm font-medium">
              Mesajul (îl poți edita)
            </label>
            <Textarea id="queue-message" ref={textRef} value={message} onChange={(e) => setMessage(e.target.value)} rows={9} />
            <Button className="w-full" size="lg" onClick={() => void copyAndOpen()} disabled={!lead.messengerUrl}>
              <Copy /> Copiază și deschide Messenger <kbd className="ml-auto rounded border border-white/30 px-1.5 text-[11px]">C</kbd>
            </Button>
            <Button className="w-full" size="lg" variant={opened ? "default" : "outline"} onClick={() => act("sent")} disabled={pending}>
              <Check /> Am trimis → următorul <kbd className="ml-auto rounded border px-1.5 text-[11px]">Enter</kbd>
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="ghost" onClick={notNow} disabled={pending}>
                Nu acum <kbd className="ml-1 rounded border px-1.5 text-[11px]">N</kbd>
              </Button>
              <Button variant="ghost" className="text-muted-foreground" onClick={() => act("skipped")} disabled={pending}>
                <SkipForward /> Sari definitiv <kbd className="ml-1 rounded border px-1.5 text-[11px]">S</kbd>
              </Button>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {copilot
                ? `Extensia v${copilot} e conectată: după C lucrezi doar în Messenger (⌘V, Enter). Lead-urile cu care ai mai vorbit sunt sărite automat.`
                : "În Messenger: dacă extensia arată bannerul roșu „Ai mai vorbit cu această persoană”, nu trimite — apasă „Sari definitiv”."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
