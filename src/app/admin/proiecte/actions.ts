"use server";

import { revalidatePath } from "next/cache";
import { formStr, toActionError, type ActionState } from "@/lib/action";
import { requireAdmin } from "@/server/auth/guards";
import { DomainError } from "@/server/errors";
import { approveProject, removeProject } from "@/server/projects/service";

export async function approveProjectAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const admin = await requireAdmin();
    await approveProject(formStr(fd, "projectId"), admin.id);
    revalidatePath("/admin/proiecte");
    revalidatePath("/admin/rapoarte");
    return { ok: true, message: "Proiect aprobat și publicat." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function removeProjectAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const admin = await requireAdmin();
    const reason = formStr(fd, "reason").trim();
    if (reason.length < 3) throw new DomainError("reason", "Scrie motivul eliminării.");
    const refunded = await removeProject(formStr(fd, "projectId"), admin.id, reason);
    revalidatePath("/admin/proiecte");
    revalidatePath("/admin/rapoarte");
    return { ok: true, message: `Proiect eliminat. Aplicări restituite: ${refunded}.` };
  } catch (err) {
    return toActionError(err);
  }
}
