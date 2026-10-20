"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { toActionError, type ActionState } from "@/lib/action";
import { describeBudget } from "@/lib/format";
import { compareApplications, type ApplicationComparison } from "@/server/ai/features";
import { hireApplication, rejectApplication, reopenSelection, shortlistApplication } from "@/server/applications/service";
import { requireOnboardedUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { applications, projects, providerProfiles, users } from "@/server/db/schema";
import { DomainError } from "@/server/errors";
import { closeProject, getOrCreateShareText, publishProject } from "@/server/projects/service";
import { labels } from "@/config/site";

async function ownProject(projectId: string) {
  const user = await requireOnboardedUser(`/proiectele-mele/${projectId}`);
  const [p] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!p || p.clientId !== user.id) throw new DomainError("not_found", "Proiectul nu există.");
  return { user, project: p };
}

function refresh(projectId: string) {
  revalidatePath(`/proiectele-mele/${projectId}`);
  revalidatePath("/proiectele-mele");
}

export async function publishAction(projectId: string): Promise<ActionState> {
  try {
    const { user } = await ownProject(projectId);
    const status = await publishProject(projectId, user.id);
    refresh(projectId);
    return {
      ok: true,
      message:
        status === "open"
          ? "Proiectul a fost publicat. Prestatorii compatibili primesc acum notificări."
          : "Proiectul a fost trimis la verificare. Te anunțăm imediat ce este publicat.",
    };
  } catch (err) {
    return toActionError(err);
  }
}

export async function closeAction(projectId: string, outcome: "closed" | "cancelled"): Promise<ActionState> {
  try {
    const { user } = await ownProject(projectId);
    await closeProject(projectId, user.id, outcome, outcome === "cancelled" ? "Anulat de client" : "Închis de client");
    refresh(projectId);
    return { ok: true, message: outcome === "closed" ? "Proiectul a fost închis." : "Proiectul a fost anulat." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function reopenAction(projectId: string): Promise<ActionState> {
  try {
    const { user } = await ownProject(projectId);
    await reopenSelection(projectId, user.id);
    refresh(projectId);
    return { ok: true, message: "Am adăugat încă 5 locuri pentru oferte." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function toggleAutoBidsAction(projectId: string, allow: boolean): Promise<ActionState> {
  try {
    await ownProject(projectId);
    await db.update(projects).set({ allowAutoBids: allow }).where(eq(projects.id, projectId));
    refresh(projectId);
    return { ok: true, message: allow ? "Aplicările automate sunt permise." : "Nu mai primești aplicări automate." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function shareTextAction(projectId: string): Promise<ActionState<{ text: string }>> {
  try {
    const { user } = await ownProject(projectId);
    const text = await getOrCreateShareText(projectId, user.id);
    return { ok: true, data: { text } };
  } catch (err) {
    return toActionError(err);
  }
}

async function ownApplication(applicationId: string) {
  const user = await requireOnboardedUser();
  const [row] = await db
    .select({ projectId: applications.projectId, clientId: projects.clientId })
    .from(applications)
    .innerJoin(projects, eq(projects.id, applications.projectId))
    .where(eq(applications.id, applicationId));
  if (!row || row.clientId !== user.id) throw new DomainError("not_found", "Oferta nu există.");
  return { user, projectId: row.projectId };
}

export async function shortlistAction(applicationId: string, on: boolean): Promise<ActionState> {
  try {
    const { user, projectId } = await ownApplication(applicationId);
    await shortlistApplication(applicationId, user.id, on);
    refresh(projectId);
    return { ok: true, message: on ? "Adăugată pe lista scurtă. Prestatorul a fost anunțat." : "Scoasă de pe lista scurtă." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function rejectAction(applicationId: string, reason: string): Promise<ActionState> {
  try {
    const { user, projectId } = await ownApplication(applicationId);
    await rejectApplication(applicationId, user.id, reason.trim() || undefined);
    refresh(projectId);
    return { ok: true, message: "Oferta a fost respinsă. Prestatorul a fost anunțat." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function hireAction(applicationId: string): Promise<ActionState> {
  try {
    const { user, projectId } = await ownApplication(applicationId);
    await hireApplication(applicationId, user.id);
    refresh(projectId);
    revalidatePath("/colaborari");
    return { ok: true, message: "Ai ales prestatorul! Proiectul a trecut „în desfășurare”." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function compareAction(projectId: string, criteria: string): Promise<ActionState<ApplicationComparison>> {
  try {
    const { user, project } = await ownProject(projectId);
    const rows = await db
      .select({
        app: applications,
        name: users.name,
        issuesInvoice: users.issuesInvoice,
        rating: providerProfiles.ratingAvg,
        completed: providerProfiles.completedCount,
        distanceKm: sql<number | null>`CASE WHEN ${providerProfiles.geo} IS NOT NULL AND ${projects.geo} IS NOT NULL THEN ST_Distance(${providerProfiles.geo}, ${projects.geo}) / 1000 END`,
      })
      .from(applications)
      .innerJoin(users, eq(users.id, applications.providerId))
      .innerJoin(projects, eq(projects.id, applications.projectId))
      .leftJoin(providerProfiles, eq(providerProfiles.userId, applications.providerId))
      .where(and(eq(applications.projectId, projectId), sql`${applications.status} IN ('submitted','viewed','shortlisted')`));
    if (rows.length < 1) throw new DomainError("none", "Nu există oferte active de comparat.");
    const result = await compareApplications(
      { title: project.title, description: project.description, budgetMax: project.budgetMax },
      rows.map((r) => ({
        applicationId: r.app.id,
        provider: r.name,
        message: r.app.message.slice(0, 1_500),
        price: r.app.priceAmount
          ? `${r.app.priceAmount} lei (${labels.priceType[r.app.priceType]})`
          : labels.priceType[r.app.priceType],
        rating: r.rating,
        issuesInvoice: r.issuesInvoice,
        distanceKm: r.distanceKm === null ? null : Math.round(Number(r.distanceKm)),
        completed: r.completed ?? 0,
      })),
      criteria.trim().slice(0, 500) || null,
      user.id,
    );
    if (!result) {
      throw new DomainError(
        "ai_off",
        `Comparația AI nu este disponibilă acum. Folosește filtrele de mai jos (bugetul tău: ${describeBudget(project)}).`,
      );
    }
    return { ok: true, data: result };
  } catch (err) {
    return toActionError(err);
  }
}
