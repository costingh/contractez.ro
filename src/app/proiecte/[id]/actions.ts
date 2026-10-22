"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { formNum, formStr, toActionError, type ActionState } from "@/lib/action";
import { isUuid } from "@/lib/ids";
import { draftProposal } from "@/server/ai/features";
import { applyToProject } from "@/server/applications/service";
import { getCurrentUser } from "@/server/auth/session";
import { getLocality } from "@/server/catalog/localities";
import { db } from "@/server/db";
import { conversations, projects, providerProfiles, providerServices, savedProjects } from "@/server/db/schema";
import { DomainError, isDomainError } from "@/server/errors";
import { rateLimit } from "@/server/rate-limit";
import { createReport } from "@/server/trust/service";

export type ApplyState =
  | { ok: true; message: string; conversationId?: string }
  | { ok: false; error: string; code?: string }
  | null;

export async function applyAction(_: ApplyState, fd: FormData): Promise<ApplyState> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new DomainError("auth", "Autentifică-te pentru a aplica.");
    const projectId = formStr(fd, "projectId");
    if (!isUuid(projectId)) throw new DomainError("not_found", "Proiectul nu există.");
    const priceType = formStr(fd, "priceType");
    const app = await applyToProject({
      providerId: user.id,
      projectId,
      message: formStr(fd, "message"),
      priceAmount: formNum(fd, "priceAmount"),
      priceType: (["fixed", "hourly", "monthly", "to_discuss"].includes(priceType) ? priceType : "to_discuss") as
        | "fixed"
        | "hourly"
        | "monthly"
        | "to_discuss",
      estimatedDays: formNum(fd, "estimatedDays"),
    });
    const [conv] = await db.select({ id: conversations.id }).from(conversations).where(eq(conversations.applicationId, app.id));
    revalidatePath(`/proiecte/${projectId}`);
    return { ok: true, message: "Oferta a fost trimisă! Vei fi anunțat când clientul o citește.", conversationId: conv?.id };
  } catch (err) {
    if (isDomainError(err)) return { ok: false, error: err.message, code: err.code };
    const e = toActionError(err);
    return { ok: false, error: e.error };
  }
}

export async function draftProposalAction(projectId: string): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  try {
    const user = await getCurrentUser();
    if (!user?.isProvider) throw new DomainError("auth", "Doar prestatorii pot genera propuneri.");
    if (!(await rateLimit(`draft:${user.id}`, 20, 3600))) throw new DomainError("rate", "Ai generat multe propuneri. Încearcă mai târziu.");
    if (!isUuid(projectId)) throw new DomainError("not_found", "Proiectul nu există.");
    const [p] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!p) throw new DomainError("not_found", "Proiectul nu există.");
    // Doar pentru proiecte publice, deschise ofertelor (nu ciorne, proiecte în verificare sau închise).
    if (p.status !== "open" || (p.expiresAt && p.expiresAt < new Date())) throw new DomainError("closed", "Proiectul nu mai acceptă oferte.");
    const [profile] = await db.select().from(providerProfiles).where(eq(providerProfiles.userId, user.id));
    const services = await db.select({ title: providerServices.title }).from(providerServices).where(eq(providerServices.providerId, user.id));
    const loc = p.localityId ? await getLocality(p.localityId) : null;
    const text = await draftProposal(
      {
        project: {
          title: p.title,
          description: p.description,
          budgetMin: p.budgetMin,
          budgetMax: p.budgetMax,
          budgetType: p.budgetType,
          workMode: p.workMode,
          localityName: loc?.name ?? null,
        },
        provider: {
          name: user.name,
          headline: profile?.headline ?? "",
          bio: profile?.bio ?? "",
          hourlyRate: profile?.hourlyRate ?? null,
          yearsExperience: profile?.yearsExperience ?? null,
          services: services.map((s) => s.title),
        },
      },
      user.id,
    );
    return { ok: true, text };
  } catch (err) {
    return toActionError(err);
  }
}

export async function toggleSaveAction(projectId: string): Promise<{ ok: true; saved: boolean } | { ok: false; error: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new DomainError("auth", "Autentifică-te pentru a salva proiecte.");
    if (!isUuid(projectId)) throw new DomainError("not_found", "Proiectul nu există.");
    const where = and(eq(savedProjects.userId, user.id), eq(savedProjects.projectId, projectId));
    const [existing] = await db.select().from(savedProjects).where(where);
    if (existing) await db.delete(savedProjects).where(where);
    else await db.insert(savedProjects).values({ userId: user.id, projectId }).onConflictDoNothing();
    revalidatePath(`/proiecte/${projectId}`);
    return { ok: true, saved: !existing };
  } catch (err) {
    return toActionError(err);
  }
}

export async function reportAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new DomainError("auth", "Autentifică-te pentru a raporta.");
    if (!(await rateLimit(`report:${user.id}`, 10, 3600))) throw new DomainError("rate", "Prea multe raportări. Încearcă mai târziu.");
    if (!isUuid(formStr(fd, "targetId"))) throw new DomainError("not_found", "Elementul raportat nu există.");
    await createReport(user.id, {
      targetType: formStr(fd, "targetType") || "project",
      targetId: formStr(fd, "targetId"),
      reason: formStr(fd, "reason"),
      details: formStr(fd, "details"),
    });
    return { ok: true, message: "Mulțumim! Echipa de moderare va verifica raportarea." };
  } catch (err) {
    return toActionError(err);
  }
}
