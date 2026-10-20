import type { ConversationListItem } from "@/components/chat/types";
import { listConversations } from "@/server/chat/service";

export async function conversationItems(userId: string): Promise<ConversationListItem[]> {
  const rows = await listConversations(userId);
  return rows.map((r) => ({
    id: r.conversation.id,
    projectTitle: r.projectTitle,
    otherName: r.otherName,
    otherAvatar: r.otherAvatar,
    preview: r.conversation.lastMessagePreview,
    lastMessageAt: r.conversation.lastMessageAt?.toISOString() ?? null,
    unread: Boolean(r.unread),
    status: r.applicationStatus,
  }));
}
