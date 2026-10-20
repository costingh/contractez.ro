"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { billingPortalAction, subscribePlanAction } from "./actions";
import { SubmitButton } from "@/components/forms/submit-button";

export function SubscribeButton({ planId, enabled, label, variant }: { planId: string; enabled: boolean; label: string; variant?: "default" | "outline" }) {
  const [state, action] = useActionState(subscribePlanAction, null);
  useEffect(() => {
    if (state && !state.ok) toast.error(state.error);
  }, [state]);
  return (
    <form action={action}>
      <input type="hidden" name="planId" value={planId} />
      <SubmitButton className="w-full" size="lg" variant={variant} disabled={!enabled} pendingText="Se deschide plata…">
        {label}
      </SubmitButton>
    </form>
  );
}

export function PortalButton({ label = "Gestionează abonamentul", className }: { label?: string; className?: string }) {
  const [state, action] = useActionState(billingPortalAction, null);
  useEffect(() => {
    if (state && !state.ok) toast.error(state.error);
  }, [state]);
  return (
    <form action={action}>
      <SubmitButton variant="outline" size="sm" className={className} pendingText="Se deschide…">
        {label}
      </SubmitButton>
    </form>
  );
}
