import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "../db";
import { notificationPreferences, notifications, users } from "../db/schema";
import { env } from "../env";
import { renderEmail, type EmailBlock } from "../email/layout";
import { queueEmail } from "../email/send";

export type EmailKind = "messages" | "applications" | "matches" | "autobid" | "account" | "system";

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
  email?: { kind: EmailKind; subject: string; heading?: string; blocks: EmailBlock[]; cta?: string };
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

  const blocks = [...input.email.blocks];
  if (input.link) blocks.push({ type: "button", text: input.email.cta ?? "Vezi detalii", href: absoluteUrl(input.link) });
  await queueEmail({
    to: u.email,
    userId: input.userId,
    subject: input.email.subject,
    template: input.type,
    html: renderEmail({ heading: input.email.heading ?? input.title, preheader: input.body, blocks }),
    dedupeKey: input.dedupeKey ? `email:${input.dedupeKey}` : undefined,
  });
}

export function absoluteUrl(path: string) {
  return path.startsWith("http") ? path : `${env.APP_URL}${path}`;
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
