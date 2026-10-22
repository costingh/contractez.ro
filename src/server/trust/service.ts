import { and, desc, eq, inArray, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import { z } from "zod";
import { truncate } from "@/lib/text";
import { track } from "../analytics";
import { db } from "../db";
import {
  applicationEvents,
  applications,
  collaborations,
  conversations,
  moderationActions,
  projectStatusHistory,
  projects,
  reports,
  reviews,
  sessions,
  users,
} from "../db/schema";
import { DomainError } from "../errors";
import { notify } from "../notifications";
import { collabCancelledTemplate, collabCompletedTemplate, projectReportedAdminTemplate } from "../email/templates";
import { refreshProviderStats } from "../providers/service";
import { systemMessage } from "../chat/service";

/* ------------------------------ Colaborări ------------------------------ */

export async function listCollaborations(userId: string) {
  return db
    .select({
      collab: collaborations,
      projectTitle: projects.title,
      clientName: sql<string>`(SELECT name FROM users WHERE id = ${collaborations.clientId})`,
      providerName: sql<string>`(SELECT name FROM users WHERE id = ${collaborations.providerId})`,
      myReview: sql<number | null>`(SELECT rating FROM reviews r WHERE r.collaboration_id = ${collaborations.id} AND r.author_id = ${userId})`,
      conversationId: sql<string | null>`(SELECT id FROM conversations c WHERE c.application_id = ${collaborations.applicationId})`,
    })
    .from(collaborations)
    .innerJoin(projects, eq(projects.id, collaborations.projectId))
    .where(or(eq(collaborations.clientId, userId), eq(collaborations.providerId, userId)))
    .orderBy(desc(collaborations.createdAt));
}

async function loadCollab(id: string, userId: string) {
  const [c] = await db.select().from(collaborations).where(eq(collaborations.id, id));
  if (!c || (c.clientId !== userId && c.providerId !== userId)) throw new DomainError("not_found", "Colaborarea nu există.");
  return c;
}

async function conversationIdFor(applicationId: string) {
  const [c] = await db.select({ id: conversations.id }).from(conversations).where(eq(conversations.applicationId, applicationId));
  return c?.id ?? null;
}

/** Prestatorul confirmă colaborarea (dublă confirmare = recenzii verificate). */
export async function confirmCollaboration(id: string, providerId: string) {
  const c = await loadCollab(id, providerId);
  if (c.providerId !== providerId) throw new DomainError("forbidden", "Doar prestatorul poate confirma.");
  if (c.status !== "pending_confirmation") return;
  await db.update(collaborations).set({ status: "active", confirmedAt: new Date() }).where(eq(collaborations.id, id));
  const conv = await conversationIdFor(c.applicationId);
  if (conv) await systemMessage(conv, "✅ Colaborarea a fost confirmată de ambele părți.");
  await notify({ userId: c.clientId, type: "collab.confirmed", title: "Prestatorul a confirmat colaborarea", link: "/colaborari", dedupeKey: `collab-confirmed:${id}` });
}

export async function completeCollaboration(id: string, userId: string) {
  const c = await loadCollab(id, userId);
  if (c.status === "completed") return;
  if (c.status === "cancelled") throw new DomainError("state", "Colaborarea a fost anulată.");
  // Doar o colaborare confirmată de prestator poate fi finalizată (altfel clientul ar putea „verifica” singur o recenzie).
  if (c.status !== "active" || !c.confirmedAt) {
    throw new DomainError("state", "Colaborarea trebuie confirmată de prestator înainte de a fi finalizată.");
  }
  const [done] = await db
    .update(collaborations)
    .set({ status: "completed", completedAt: new Date() })
    .where(and(eq(collaborations.id, id), eq(collaborations.status, "active")))
    .returning({ id: collaborations.id });
  if (!done) return;
  const [p] = await db.select().from(projects).where(eq(projects.id, c.projectId));
  if (p && p.status === "in_progress") {
    await db.update(projects).set({ status: "closed", closedAt: new Date() }).where(eq(projects.id, p.id));
    await db.insert(projectStatusHistory).values({ projectId: p.id, fromStatus: "in_progress", toStatus: "closed", actorId: userId, reason: "Colaborare finalizată" });
  }
  await refreshProviderStats(c.providerId);
  const other = userId === c.clientId ? c.providerId : c.clientId;
  await notify({
    userId: other,
    type: "collab.completed",
    title: "Colaborare finalizată — lasă o recenzie",
    link: "/colaborari",
    dedupeKey: `collab-completed:${id}:${other}`,
    email: collabCompletedTemplate({ projectTitle: p?.title }),
  });
  await track("collaboration.completed", userId, { collaborationId: id });
}

export const COLLAB_CANCELLED_REASON = "Colaborare anulată";

/**
 * Oricare parte poate anula o colaborare neîncheiată. Într-o singură tranzacție (cu proiectul blocat, ca alegerea
 * unui prestator): colaborarea devine anulată, oferta aleasă devine respinsă („Colaborare anulată”), iar proiectul
 * revine „deschis” dacă nu a expirat (altfel se închide), cu rând în istoric. Cealaltă parte este anunțată.
 */
export async function cancelCollaboration(id: string, userId: string) {
  const c = await loadCollab(id, userId);
  if (c.status === "completed") throw new DomainError("state", "Colaborarea este deja finalizată.");
  if (c.status === "cancelled") return;
  const byClient = userId === c.clientId;

  const res = await db.transaction(async (tx) => {
    const [project] = await tx.select().from(projects).where(eq(projects.id, c.projectId)).for("update");
    const [cancelled] = await tx
      .update(collaborations)
      .set({ status: "cancelled" })
      .where(and(eq(collaborations.id, id), inArray(collaborations.status, ["pending_confirmation", "active"])))
      .returning({ id: collaborations.id });
    if (!cancelled) return null; // anulată sau finalizată între timp
    await tx
      .update(applications)
      .set({ status: "rejected", rejectionReason: COLLAB_CANCELLED_REASON, decidedAt: new Date() })
      .where(and(eq(applications.id, c.applicationId), eq(applications.status, "hired")));
    await tx.insert(applicationEvents).values({ applicationId: c.applicationId, type: "collab_cancelled", actorId: userId, data: { byClient } });

    let projectStatus: (typeof projects.$inferSelect)["status"] | null = null;
    if (project?.status === "in_progress") {
      const expired = Boolean(project.expiresAt && project.expiresAt <= new Date());
      projectStatus = expired ? "closed" : "open";
      await tx
        .update(projects)
        .set(expired ? { status: "closed", closedAt: new Date() } : { status: "open" })
        .where(eq(projects.id, project.id));
      await tx.insert(projectStatusHistory).values({
        projectId: project.id,
        fromStatus: "in_progress",
        toStatus: projectStatus,
        actorId: userId,
        reason: `${COLLAB_CANCELLED_REASON} de ${byClient ? "client" : "prestator"}`,
      });
    }
    return { projectTitle: project?.title ?? "", projectStatus };
  });
  if (!res) return;

  const reopened = res.projectStatus === "open";
  const conv = await conversationIdFor(c.applicationId);
  if (conv) await systemMessage(conv, `Colaborarea a fost anulată de ${byClient ? "client" : "prestator"}.`);
  const otherId = byClient ? c.providerId : c.clientId;
  const title = truncate(res.projectTitle, 60);
  await notify({
    userId: otherId,
    type: "collab.cancelled",
    title: `${byClient ? "Clientul" : "Prestatorul"} a anulat colaborarea pentru „${title}”`,
    body: byClient
      ? undefined
      : reopened
        ? "Proiectul este din nou deschis pentru oferte."
        : "Proiectul a expirat între timp, așa că l-am închis.",
    link: byClient ? "/aplicarile-mele" : `/proiectele-mele/${c.projectId}`,
    dedupeKey: `collab-cancelled:${id}`,
    email: collabCancelledTemplate({ projectTitle: title, byClient, projectReopened: reopened }),
  });
  await track("collaboration.cancelled", userId, { collaborationId: id, byClient });
}

/* -------------------------------- Recenzii -------------------------------- */

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(2_000).default(""),
  hideAuthor: z.boolean().default(false),
});

