"use client";

import { useSyncExternalStore } from "react";

type Counts = { notifications: number; messages: number; applicationsLeft: number | null };

// Un singur polling partajat de toate badge-urile din antet.
let current: { counts: Counts; at: number } | null = null;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
const POLL_MS = 30_000;

async function refresh() {
  if (typeof document !== "undefined" && document.hidden) return;
  try {
    const res = await fetch("/api/me/counts", { cache: "no-store" });
    if (!res.ok) return;
    current = { counts: (await res.json()) as Counts, at: Date.now() };
    listeners.forEach((l) => l());
  } catch {
    /* reîncercăm la următorul interval */
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!timer) {
    timer = setInterval(refresh, POLL_MS);
    window.addEventListener("chat:activity", refresh);
    document.addEventListener("visibilitychange", refresh);
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
      window.removeEventListener("chat:activity", refresh);
      document.removeEventListener("visibilitychange", refresh);
    }
  };
}

/**
 * Folosim valoarea cea mai recentă: cea randată de server la ultima navigare (`at`) sau cea din polling.
 * Astfel, după logout/login sau după o acțiune care a schimbat contoarele, nu afișăm date vechi.
 */
function useCounts(initial: Counts, at: number) {
  const live = useSyncExternalStore(subscribe, () => current, () => null);
  return live && live.at > at ? live.counts : initial;
}

/** Badge numeric live (mesaje / notificări). */
export function LiveCountBadge({ kind, initial, at }: { kind: "notifications" | "messages"; initial: Counts; at: number }) {
  const n = useCounts(initial, at)[kind];
  if (n <= 0) return null;
  return (
    <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-foreground tabular-nums ring-2 ring-background">
      {n > 99 ? "99+" : n}
    </span>
  );
}

/** Aplicări rămase în perioada curentă a planului (doar pentru prestatori). */
export function LiveApplicationsLeft({ initial, at }: { initial: Counts; at: number }) {
  const { applicationsLeft: n } = useCounts(initial, at);
  if (n === null) return null;
  return (
    <>
      {n} {n === 1 ? "aplicare" : "aplicări"}
    </>
  );
}
