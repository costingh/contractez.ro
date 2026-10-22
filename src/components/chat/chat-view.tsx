"use client";

import { FileText, Loader2, Paperclip, Send, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { sendMessageAction } from "@/app/mesaje/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "./types";

const POLL_MS = 4_000;

function time(iso: string) {
  return new Date(iso).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
}

function dayKey(iso: string) {
  return new Date(iso).toDateString();
}

function Attachment({ m, mine }: { m: ChatMessage; mine: boolean }) {
  if (!m.attachmentPath) return null;
  const url = `/api/files/${m.attachmentPath}`;
  if (m.attachmentType?.startsWith("image/")) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={m.attachmentName ?? "imagine"} className="max-h-64 rounded-lg border object-cover" />
      </a>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-sm", mine ? "border-primary-foreground/30" : "bg-background")}
    >
      <FileText className="size-4 shrink-0" />
      <span className="truncate">{m.attachmentName ?? "document"}</span>
      {m.attachmentSize && <span className="shrink-0 text-xs opacity-70">{Math.round(m.attachmentSize / 1024)} KB</span>}
    </a>
  );
}

export function ChatView({
  conversationId,
  meId,
  initial,
  disabled,
  disabledReason,
}: {
  conversationId: string;
  meId: string;
  initial: ChatMessage[];
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pending, start] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastRef = useRef<string | null>(initial.at(-1)?.createdAt ?? null);

  const merge = useCallback((incoming: ChatMessage[]) => {
    if (incoming.length === 0) return;
    window.dispatchEvent(new Event("chat:activity"));
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const add = incoming.filter((m) => !seen.has(m.id));
      if (add.length === 0) return prev;
      const next = [...prev, ...add].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      lastRef.current = next.at(-1)?.createdAt ?? lastRef.current;
      return next;
    });
  }, []);

  useEffect(() => {
    let stopped = false;
    const tick = async () => {
      if (document.hidden) return;
      try {
        const q = lastRef.current ? `?after=${encodeURIComponent(lastRef.current)}` : "";
        const res = await fetch(`/api/conversations/${conversationId}/messages${q}`, { cache: "no-store" });
        if (!res.ok || stopped) return;
        const json = (await res.json()) as { messages: ChatMessage[] };
        merge(json.messages);
      } catch {
        /* rețea indisponibilă: reîncercăm la următorul interval */
      }
    };
    const t = setInterval(tick, POLL_MS);
    const onVis = () => !document.hidden && tick();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stopped = true;
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [conversationId, merge]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const send = () => {
    if (pending || (!body.trim() && !file)) return;
    const fd = new FormData();
    fd.set("body", body);
    if (file) fd.set("file", file);
    start(async () => {
      const res = await sendMessageAction(conversationId, fd);
      if (res?.ok && res.data) {
        merge([res.data]);
        setBody("");
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
      } else if (res && !res.ok) toast.error(res.error);
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto bg-surface/60 px-3 py-5 sm:px-6 dark:bg-background/30">
        {messages.map((m, i) => {
          const showDay = i === 0 || dayKey(messages[i - 1].createdAt) !== dayKey(m.createdAt);
          const mine = m.senderId === meId;
          return (
            <div key={m.id}>
              {showDay && <div className="my-4 flex items-center gap-3 text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">{formatDate(m.createdAt, "EEEE, d MMMM")}</div>}
              {m.isSystem ? (
                <div className="my-2 text-center">
                  <span className="inline-block rounded-md border bg-card px-3 py-1.5 text-xs text-muted-foreground">{m.body}</span>
                </div>
              ) : (
                <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] space-y-1.5 rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed sm:max-w-[70%]",
                      mine
                        ? "rounded-br-sm bg-primary bg-[linear-gradient(160deg,var(--primary)_55%,color-mix(in_oklab,var(--primary),var(--brand)_35%))] text-primary-foreground shadow-sm dark:bg-none"
                        : "rounded-bl-sm border bg-card shadow-xs",
                    )}
                  >
                    {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                    <Attachment m={m} mine={mine} />
                    <div className={cn("text-right text-[10px]", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>{time(m.createdAt)}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {disabled ? (
        <div className="border-t bg-muted/40 p-4 text-center text-sm text-muted-foreground">{disabledReason ?? "Conversația este închisă."}</div>
      ) : (
        <div className="border-t bg-card p-3 sm:px-4">
          {file && (
            <div className="mb-2 flex items-center gap-2 rounded-md border bg-muted px-3 py-1.5 text-xs">
              <Paperclip className="size-3.5" />
              <span className="truncate">{file.name}</span>
              <button type="button" className="ml-auto" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }} aria-label="Elimină atașamentul">
                <X className="size-3.5" />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button type="button" variant="ghost" size="icon" className="size-10" onClick={() => fileRef.current?.click()} aria-label="Atașează fișier" title="Imagine sau PDF, max. 5 MB">
              <Paperclip />
            </Button>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              // Indiciul de tastatură stă în title: pe telefon, placeholder-ul lung se rupea pe 3 rânduri și umfla câmpul.
              placeholder="Scrie un mesaj…"
              title="Enter trimite, Shift+Enter rând nou"
              enterKeyHint="send"
              className="max-h-40 min-h-10 resize-none"
            />
            <Button type="button" size="icon" className="size-10" onClick={send} disabled={pending || (!body.trim() && !file)} aria-label="Trimite">
              {pending ? <Loader2 className="animate-spin" /> : <Send />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
