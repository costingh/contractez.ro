"use client";

declare global {
  interface Window {
    visitrack?: ((name: string, props?: Record<string, unknown>) => void) & {
      visitorId?: () => string | null | undefined;
      identify?: (externalId: string, traits?: Record<string, unknown>) => void;
    };
  }
}

/** Scriptul se încarcă după hidratare; așteptăm puțin în loc să pierdem apelul. */
export function whenVisitrackReady(timeoutMs = 15_000): Promise<boolean> {
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

/** VisitTrack acceptă chei de proprietăți doar cu litere mici, cifre, _ și -: „planId” → „plan_id”. */
export function visitrackProps(props: Record<string, unknown> | null | undefined) {
  if (!props) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (v == null) continue;
    out[k.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase().slice(0, 32)] = v;
  }
  return out;
}

/** Trimite un eveniment (așteaptă scriptul dacă nu s-a încărcat încă). */
export function vtEvent(name: string, props?: Record<string, unknown>) {
  whenVisitrackReady().then((ok) => {
    if (ok) window.visitrack?.(name, visitrackProps(props));
  });
}
