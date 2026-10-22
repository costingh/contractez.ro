import { and, asc, desc, eq, gt, or, sql } from "drizzle-orm";
import { isUuid } from "@/lib/ids";
import { truncate } from "@/lib/text";
import { db } from "../db";
import { applications, conversations, messages, projects, users, type Conversation } from "../db/schema";
import { DomainError } from "../errors";
import { notify } from "../notifications";
import { messageNewTemplate } from "../email/templates";
import { rateLimit } from "../rate-limit";
import { deleteUpload } from "../uploads";

export async function getConversationFor(conversationId: string, userId: string) {
  if (!isUuid(conversationId)) throw new DomainError("not_found", "Conversația nu există.");
  const [c] = await db.select().from(conversations).where(eq(conversations.id, conversationId));
  if (!c || (c.clientId !== userId && c.providerId !== userId)) throw new DomainError("not_found", "Conversația nu există.");
  return c;
}

export function roleIn(c: Conversation, userId: string): "client" | "provider" {
  return c.clientId === userId ? "client" : "provider";
}

export async function listConversations(userId: string) {
  const other = sql<string>`CASE WHEN ${conversations.clientId} = ${userId} THEN ${conversations.providerId} ELSE ${conversations.clientId} END`;
  return db
    .select({
      conversation: conversations,
      projectTitle: projects.title,
      applicationStatus: applications.status,
      otherName: sql<string>`(SELECT name FROM users WHERE id = ${other})`,
      otherAvatar: sql<string | null>`(SELECT avatar_path FROM users WHERE id = ${other})`,
      unread: sql<boolean>`CASE WHEN ${conversations.clientId} = ${userId}
        THEN ${conversations.lastMessageAt} > coalesce(${conversations.clientLastReadAt}, 'epoch')
        ELSE ${conversations.lastMessageAt} > coalesce(${conversations.providerLastReadAt}, 'epoch') END`,
    })
    .from(conversations)
    .innerJoin(projects, eq(projects.id, conversations.projectId))
    .innerJoin(applications, eq(applications.id, conversations.applicationId))
    .where(or(eq(conversations.clientId, userId), eq(conversations.providerId, userId)))
    .orderBy(desc(conversations.lastMessageAt))
    .limit(200);
}

export async function unreadConversationCount(userId: string) {
  const [r] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(conversations)
    .where(
      or(
        and(eq(conversations.clientId, userId), sql`${conversations.lastMessageAt} > coalesce(${conversations.clientLastReadAt}, 'epoch')`),
        and(eq(conversations.providerId, userId), sql`${conversations.lastMessageAt} > coalesce(${conversations.providerLastReadAt}, 'epoch')`),
      ),
    );
  return r?.n ?? 0;
}

export async function listMessages(conversationId: string, userId: string, after?: Date) {
  const c = await getConversationFor(conversationId, userId);
  const rows = await db
    .select()
    .from(messages)
    .where(and(eq(messages.conversationId, c.id), after ? gt(messages.createdAt, after) : undefined))
    .orderBy(asc(messages.createdAt))
    .limit(after ? 100 : 500);
  return { conversation: c, messages: rows };
}

export async function markConversationRead(conversationId: string, userId: string) {
  const c = await getConversationFor(conversationId, userId);
  await db
    .update(conversations)
    .set(roleIn(c, userId) === "client" ? { clientLastReadAt: new Date() } : { providerLastReadAt: new Date() })
    .where(eq(conversations.id, c.id));
}

export type MessageAttachment = { path: string; name: string; size: number; type: string };

/**
 * Trimite un mesaj. Atașamentul poate fi o funcție care salvează fișierul: o apelăm abia după toate
 * verificările (limită de mesaje, conversație închisă, cont suspendat), ca un mesaj refuzat să nu lase fișiere orfane.
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  body: string,
  attachmentInput?: MessageAttachment | (() => Promise<MessageAttachment>),
) {
  const text = body.trim();
  if (!text && !attachmentInput) throw new DomainError("empty", "Mesajul este gol.");
  if (text.length > 5_000) throw new DomainError("long", "Mesajul este prea lung.");
  if (!(await rateLimit(`msg:${senderId}`, 30, 60))) throw new DomainError("rate", "Trimiți mesaje prea repede. Încearcă din nou în câteva secunde.");
  const c = await getConversationFor(conversationId, senderId);
  const [app] = await db.select({ status: applications.status }).from(applications).where(eq(applications.id, c.applicationId));
  if (app?.status === "withdrawn") throw new DomainError("closed", "Aplicarea a fost retrasă; conversația este închisă.");
  const [sender] = await db.select({ name: users.name, bannedAt: users.bannedAt }).from(users).where(eq(users.id, senderId));
  if (sender?.bannedAt) throw new DomainError("banned", "Contul este suspendat.");

  const attachment = typeof attachmentInput === "function" ? await attachmentInput() : attachmentInput;
  const now = new Date();
  let msg: typeof messages.$inferSelect;
  try {
    [msg] = await db
      .insert(messages)
      .values({
        conversationId: c.id,
        senderId,
        body: text,
        attachmentPath: attachment?.path,
        attachmentName: attachment?.name,
        attachmentSize: attachment?.size,
        attachmentType: attachment?.type,
      })
      .returning();
  } catch (err) {
    if (typeof attachmentInput === "function") await deleteUpload(attachment?.path);
    throw err;
  }
  const role = roleIn(c, senderId);
  await db
    .update(conversations)
    .set({
      lastMessageAt: now,
      lastMessagePreview: truncate(text || `📎 ${attachment?.name}`, 140),
      ...(role === "client" ? { clientLastReadAt: now } : { providerLastReadAt: now }),
    })
    .where(eq(conversations.id, c.id));

  // Clientul a deschis conversația → oferta devine „citită”.
  if (role === "client") {
    await db
      .update(applications)
      .set({ status: "viewed", viewedAt: now })
      .where(and(eq(applications.id, c.applicationId), eq(applications.status, "submitted")));
  }

  const recipient = role === "client" ? c.providerId : c.clientId;
  // O notificare (și un email) per conversație la cel mult 15 minute, ca să nu inundăm inbox-ul.
  const window = Math.floor(now.getTime() / (15 * 60_000));
  await notify({
    userId: recipient,
    type: "message.new",
    title: `Mesaj nou de la ${sender?.name ?? "un utilizator"}`,
    body: truncate(text || `📎 ${attachment?.name}`, 120),
    link: `/mesaje/${c.id}`,
    dedupeKey: `msg:${c.id}:${recipient}:${window}`,
    email: messageNewTemplate({ senderName: sender?.name ?? "un utilizator", text: truncate(text || `Atașament: ${attachment?.name}`, 400) }),
  });
  return msg;
}

/** Mesaj de sistem (ex: „Clientul a ales această ofertă”). */
export async function systemMessage(conversationId: string, body: string) {
  await db.insert(messages).values({ conversationId, senderId: null, body, isSystem: true });
  await db.update(conversations).set({ lastMessageAt: new Date(), lastMessagePreview: truncate(body, 140) }).where(eq(conversations.id, conversationId));
}