/**
 * Doar participanții unei colaborări confirmate/finalizate pot lăsa recenzii.
 * `hideAuthor`: public apare „Client verificat” / „Prestator verificat”; persoana evaluată vede totuși cine a scris-o.
 */
export async function leaveReview(collaborationId: string, authorId: string, raw: unknown) {
  const input = reviewSchema.parse(raw);
  const c = await loadCollab(collaborationId, authorId);
  if (!["active", "completed"].includes(c.status) || !c.confirmedAt) {
    throw new DomainError("state", "Poți lăsa recenzie după ce colaborarea este confirmată.");
  }
  const targetId = authorId === c.clientId ? c.providerId : c.clientId;
  const [row] = await db
    .insert(reviews)
    .values({ collaborationId, authorId, targetId, rating: input.rating, comment: input.comment, hideAuthor: input.hideAuthor })
    .onConflictDoNothing()
    .returning();
  if (!row) throw new DomainError("duplicate", "Ai lăsat deja o recenzie pentru această colaborare.");
  await refreshProviderStats(targetId);
  await notify({ userId: targetId, type: "review.new", title: `Ai primit o recenzie de ${input.rating}★`, link: "/profil#recenzii", dedupeKey: `review:${row.id}` });
}

export async function replyToReview(reviewId: string, userId: string, reply: string) {
  const [r] = await db.select().from(reviews).where(eq(reviews.id, reviewId));
  if (!r || r.targetId !== userId) throw new DomainError("not_found", "Recenzia nu există.");
  await db.update(reviews).set({ reply: reply.trim().slice(0, 1_000) }).where(eq(reviews.id, reviewId));
}

