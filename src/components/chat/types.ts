import type { Message } from "@/server/db/schema";

export type ChatMessage = {
  id: string;
  senderId: string | null;
  body: string;
  isSystem: boolean;
  attachmentPath: string | null;
  attachmentName: string | null;
  attachmentType: string | null;
  attachmentSize: number | null;
  createdAt: string;
};

export function serializeMessage(m: Message): ChatMessage {
  return {
    id: m.id,
    senderId: m.senderId,
    body: m.body,
    isSystem: m.isSystem,
    attachmentPath: m.attachmentPath,
    attachmentName: m.attachmentName,
    attachmentType: m.attachmentType,
    attachmentSize: m.attachmentSize,
    createdAt: m.createdAt.toISOString(),
  };
}

export type ConversationListItem = {
  id: string;
  projectTitle: string;
  otherName: string;
  otherAvatar: string | null;
  preview: string | null;
  lastMessageAt: string | null;
  unread: boolean;
  status: string;
};
