"use server";

import { redirect } from "next/navigation";
import { formStr, toActionError, type ActionState } from "@/lib/action";
import { requireProvider } from "@/server/auth/guards";
import { createBillingPortal, createPlanCheckout } from "@/server/billing/stripe";
import { DomainError } from "@/server/errors";
import { rateLimit } from "@/server/rate-limit";

export async function subscribePlanAction(_: ActionState, fd: FormData): Promise<ActionState> {
  let url: string;
  try {
    const user = await requireProvider();
    if (!(await rateLimit(`checkout:${user.id}`, 10, 600))) throw new DomainError("rate", "Prea multe încercări. Încearcă din nou în câteva minute.");
    url = await createPlanCheckout(user.id, formStr(fd, "planId"));
  } catch (err) {
    return toActionError(err);
  }
  redirect(url);
}

export async function billingPortalAction(): Promise<ActionState> {
  let url: string;
  try {
    const user = await requireProvider();
    url = await createBillingPortal(user.id);
  } catch (err) {
    return toActionError(err);
  }
  redirect(url);
}