/** Eticheta publică pentru un autor ascuns: rolul lui în colaborare, confirmat de platformă. */
export function hiddenAuthorLabel(authorIsClient: boolean) {
  return authorIsClient ? "Client verificat" : "Prestator verificat";
}

/** Recenziile publice: autorul ascuns apare ca „Client/Prestator verificat”, cu excepția persoanei evaluate. */
export async function reviewsFor(targetId: string, viewerId: string | null) {
  const rows = await db
    .select({ review: reviews, authorName: users.name, projectTitle: projects.title, collabClientId: collaborations.clientId })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.authorId))
    .innerJoin(collaborations, eq(collaborations.id, reviews.collaborationId))
    .innerJoin(projects, eq(projects.id, collaborations.projectId))
    .where(and(eq(reviews.targetId, targetId), eq(reviews.hiddenByAdmin, false)))
    .orderBy(desc(reviews.createdAt))
    .limit(100);
  return rows.map((r) => ({
    ...r.review,
    authorName: r.review.hideAuthor && viewerId !== targetId ? hiddenAuthorLabel(r.review.authorId === r.collabClientId) : r.authorName,
    authorRole: r.review.authorId === r.collabClientId ? ("client" as const) : ("provider" as const),
    authorHidden: r.review.hideAuthor,
    projectTitle: truncate(r.projectTitle, 80),
  }));
}

/* ------------------------------- Raportări ------------------------------- */

export const reportSchema = z.object({
  targetType: z.enum(["project", "user", "application", "message", "review"]),
  targetId: z.string().min(1).max(100),
  reason: z.enum(["spam", "fraud", "fake_project", "duplicate", "abusive", "inappropriate", "other"]),
  details: z.string().trim().max(2_000).default(""),
});

/** Câți raportori distincți (de încredere) ascund automat un proiect până la verificarea unui administrator. */
export const REPORT_LOCK_THRESHOLD = 3;
export const REPORT_LOCK_NOTE = "Raportat de mai mulți utilizatori";
/** Vechimea minimă a contului pentru ca o raportare să se socotească la blocarea automată. */
const TRUSTED_REPORTER_MIN_AGE_MS = 24 * 3_600_000;

export async function createReport(reporterId: string, raw: unknown) {
  const input = reportSchema.parse(raw);
  const [dup] = await db
    .select({ id: reports.id })
    .from(reports)
    .where(and(eq(reports.reporterId, reporterId), eq(reports.targetType, input.targetType), eq(reports.targetId, input.targetId), eq(reports.status, "open")));
  if (dup) return dup.id;
  const [r] = await db.insert(reports).values({ reporterId, ...input }).returning({ id: reports.id });
  if (input.targetType === "project") await maybeLockReportedProject(input.targetId);
  return r.id;
}

/**
 * Proiect deschis raportat de cel puțin REPORT_LOCK_THRESHOLD utilizatori de încredere (email confirmat, cont configurat
 * de peste 24 de ore, nesuspendat) → îl ascundem („în verificare”) cu blocaj de moderare: doar un administrator îl
 * poate aproba sau elimina. Scriem istoricul și anunțăm administratorii (și clientul, în aplicație).
 */
