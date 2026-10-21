import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "../db";
import { notificationPreferences, notifications, users } from "../db/schema";
import { queueEmail } from "../email/send";
import { absoluteUrl, renderNotificationEmail, type EmailKind, type NotificationEmail } from "../email/templates";

export type { EmailKind, NotificationEmail };
export { absoluteUrl };

export async function getPreferences(userId: string) {
  const [p] = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
  return (
    p ?? {
      userId,
      matchFrequency: "instant" as const,
      messagesEmail: true,
      applicationUpdatesEmail: true,
      autoBidEmail: true,
      productEmail: false,
      minMatchScore: 60,
      updatedAt: new Date(),
    }
  );
}

function allowsEmail(prefs: Awaited<ReturnType<typeof getPreferences>>, kind: EmailKind) {
  switch (kind) {
    case "messages":
      return prefs.messagesEmail;
    case "applications":
      return prefs.applicationUpdatesEmail;
    case "matches":
      return prefs.matchFrequency === "instant";
    case "autobid":
      return prefs.autoBidEmail;
    default:
      return true;
  }
}

/**
 * Creează o notificare în aplicație și, dacă preferințele permit, un email.
 * `dedupeKey` previne notificările duble (ex: același job reluat de worker).
 */
export async function notify(input: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  data?: Record<string, unknown>;
  dedupeKey?: string;
  /** Conținutul emailului: vezi șabloanele din `src/server/email/templates.ts`. */
  email?: NotificationEmail;
}) {
  const [row] = await db
    .insert(notifications)
    .values({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
      data: input.data,
      dedupeKey: input.dedupeKey ?? null,
    })
    .onConflictDoNothing({ target: notifications.dedupeKey })
    .returning({ id: notifications.id });
  if (!row) return;

  if (!input.email) return;
  const prefs = await getPreferences(input.userId);
  if (!allowsEmail(prefs, input.email.kind)) return;
  const [u] = await db
    .select({ email: users.email, deletedAt: users.deletedAt, bannedAt: users.bannedAt })
    .from(users)
    .where(eq(users.id, input.userId))
    .limit(1);
  if (!u || u.deletedAt || u.bannedAt) return;

  const { subject, html, text } = renderNotificationEmail({ title: input.title, body: input.body, link: input.link, email: input.email });
  await queueEmail({
    to: u.email,
    userId: input.userId,
    subject,
    template: input.type,
    html,
    text,
    dedupeKey: input.dedupeKey ? `email:${input.dedupeKey}` : undefined,
  });
}

export async function unreadNotificationCount(userId: string) {
  const [r] = await db
    .select({ n: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return r?.n ?? 0;
}

export async function listNotifications(userId: string, limit = 50) {
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
}

export async function markAllRead(userId: string) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}
