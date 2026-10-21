"use client";

import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    $crisp?: unknown[][];
    CRISP_WEBSITE_ID?: string;
    CRISP_RUNTIME_CONFIG?: Record<string, unknown>;
  }
}

/**
 * Chat de suport Crisp, încărcat abia când vizitatorul apasă butonul: nu încetinește paginile
 * și nu pune cookie-uri Crisp decât dacă omul cere el chat-ul.
 */
export function CrispChat({ websiteId, user }: { websiteId: string; user: { email: string; name: string; role: string; plan: string } | null }) {
  const [state, setState] = useState<"idle" | "loading" | "loaded">("idle");

  const open = () => {
    window.visitrack?.("support_chat_open", { page: location.pathname });
    if (state === "loaded") {
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
    window.$crisp.push(["do", "chat:show"]);
    window.$crisp.push(["do", "chat:open"]);
    const s = document.createElement("script");
    s.src = "https://client.crisp.chat/l.js";
    s.async = true;
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
        "fixed right-4 bottom-4 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-90 disabled:opacity-70 print:hidden",
      )}
    >
      <MessageCircle className={cn("size-5", state === "loading" && "animate-pulse")} />
      <span className="hidden sm:inline">{state === "loading" ? "Se deschide…" : "Ajutor"}</span>
    </button>
  );
}
