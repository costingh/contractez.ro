"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { vtEvent } from "./visitrack-client";

const COOKIE = "vt_ev";

/** Linkurile-cheie, urmărite ca evenimente indiferent de componenta în care apar (cu pagina de pe care s-a dat click). */
const LINK_EVENTS: [RegExp, string][] = [
  [/^\/proiecte\/nou(?:[?#]|$)/, "cta_publish_project"],
  [/^\/inregistrare\?(?:.*&)?rol=prestator/, "cta_become_provider"],
  [/^\/inregistrare(?:[?#]|$)/, "cta_signup"],
  [/^\/autentificare(?:[?#]|$)/, "cta_login"],
  [/^\/api\/auth\/google/, "google_auth_click"],
  [/^\/preturi(?:[?#]|$)/, "cta_pricing"],
];

function onClick(e: MouseEvent) {
  const a = (e.target as Element | null)?.closest?.("a[href]");
  if (!a) return;
  let url: URL;
  try {
    url = new URL((a as HTMLAnchorElement).href, location.href);
  } catch {
    return;
  }
  if (url.origin !== location.origin) return;
  const path = url.pathname + url.search;
  const hit = LINK_EVENTS.find(([re]) => re.test(path));
  if (hit) vtEvent(hit[1], { from: location.pathname });
}

/** Trimite în VisitTrack evenimentele lăsate de server în cookie-ul vt_ev (vezi server/analytics.ts), apoi îl golește. */
export function VisitrackRelay() {
  const pathname = usePathname();
  useEffect(() => {
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  useEffect(() => {
    const raw = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE}=`));
    if (!raw) return;
    document.cookie = `${COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    try {
      const queue = JSON.parse(decodeURIComponent(raw.slice(COOKIE.length + 1))) as { n: string; p: Record<string, unknown> | null }[];
      for (const e of queue) if (e?.n) vtEvent(e.n, e.p ?? undefined);
    } catch {}
  }, [pathname]);
  return null;
}
