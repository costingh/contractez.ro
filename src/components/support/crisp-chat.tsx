"use client";

import { MessageCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    $crisp?: unknown[][];
    CRISP_WEBSITE_ID?: string;
    CRISP_RUNTIME_CONFIG?: Record<string, unknown>;
  }
}

/**
 * Pagini cu formulare (cont, profil, proiect) și bare de acțiuni lipite jos (Salvează, Publică, câmpul de mesaj):
 * pe telefon, butonul de chat le-ar acoperi, așa că acolo îl ascundem sub `sm`.
 */
const FORM_ROUTES = [/^\/(autentificare|inregistrare|parola-uitata|resetare-parola|verifica-email)(\/|$)/, /^\/profil(\/|$)/, /^\/setari(\/|$)/, /^\/onboarding(\/|$)/, /^\/proiecte\/nou$/, /^\/proiecte\/[^/]+\/editeaza$/, /^\/mesaje(\/|$)/];

/**
 * Chat de suport Crisp, încărcat abia când vizitatorul apasă butonul: nu încetinește paginile
 * și nu pune cookie-uri Crisp decât dacă omul cere el chat-ul.
 */
export function CrispChat({ websiteId, user }: { websiteId: string; user: { email: string; name: string; role: string; plan: string } | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const formRoute = FORM_ROUTES.some((r) => r.test(pathname));
  const [state, setState] = useState<"idle" | "loading" | "loaded">("idle");
  // Pe telefon, pe paginile cu formulare: și butonul propriu al Crisp (după încărcare) stă ascuns cât timp chat-ul e închis.
  const hideLauncher = useRef(false);

  useEffect(() => {
    hideLauncher.current = formRoute && window.matchMedia("(max-width: 639.98px)").matches;
    if (state !== "loaded") return;
    const crisp = window.$crisp as unknown as { push: (cmd: unknown[]) => void; is?: (what: string) => boolean };
    if (!hideLauncher.current) crisp.push(["do", "chat:show"]);
    else if (!crisp.is?.("chat:opened")) crisp.push(["do", "chat:hide"]);
  }, [formRoute, state]);

  const open = () => {
    window.visitrack?.("support_chat_open", { page: location.pathname });
    if (state === "loaded") {
      window.$crisp?.push(["do", "chat:show"]);
      window.$crisp?.push(["do", "chat:open"]);
      return;
    }
    setState("loading");
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = websiteId;
    window.CRISP_RUNTIME_CONFIG = { locale: "ro" };
    if (user) {
      window.$crisp.push(["set", "user:email", [user.email]]);
      window.$crisp.push(["set", "user:nickname", [user.name]]);
      window.$crisp.push(["set", "session:data", [[["rol", user.role], ["plan", user.plan]]]]);
    }
    window.$crisp.push(["on", "session:loaded", () => setState("loaded")]);
    window.$crisp.push(["on", "chat:closed", () => hideLauncher.current && window.$crisp?.push(["do", "chat:hide"])]);
    window.$crisp.push(["do", "chat:show"]);
    window.$crisp.push(["do", "chat:open"]);
    const s = document.createElement("script");
    s.src = "https://client.crisp.chat/l.js";
    s.async = true;
    // Blocat (ad-blocker, rețea)? După 10 secunde trimitem omul la pagina de contact.
    const fallback = window.setTimeout(() => {
      setState("idle");
      router.push("/contact");
    }, 10_000);
    window.$crisp.push(["on", "session:loaded", () => window.clearTimeout(fallback)]);
    s.onerror = () => {
      window.clearTimeout(fallback);
      setState("idle");
      router.push("/contact");
    };
    document.head.appendChild(s);
  };

  // După încărcare, Crisp își afișează propriul buton; al nostru dispare.
  if (state === "loaded") return null;
  return (
    <button
      type="button"
      onClick={open}
      disabled={state === "loading"}
      aria-label="Deschide chat-ul de suport"
      className={cn(
        // Deasupra zonei de jos a iPhone-ului (bara Home); cât timp e deschisă bara de cookie-uri, butonul nu apare peste ea.
        "fixed right-[calc(1rem+env(safe-area-inset-right))] bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 inline-flex size-12 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-90 disabled:opacity-70 sm:w-auto sm:px-4 print:hidden",
        "[body:has([data-slot=cookie-banner])_&]:hidden",
        formRoute && "max-sm:hidden",
      )}
    >
      <MessageCircle className={cn("size-5", state === "loading" && "animate-pulse")} />
      <span className="hidden sm:inline">{state === "loading" ? "Se deschide…" : "Ajutor"}</span>
    </button>
  );
}
