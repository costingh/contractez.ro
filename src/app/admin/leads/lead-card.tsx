"use client";

import { Check, ChevronDown, ChevronUp, Copy, ExternalLink, MapPin, MessageCircle, SkipForward, UserCheck } from "lucide-react";
import { useActionState, useRef, useState } from "react";
import { toast } from "sonner";
import { FormMessage } from "@/components/forms/form-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { leadAction } from "./actions";

export type LeadView = {
  id: string;
  kind: "post" | "comment";
  status: string;
  statusLabel: string;
  type: "client" | "provider" | "irrelevant" | null;
  groupName: string;
  authorName: string | null;
  authorProfileUrl: string | null;
  permalink: string | null;
  postedAtText: string | null;
  commentCount: number | null;
  text: string;
  category: string | null;
  locality: string | null;
  score: number | null;
  reason: string | null;
  message: string | null;
  messengerUrl: string | null;
  /** Persoana a fost deja contactată (prin alt lead sau are istoric în Messenger). */
  personContacted: boolean;
  createdAt: string;
};

const TYPE_LABEL = { client: "Client", provider: "Prestator", irrelevant: "Irelevant" } as const;
const SENT = new Set(["contacted", "replied", "signed_up"]);
const EXCERPT = 280;

function ScorePill({ score }: { score: number | null }) {
  if (score === null) return <Badge variant="outline">Fără scor</Badge>;
  const variant = score >= 70 ? "brand" : score >= 40 ? "outline" : "secondary";
  return (
    <Badge variant={variant} className="tabular-nums" title="Scor AI: prospețime, claritate, buget, potrivire cu categoriile">
      {score}/100
    </Badge>
  );
}

export function LeadCard({ lead, capReached }: { lead: LeadView; capReached: boolean }) {
  const [state, formAction, pending] = useActionState(leadAction, null);
  const [message, setMessage] = useState(lead.message ?? "");
  const [expanded, setExpanded] = useState(false);
  const [override, setOverride] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const sent = SENT.has(lead.status);
  const greyed = !sent && (lead.personContacted || lead.status === "already_contacted");
  const long = lead.text.length > EXCERPT;
  // Fără profil (anonim) nu avem cui scrie; irelevanții nu primesc mesaj.
  const contactable = Boolean(lead.messengerUrl) && (lead.type === "client" || lead.type === "provider");
  const sendBlocked = greyed || sent || (capReached && !override);

  function copyAndOpen() {
    const text = ref.current?.value ?? message;
    // Copierea pornește în același gest cu deschiderea tab-ului (altfel browserul o poate bloca).
    const copy = navigator.clipboard?.writeText(text);
    if (lead.messengerUrl) window.open(lead.messengerUrl, "_blank", "noopener,noreferrer");
    (copy ?? Promise.reject(new Error("no clipboard"))).then(
      () => toast.success("Mesaj copiat. Lipește-l în Messenger și trimite-l tu."),
      () => {
        ref.current?.select();
        toast.error("Nu am putut copia automat: textul e selectat, copiază-l manual (Ctrl/⌘+C).");
      },
    );
  }

  return (
    <article className={cn("space-y-4 rounded-2xl border bg-card p-5 shadow-xs transition-opacity", greyed && "opacity-55")}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {lead.authorProfileUrl ? (
              <a href={lead.authorProfileUrl} target="_blank" rel="noreferrer" className="font-medium underline-offset-4 hover:underline">
                {lead.authorName ?? "Profil"}
              </a>
            ) : (
              <span className="font-medium">{lead.authorName ?? "Anonim"}</span>
            )}
            {lead.type && <Badge variant={lead.type === "client" ? "success" : lead.type === "provider" ? "secondary" : "outline"}>{TYPE_LABEL[lead.type]}</Badge>}
            <Badge variant={sent ? "brand" : greyed ? "warning" : "outline"}>{lead.statusLabel}</Badge>
            {greyed && lead.status !== "already_contacted" && <Badge variant="warning">Persoană deja contactată</Badge>}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span>{lead.kind === "post" ? "Postare" : "Comentariu"}</span>
            <span aria-hidden>·</span>
            <span>{lead.groupName}</span>
            {lead.postedAtText && (
              <>
                <span aria-hidden>·</span>
                <span>{lead.postedAtText}</span>
              </>
            )}
            {lead.commentCount !== null && (
              <>
                <span aria-hidden>·</span>
                <span>{lead.commentCount} comentarii</span>
              </>
            )}
            {lead.permalink && (
              <>
                <span aria-hidden>·</span>
                <a href={lead.permalink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand underline-offset-4 hover:underline">
                  Vezi pe Facebook <ExternalLink className="size-3" />
                </a>
              </>
            )}
          </div>
        </div>
        <ScorePill score={lead.score} />
      </header>

      <div className="space-y-2">
        <p className="text-sm leading-relaxed whitespace-pre-line">
          {expanded || !long ? lead.text : `${lead.text.slice(0, EXCERPT).trimEnd()}…`}
        </p>
        {long && (
          <button type="button" onClick={() => setExpanded((v) => !v)} className="inline-flex items-center gap-1 text-xs font-medium text-brand">
            {expanded ? (
              <>
                Mai puțin <ChevronUp className="size-3.5" />
              </>
            ) : (
              <>
                Tot textul <ChevronDown className="size-3.5" />
              </>
            )}
          </button>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {lead.category && <span className="font-medium text-foreground">{lead.category}</span>}
          {lead.locality && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" /> {lead.locality}
            </span>
          )}
          {lead.reason && <span>{lead.reason}</span>}
        </div>
      </div>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="leadId" value={lead.id} />
        {contactable && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <label htmlFor={`msg-${lead.id}`}>Mesaj (editabil)</label>
              <span className={cn("tabular-nums", message.length > 600 && "text-warning")}>{message.length} caractere</span>
            </div>
            <Textarea id={`msg-${lead.id}`} ref={ref} name="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={5} maxLength={3000} />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {contactable && (
            <>
              <Button type="button" size="sm" variant="brand" onClick={copyAndOpen} disabled={!message.trim()}>
                <Copy /> Copiază și deschide Messenger
              </Button>
              <Button type="submit" name="intent" value="sent" size="sm" variant="outline" disabled={pending || sendBlocked}>
                <Check /> Am trimis
              </Button>
            </>
          )}
          {!sent && (
            <Button type="submit" name="intent" value="skipped" size="sm" variant="ghost" disabled={pending || lead.status === "skipped"}>
              <SkipForward /> Sari peste
            </Button>
          )}
          <Button type="submit" name="intent" value="replied" size="sm" variant="ghost" disabled={pending || lead.status === "replied"}>
            <MessageCircle /> A răspuns
          </Button>
          <Button type="submit" name="intent" value="signed_up" size="sm" variant="ghost" disabled={pending || lead.status === "signed_up"}>
            <UserCheck /> S-a înscris
          </Button>
          {contactable && capReached && !sent && !greyed && (
            <label className="ml-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <input type="checkbox" name="override" checked={override} onChange={(e) => setOverride(e.target.checked)} className="size-3.5 accent-current" />
              Peste limită
            </label>
          )}
        </div>
        <FormMessage state={state} />
      </form>
    </article>
  );
}
