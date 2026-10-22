"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

const CHANNEL = "cz-email-verified";
const POLL_MS = 8_000;
const POLL_FOR_MS = 30 * 60_000;

/**
 * Pe pagina de confirmare: anunță celelalte taburi deschise (ex. onboarding-ul) că emailul a fost confirmat
 * și scoate tokenul din bara de adrese (nu rămâne în istoric și nici nu ajunge în analytics).
 */
export function EmailVerifiedBroadcast() {
  useEffect(() => {
    try {
      const bc = new BroadcastChannel(CHANNEL);
      bc.postMessage("verified");
      bc.close();
    } catch {}
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has("token")) {
        url.searchParams.delete("token");
        url.searchParams.set("confirmat", "1");
        window.history.replaceState(window.history.state, "", url.pathname + url.search);
      }
    } catch {}
  }, []);
  return null;
}

/**
 * Lângă mesajele „Confirmă emailul”: când emailul e confirmat (în alt tab, pe telefon etc.), reîncarcă datele paginii
 * fără refresh manual. Ascultă tabul de confirmare și verifică periodic, doar cât pagina e vizibilă.
 */
export function EmailVerifiedWatcher() {
  const router = useRouter();
  useEffect(() => {
    let done = false;
    const started = Date.now();
    const onVerified = () => {
      if (done) return;
      done = true;
      toast.success("Email confirmat. Mulțumim!");
      router.refresh();
    };
    const check = async () => {
      if (done || document.visibilityState !== "visible" || Date.now() - started > POLL_FOR_MS) return;
      try {
        const res = await fetch("/api/me/email-status", { cache: "no-store" });
        if (res.ok && ((await res.json()) as { verified?: boolean }).verified) onVerified();
      } catch {}
    };
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(CHANNEL);
      bc.onmessage = (e) => {
        if (e.data === "verified") void check();
      };
    } catch {}
    const timer = setInterval(check, POLL_MS);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      done = true;
      clearInterval(timer);
      bc?.close();
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [router]);
  return null;
}
