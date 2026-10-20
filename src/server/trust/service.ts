import { and, desc, eq, or, sql } from "drizzle-orm";
import { z } from "zod";
import { truncate } from "@/lib/text";
import { track } from "../analytics";
import { db } from "../db";
import {
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
  await db.update(collaborations).set({ status: "completed", completedAt: new Date(), confirmedAt: c.confirmedAt ?? new Date() }).where(eq(collaborations.id, id));
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
    email: { kind: "system", subject: "Cum a fost colaborarea?", cta: "Lasă o recenzie", blocks: [{ type: "p", text: "Recenziile verificate ajută comunitatea să aleagă mai ușor." }] },
  });
  await track("collaboration.completed", userId, { collaborationId: id });
}

export async function cancelCollaboration(id: string, userId: string) {
  const c = await loadCollab(id, userId);
  if (c.status === "completed") throw new DomainError("state", "Colaborarea este deja finalizată.");
  await db.update(collaborations).set({ status: "cancelled" }).where(eq(collaborations.id, id));
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
  if (!["active", "completed"].includes(c.status)) throw new DomainError("state", "Poți lăsa recenzie după ce colaborarea este confirmată.");
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

export async function createReport(reporterId: string, raw: unknown) {
  const input = reportSchema.parse(raw);
  const [dup] = await db
    .select({ id: reports.id })
    .from(reports)
    .where(and(eq(reports.reporterId, reporterId), eq(reports.targetType, input.targetType), eq(reports.targetId, input.targetId), eq(reports.status, "open")));
  if (dup) return dup.id;
  const [r] = await db.insert(reports).values({ reporterId, ...input }).returning({ id: reports.id });
  // Spam raportat pe o aplicare automată → o punem în moderare (marcăm proiectul pentru verificare).
  const [{ n }] = await db
    .select({ n: sql<number>`count(DISTINCT ${reports.reporterId})::int` })
    .from(reports)
    .where(and(eq(reports.targetType, input.targetType), eq(reports.targetId, input.targetId), eq(reports.status, "open")));
  if (input.targetType === "project" && n >= 3) {
    await db.update(projects).set({ status: "pending_review", moderationNote: "Raportat de mai mulți utilizatori" }).where(and(eq(projects.id, input.targetId), eq(projects.status, "open")));
  }
  return r.id;
}

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
