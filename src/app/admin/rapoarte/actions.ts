"use server";

import { revalidatePath } from "next/cache";
import { formStr, toActionError, type ActionState } from "@/lib/action";
import { requireAdmin } from "@/server/auth/guards";
import { DomainError } from "@/server/errors";
import { removeProject } from "@/server/projects/service";
import { banUser, hideReview, resolveReport } from "@/server/trust/service";

export async function resolveReportAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const admin = await requireAdmin();
    const status = formStr(fd, "status") === "dismissed" ? "dismissed" : "resolved";
    await resolveReport(formStr(fd, "reportId"), admin.id, status, formStr(fd, "resolution").trim() || (status === "dismissed" ? "Fără acțiune" : "Rezolvat"));
    revalidatePath("/admin/rapoarte");
    return { ok: true, message: status === "dismissed" ? "Raportare respinsă." : "Raportare rezolvată." };
  } catch (err) {
    return toActionError(err);
  }
}

/** Acțiune rapidă pe ținta raportării, apoi închide raportarea. */
export async function quickActionAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const admin = await requireAdmin();
    const kind = formStr(fd, "kind");
    const targetId = formStr(fd, "targetId");
    const reportId = formStr(fd, "reportId");
    const reason = formStr(fd, "reason").trim() || "Încălcarea regulilor platformei";
    let message = "";
    if (kind === "remove_project") {
      const refunded = await removeProject(targetId, admin.id, reason);
      message = `Proiect eliminat, ${refunded} aplicări restituite.`;
    } else if (kind === "ban_user") {
      if (targetId === admin.id) throw new DomainError("self", "Nu te poți suspenda singur.");
      await banUser(targetId, admin.id, reason);
      message = "Utilizator suspendat.";
    } else if (kind === "hide_review") {
      await hideReview(targetId, admin.id, true);
      message = "Recenzie ascunsă.";
    } else {
      throw new DomainError("kind", "Acțiune necunoscută.");
    }
    if (reportId) await resolveReport(reportId, admin.id, "resolved", `${message} ${reason}`);
    revalidatePath("/admin/rapoarte");
    return { ok: true, message };
  } catch (err) {
    return toActionError(err);
  }
}
