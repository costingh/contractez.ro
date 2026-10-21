"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    visitrack?: ((name: string, props?: Record<string, unknown>) => void) & {
      visitorId?: () => string | undefined;
      identify?: (externalId: string, traits?: Record<string, unknown>) => void;
    };
  }
}

/** Scriptul se încarcă după hidratare; așteptăm puțin în loc să pierdem apelul. */
function whenReady(timeoutMs = 15_000): Promise<boolean> {
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      if (window.visitrack) return resolve(true);
      if (Date.now() - start > timeoutMs) return resolve(false);
      setTimeout(tick, 250);
    };
    tick();
  });
}

function visitorId(): string | null {
  try {
    return window.visitrack?.visitorId?.() ?? window.localStorage.getItem("_ana_vid");
  } catch {
    return null;
  }
}

/**
 * Leagă vizitatorul VisitTrack de contul logat: identify() cu trăsături (fără date personale)
 * și trimite id-ul de vizitator la server, pentru evenimentele de pe server și atribuirea plăților Stripe.
 */
export function VisitrackIdentify({ userId, knownVisitorId, traits }: { userId: string; knownVisitorId: string | null; traits: Record<string, string> }) {
  const traitsKey = JSON.stringify(traits);
  useEffect(() => {
    let cancelled = false;
    whenReady().then((ok) => {
      if (!ok || cancelled) return;
      const flag = `vt:identified:${userId}:${traitsKey}`;
      try {
        if (!window.sessionStorage.getItem(flag)) {
          window.visitrack?.identify?.(userId, JSON.parse(traitsKey));
          window.sessionStorage.setItem(flag, "1");
        }
      } catch {
        window.visitrack?.identify?.(userId, JSON.parse(traitsKey));
      }
      const vid = visitorId();
      if (vid && vid !== knownVisitorId) {
        fetch("/api/vt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visitorId: vid }) }).catch(() => {});
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId, knownVisitorId, traitsKey]);
  return null;
}
