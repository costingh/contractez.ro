"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/** După ștergerea contului (`/?cont=sters`): confirmare vizibilă, apoi scoatem parametrul din URL. */
export function AccountDeletedToast() {
  useEffect(() => {
    toast.success("Contul tău a fost șters. Ne pare rău să te vedem plecând.", { id: "account-deleted", duration: 10_000 });
    const url = new URL(window.location.href);
    url.searchParams.delete("cont");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);
  return null;
}
