"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ConversationListItem } from "./types";

const POLL_MS = 8_000;
export const CHAT_ACTIVITY_EVENT = "chat:activity";

/** Inbox actualizat live: polling la 8s + reîmprospătare imediată când conversația deschisă primește/trimite mesaje. */
export function ConversationList({ items: initial }: { items: ConversationListItem[] }) {
  const pathname = usePathname();
  const [items, setItems] = useState(initial);
  const [prevInitial, setPrevInitial] = useState(initial);
  if (prevInitial !== initial) {
    // Datele server noi (ex: după navigare) înlocuiesc lista curentă.
    setPrevInitial(initial);
    setItems(initial);
  }

  const refresh = useCallback(async () => {
    if (document.hidden) return;
    try {
      const res = await fetch("/api/conversations", { cache: "no-store" });
      if (res.ok) setItems(((await res.json()) as { items: ConversationListItem[] }).items);
    } catch {
      /* reîncercăm la următorul interval */
    }
  }, []);

  useEffect(() => {
    const t = setInterval(refresh, POLL_MS);
    const onActivity = () => void refresh();
    window.addEventListener(CHAT_ACTIVITY_EVENT, onActivity);
    document.addEventListener("visibilitychange", onActivity);
    return () => {
      clearInterval(t);
      window.removeEventListener(CHAT_ACTIVITY_EVENT, onActivity);
      document.removeEventListener("visibilitychange", onActivity);
    };
  }, [refresh]);

  // Conversația deschisă devine citită.
  useEffect(() => {
    const t = setTimeout(refresh, 300);
    return () => clearTimeout(t);
  }, [pathname, refresh]);

  if (items.length === 0) {
    return <p className="p-6 text-center text-sm leading-relaxed text-muted-foreground">Nicio conversație încă. Conversațiile pornesc automat după fiecare aplicare.</p>;
  }
  return (
    <ul className="space-y-0.5 p-2">
      {items.map((c) => {
        const active = pathname === `/mesaje/${c.id}`;
        return (
          <li key={c.id}>
            <Link href={`/mesaje/${c.id}`} aria-current={active ? "page" : undefined}
              className={cn("flex gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted/70", active && "bg-card shadow-xs ring-1 ring-border dark:bg-muted")}>
              <Avatar className="size-10 shrink-0">
                {c.otherAvatar && <AvatarImage src={`/api/files/${c.otherAvatar}`} alt="" />}
                <AvatarFallback className="text-xs">{initials(c.otherName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn("truncate text-sm", c.unread ? "font-semibold" : "font-medium")}>{c.otherName}</span>
                  <span suppressHydrationWarning className="ml-auto shrink-0 text-[11px] text-muted-foreground">{timeAgo(c.lastMessageAt)}</span>
                </div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">{c.projectTitle}</div>
                <div className={cn("mt-0.5 flex items-center gap-2 truncate text-[0.8125rem]", c.unread ? "text-foreground" : "text-muted-foreground")}>
                  <span className="truncate">{c.preview}</span>
                  {c.unread && <span className="ml-auto size-2 shrink-0 rounded-full bg-brand" aria-label="Necitit" />}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
