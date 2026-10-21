"use server";

import { revalidatePath } from "next/cache";
import { formBool, formStr, toActionError, type ActionState } from "@/lib/action";
import { requireAdmin } from "@/server/auth/guards";
import { DomainError } from "@/server/errors";
import { markLeadSent, setLeadStatus } from "@/server/outreach/service";

const MESSAGES = {
  skipped: "Lead sărit.",
  replied: "Marcat: a răspuns.",
  signed_up: "Marcat: s-a înscris.",
} as const;

/** Acțiunile manuale de pe un lead. Nimic nu se trimite automat: omul trimite din Messenger, apoi marchează aici. */
export async function leadAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
    const leadId = formStr(fd, "leadId");
    const intent = formStr(fd, "intent");
    if (!leadId) throw new DomainError("lead", "Lead lipsă.");
    if (intent === "sent") {
      const { others } = await markLeadSent(leadId, { message: formStr(fd, "message"), override: formBool(fd, "override") });
      revalidatePath("/admin/leads");
      return { ok: true, message: others ? `Marcat ca trimis. Alte ${others} lead-uri ale persoanei: deja contactat.` : "Marcat ca trimis." };
    }
    if (intent === "skipped" || intent === "replied" || intent === "signed_up") {
      await setLeadStatus(leadId, intent);
      revalidatePath("/admin/leads");
      return { ok: true, message: MESSAGES[intent] };
    }
    throw new DomainError("intent", "Acțiune necunoscută.");
  } catch (err) {
    return toActionError(err);
  }
}
