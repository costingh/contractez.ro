"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formBool, formNum, formStr, toActionError, type ActionState } from "@/lib/action";
import { deleteAccount, savePreferences } from "@/server/account";
import { requireUser } from "@/server/auth/guards";
import { changePassword, sendPhoneOtp, verifyPhoneOtp } from "@/server/auth/service";
import { createSession, destroyAllSessions, destroySession } from "@/server/auth/session";
import { setContactPhone } from "@/server/contact";
import { DomainError } from "@/server/errors";
import { rateLimit } from "@/server/rate-limit";

export async function savePreferencesAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const user = await requireUser("/setari");
    await savePreferences(user.id, {
      matchFrequency: formStr(fd, "matchFrequency") || "instant",
      messagesEmail: formBool(fd, "messagesEmail"),
      applicationUpdatesEmail: formBool(fd, "applicationUpdatesEmail"),
      autoBidEmail: formBool(fd, "autoBidEmail"),
      productEmail: formBool(fd, "productEmail"),
      minMatchScore: formNum(fd, "minMatchScore") ?? 60,
    });
    revalidatePath("/setari");
    return { ok: true, message: "Preferințele au fost salvate." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function changePasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const user = await requireUser("/setari");
    const next = formStr(fd, "next");
    if (next !== formStr(fd, "confirm")) throw new DomainError("mismatch", "Parolele noi nu coincid.");
    if (!(await rateLimit(`pwchange:${user.id}`, 5, 900))) throw new DomainError("rate", "Prea multe încercări. Așteaptă câteva minute.");
    await changePassword(user.id, formStr(fd, "current"), next);
    // Invalidează celelalte sesiuni după schimbarea parolei.
    await destroyAllSessions(user.id);
    await createSession(user.id);
    return { ok: true, message: "Parola a fost schimbată. Te-am deconectat de pe celelalte dispozitive." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function sendOtpAction(_: ActionState<{ phone: string }>, fd: FormData): Promise<ActionState<{ phone: string }>> {
  try {
    const user = await requireUser("/setari");
    if (!(await rateLimit(`otp:${user.id}`, 3, 900))) throw new DomainError("rate", "Ai cerut deja câteva coduri. Încearcă din nou peste 15 minute.");
    const phone = await sendPhoneOtp(user.id, formStr(fd, "phone"));
    return { ok: true, message: `Ți-am trimis un cod prin SMS la ${phone}.`, data: { phone } };
  } catch (err) {
    return toActionError(err);
  }
}

export async function verifyOtpAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const user = await requireUser("/setari");
    await verifyPhoneOtp(user.id, formStr(fd, "code"));
    revalidatePath("/setari");
    revalidatePath("/onboarding");
    revalidatePath("/panou");
    return { ok: true, message: "Telefonul a fost verificat." };
  } catch (err) {
    return toActionError(err);
  }
}

/** Telefonul de contact (fără SMS): vizibil doar celeilalte părți dintr-o colaborare acceptată. */
export async function saveContactPhoneAction(_: ActionState<{ phone: string | null }>, fd: FormData): Promise<ActionState<{ phone: string | null }>> {
  try {
    const user = await requireUser("/setari");
    if (!(await rateLimit(`contact-phone:${user.id}`, 10, 900))) throw new DomainError("rate", "Prea multe modificări. Încearcă din nou peste câteva minute.");
    const phone = await setContactPhone(user.id, formStr(fd, "phone"));
    revalidatePath("/setari");
    revalidatePath("/onboarding");
    return { ok: true, message: phone ? "Numărul de telefon a fost salvat." : "Numărul de telefon a fost șters.", data: { phone } };
  } catch (err) {
    return toActionError(err);
  }
}

export async function logoutEverywhereAction(): Promise<ActionState> {
  try {
    const user = await requireUser("/setari");
    await destroyAllSessions(user.id);
    await createSession(user.id);
    return { ok: true, message: "Te-am deconectat de pe toate celelalte dispozitive." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function deleteAccountAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const user = await requireUser("/setari");
    if (!["ȘTERGE", "ŞTERGE", "STERGE"].includes(formStr(fd, "confirm").trim().toUpperCase())) {
      throw new DomainError("confirm", "Scrie „ȘTERGE” pentru a confirma.");
    }
    await deleteAccount(user.id);
    await destroySession();
    redirect("/?cont=sters");
  } catch (err) {
    return toActionError(err);
  }
}
