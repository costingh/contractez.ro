"use client";

import { Cookie } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CONSENT_COOKIE, OPEN_CONSENT_EVENT, type Consent } from "./consent";

/** Bara de cookie-uri. Fără alegere, analiza rulează anonim (fără nimic salvat în browser); „Accept” activează cookie-ul de analiză. */
export function CookieBanner({ initial }: { initial: Consent | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(initial === null);

  useEffect(() => {
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  const choose = (value: Consent) => {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${60 * 60 * 24 * 180}; SameSite=Lax${secure}`;
    window.visitrack?.("cookie_consent", { choice: value });
    setOpen(false);
    router.refresh();
  };

  if (!open) return null;
  return (
    <div role="dialog" aria-label="Cookie-uri" className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-md print:hidden">
      <div className="rounded-2xl border bg-card p-5 shadow-lg">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <Cookie className="size-4.5" />
          </span>
          <div className="space-y-1.5">
            <p className="font-semibold tracking-[-0.01em]">Cookie-uri</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Folosim cookie-uri strict necesare pentru cont și securitate. Cu acordul tău, folosim și un cookie de analiză, ca să înțelegem cum e
              folosit site-ul. Fără acord, măsurăm doar anonim, fără să salvăm nimic în browserul tău.{" "}
              <Link href="/confidentialitate#cookie-uri" className="font-medium text-brand underline-offset-4 hover:underline">
                Detalii
              </Link>
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2 sm:justify-end">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => choose("necessary")}>
            Doar necesare
          </Button>
          <Button size="sm" className="flex-1 sm:flex-none" onClick={() => choose("all")}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Link (în footer) care redeschide bara, ca alegerea să poată fi schimbată oricând. */
export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}>
      Setări cookie-uri
    </button>
  );
}
