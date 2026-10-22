"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

/** Confirmarea „Salvat” după un pas de onboarding (acțiunile redirecționează cu `?salvat=`); scoate parametrul din URL. */
export function SavedToast({ description }: { description: string }) {
  const shown = useRef(false);
  useEffect(() => {
    if (shown.current) return;
    shown.current = true;
    toast.success("Salvat", { description });
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("salvat");
      window.history.replaceState(window.history.state, "", url.pathname + url.search);
    } catch {}
  }, [description]);
  return null;
}
