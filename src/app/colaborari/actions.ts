"use server";

import { revalidatePath } from "next/cache";
import { formBool, formStr, toActionError, type ActionState } from "@/lib/action";
import { isUuid } from "@/lib/ids";
import { requireOnboardedUser } from "@/server/auth/guards";
import { cancelCollaboration, completeCollaboration, confirmCollaboration, leaveReview } from "@/server/trust/service";

export async function confirmAction(id: string): Promise<ActionState> {
  if (!isUuid(id)) return { ok: false, error: "Colaborarea nu există." };
  try {
    const user = await requireOnboardedUser("/colaborari");
    await confirmCollaboration(id, user.id);
    revalidatePath("/colaborari");
    return { ok: true, message: "Colaborarea este confirmată. Spor la treabă!" };
  } catch (err) {
    return toActionError(err);
  }
}

export async function completeAction(id: string): Promise<ActionState> {
  if (!isUuid(id)) return { ok: false, error: "Colaborarea nu există." };
  try {
    const user = await requireOnboardedUser("/colaborari");
    await completeCollaboration(id, user.id);
    revalidatePath("/colaborari");
    revalidatePath("/proiectele-mele");
    return { ok: true, message: "Colaborarea a fost marcată ca finalizată." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function cancelAction(id: string): Promise<ActionState> {
  if (!isUuid(id)) return { ok: false, error: "Colaborarea nu există." };
  try {
    const user = await requireOnboardedUser("/colaborari");
    await cancelCollaboration(id, user.id);
    revalidatePath("/colaborari");
    revalidatePath("/proiectele-mele", "layout");
    revalidatePath("/aplicarile-mele");
    return { ok: true, message: "Colaborarea a fost anulată, iar cealaltă parte a fost anunțată." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function reviewAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const user = await requireOnboardedUser("/colaborari");
    await leaveReview(formStr(fd, "collaborationId"), user.id, {
      rating: formStr(fd, "rating"),
      comment: formStr(fd, "comment"),
      hideAuthor: formBool(fd, "hideAuthor"),
    });
    revalidatePath("/colaborari");
    return { ok: true, message: "Mulțumim! Recenzia ta a fost publicată." };
  } catch (err) {
    return toActionError(err);
  }
}
