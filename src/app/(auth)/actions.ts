"use server";

import { redirect } from "next/navigation";
import { toActionError, formBool, formStr, type ActionState } from "@/lib/action";
import { authenticate, requestPasswordReset, resetPassword, sendVerificationEmail, signUp } from "@/server/auth/service";
import { createSession, destroyAllSessions, destroySession, getCurrentUser } from "@/server/auth/session";
import { DomainError } from "@/server/errors";
import { rateLimit } from "@/server/rate-limit";
import { clientIp } from "@/server/request";

function safeNext(next: string | null | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export async function loginAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const ip = await clientIp();
    if (!(await rateLimit(`login:${ip}`, 10, 300))) throw new DomainError("rate", "Prea multe încercări. Așteaptă câteva minute.");
    const user = await authenticate(formStr(fd, "email"), formStr(fd, "password"));
    await createSession(user.id);
    const next = safeNext(formStr(fd, "next"));
    redirect(next ?? (user.onboardedAt ? "/panou" : "/onboarding"));
  } catch (err) {
    return toActionError(err);
  }
}

export async function signupAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const ip = await clientIp();
    if (!(await rateLimit(`signup:${ip}`, 5, 3600))) throw new DomainError("rate", "Prea multe conturi create de la această adresă. Încearcă mai târziu.");
    const user = await signUp({
      name: formStr(fd, "name"),
      email: formStr(fd, "email"),
      password: formStr(fd, "password"),
      terms: formBool(fd, "terms"),
      ref: formStr(fd, "ref") || undefined,
    });
    await createSession(user.id);
    const role = formStr(fd, "rol");
    redirect(`/onboarding${role ? `?rol=${encodeURIComponent(role)}` : ""}`);
  } catch (err) {
    return toActionError(err);
  }
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function resendVerificationAction(): Promise<ActionState> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new DomainError("auth", "Autentifică-te mai întâi.");
    if (!(await rateLimit(`verify:${user.id}`, 3, 3600))) throw new DomainError("rate", "Am trimis deja câteva emailuri. Verifică și folderul Spam.");
    await sendVerificationEmail(user.id);
    return { ok: true, message: "Ți-am retrimis emailul de confirmare." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function forgotPasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const ip = await clientIp();
    if (!(await rateLimit(`reset:${ip}`, 5, 3600))) throw new DomainError("rate", "Prea multe cereri. Încearcă mai târziu.");
    await requestPasswordReset(formStr(fd, "email"));
    return { ok: true, message: "Dacă există un cont cu acest email, vei primi un link de resetare în câteva minute." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function resetPasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const password = formStr(fd, "password");
    if (password !== formStr(fd, "confirm")) throw new DomainError("mismatch", "Parolele nu coincid.");
    const userId = await resetPassword(formStr(fd, "token"), password);
    await destroyAllSessions(userId);
    await createSession(userId);
    redirect("/panou");
  } catch (err) {
    return toActionError(err);
  }
}
