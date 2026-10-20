"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { formNum, formStr, toActionError, type ActionState } from "@/lib/action";
import { requireAdmin } from "@/server/auth/guards";
import { getPlan, type PlanId } from "@/config/site";
import { grantCompPlan, revokeCompPlans } from "@/server/billing/plans";
import { db } from "@/server/db";
import { moderationActions, users } from "@/server/db/schema";
import { DomainError } from "@/server/errors";
import { notify } from "@/server/notifications";
import { banUser, unbanUser } from "@/server/trust/service";

export async function banUserAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const admin = await requireAdmin();
    const userId = formStr(fd, "userId");
    if (userId === admin.id) throw new DomainError("self", "Nu te poți suspenda singur.");
    const reason = formStr(fd, "reason").trim();
    if (reason.length < 3) throw new DomainError("reason", "Scrie motivul suspendării.");
    await banUser(userId, admin.id, reason);
    revalidatePath("/admin/utilizatori");
    return { ok: true, message: "Cont suspendat. Proiectele active au fost eliminate și sesiunile închise." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function unbanUserAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const admin = await requireAdmin();
    await unbanUser(formStr(fd, "userId"), admin.id);
    revalidatePath("/admin/utilizatori");
    return { ok: true, message: "Cont reactivat." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function grantPlanAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const admin = await requireAdmin();
    const userId = formStr(fd, "userId");
    const planId = formStr(fd, "planId") as PlanId;
    const days = formNum(fd, "days") ?? 0;
    const note = formStr(fd, "note").trim() || "Plan oferit de echipă";
    const plan = getPlan(planId);
    const res = await grantCompPlan(userId, planId, days);
    if (!res.granted) throw new DomainError("paid", "Utilizatorul are deja un abonament plătit.");
    await db.insert(moderationActions).values({ adminId: admin.id, action: "grant_plan", targetType: "user", targetId: userId, note: `${planId} · ${days} zile · ${note}` });
    await notify({ userId, type: "plan.granted", title: `Ai primit planul ${plan?.name} pentru ${days} zile`, body: note, link: "/abonament" });
    revalidatePath("/admin/utilizatori");
    return { ok: true, message: `Plan ${plan?.name} oferit pentru ${days} zile.` };
  } catch (err) {
    return toActionError(err);
  }
}

export async function revokePlanAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const admin = await requireAdmin();
    const userId = formStr(fd, "userId");
    const n = await revokeCompPlans(userId);
    if (n === 0) throw new DomainError("none", "Utilizatorul nu are un plan oferit activ.");
    await db.insert(moderationActions).values({ adminId: admin.id, action: "revoke_plan", targetType: "user", targetId: userId });
    revalidatePath("/admin/utilizatori");
    return { ok: true, message: "Planul oferit a fost anulat." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function toggleAdminAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const admin = await requireAdmin();
    const userId = formStr(fd, "userId");
    if (userId === admin.id) throw new DomainError("self", "Nu îți poți schimba propriul rol.");
    const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
    if (!u) throw new DomainError("not_found", "Utilizator inexistent.");
    const role = u.role === "admin" ? "user" : "admin";
    await db.update(users).set({ role }).where(eq(users.id, userId));
    await db.insert(moderationActions).values({ adminId: admin.id, action: `set_role_${role}`, targetType: "user", targetId: userId });
    revalidatePath("/admin/utilizatori");
    return { ok: true, message: role === "admin" ? "Utilizatorul este acum admin." : "Rol de admin retras." };
  } catch (err) {
    return toActionError(err);
  }
}