async function maybeLockReportedProject(projectId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(projectId)) return;
  const trusted = await db
    .selectDistinct({ reporterId: reports.reporterId, reason: reports.reason })
    .from(reports)
    .innerJoin(users, eq(users.id, reports.reporterId))
    .where(
      and(
        eq(reports.targetType, "project"),
        eq(reports.targetId, projectId),
        eq(reports.status, "open"),
        isNotNull(users.emailVerifiedAt),
        isNotNull(users.onboardedAt),
        isNull(users.bannedAt),
        isNull(users.deletedAt),
        lt(users.createdAt, new Date(Date.now() - TRUSTED_REPORTER_MIN_AGE_MS)),
      ),
    );
  const reporters = new Set(trusted.map((t) => t.reporterId)).size;
  if (reporters < REPORT_LOCK_THRESHOLD) return;

  const locked = await db.transaction(async (tx) => {
    const [p] = await tx
      .update(projects)
      .set({ status: "pending_review", moderationLock: true, moderationNote: REPORT_LOCK_NOTE })
      .where(and(eq(projects.id, projectId), eq(projects.status, "open")))
      .returning({ id: projects.id, title: projects.title, clientId: projects.clientId });
    if (!p) return null;
    await tx.insert(projectStatusHistory).values({
      projectId,
      fromStatus: "open",
      toStatus: "pending_review",
      reason: `${REPORT_LOCK_NOTE} (${reporters} raportări)`,
    });
    return p;
  });
  if (!locked) return;

  const title = truncate(locked.title, 60);
  const reasons = [...new Set(trusted.map((t) => REPORT_REASON_LABELS[t.reason] ?? t.reason))];
  const admins = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.role, "admin"), isNull(users.bannedAt), isNull(users.deletedAt)));
  for (const a of admins) {
    await notify({
      userId: a.id,
      type: "admin.project_reported",
      title: `Proiect blocat după raportări: „${title}”`,
      body: `${reporters} utilizatori verificați l-au raportat. Aprobă-l sau elimină-l.`,
      link: "/admin/rapoarte",
      dedupeKey: `project-reported:${projectId}:${a.id}:${Date.now()}`,
      email: projectReportedAdminTemplate({ projectTitle: title, reporters, reasons }),
    });
  }
  await notify({
    userId: locked.clientId,
    type: "project.reported",
    title: `Proiectul „${title}” este în verificare`,
    body: "Mai mulți utilizatori l-au raportat. Un administrator îl va revizui și te anunțăm imediat ce ia o decizie.",
    link: `/proiectele-mele/${projectId}`,
    dedupeKey: `project-reported:${projectId}:${Date.now()}`,
  });
}

export const REPORT_REASON_LABELS: Record<string, string> = {
  spam: "Spam",
  fraud: "Fraudă",
  fake_project: "Proiect fals",
  duplicate: "Duplicat",
  abusive: "Limbaj abuziv",
  inappropriate: "Conținut nepotrivit",
  other: "Altceva",
};

export async function resolveReport(reportId: string, adminId: string, status: "resolved" | "dismissed", resolution: string) {
  await db.update(reports).set({ status, resolution, resolvedById: adminId, resolvedAt: new Date() }).where(eq(reports.id, reportId));
  await db.insert(moderationActions).values({ adminId, action: `report_${status}`, targetType: "report", targetId: reportId, note: resolution });
}

export async function banUser(userId: string, adminId: string, reason: string) {
  await db.update(users).set({ bannedAt: new Date(), banReason: reason }).where(eq(users.id, userId));
  await db.delete(sessions).where(eq(sessions.userId, userId));
  await db.update(projects).set({ status: "removed", moderationNote: `Cont suspendat: ${reason}` }).where(and(eq(projects.clientId, userId), sql`${projects.status} IN ('open','pending_review','draft')`));
  await db.insert(moderationActions).values({ adminId, action: "ban_user", targetType: "user", targetId: userId, note: reason });
}

export async function unbanUser(userId: string, adminId: string) {
  await db.update(users).set({ bannedAt: null, banReason: null }).where(eq(users.id, userId));
  await db.insert(moderationActions).values({ adminId, action: "unban_user", targetType: "user", targetId: userId });
}

export async function hideReview(reviewId: string, adminId: string, hidden: boolean) {
  const [r] = await db.update(reviews).set({ hiddenByAdmin: hidden }).where(eq(reviews.id, reviewId)).returning();
  if (r) await refreshProviderStats(r.targetId);
  await db.insert(moderationActions).values({ adminId, action: hidden ? "hide_review" : "show_review", targetType: "review", targetId: reviewId });
}
