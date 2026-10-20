"use server";

import { revalidatePath } from "next/cache";
import { serializeMessage, type ChatMessage } from "@/components/chat/types";
import { toActionError, type ActionState } from "@/lib/action";
import { requireUser } from "@/server/auth/guards";
import { getConversationFor, sendMessage } from "@/server/chat/service";
import { DomainError } from "@/server/errors";
import { createReport } from "@/server/trust/service";
import { saveUpload } from "@/server/uploads";

export async function sendMessageAction(conversationId: string, fd: FormData): Promise<ActionState<ChatMessage>> {
  try {
    const user = await requireUser();
    await getConversationFor(conversationId, user.id);
    const body = String(fd.get("body") ?? "");
    const file = fd.get("file");
    let attachment: { path: string; name: string; size: number; type: string } | undefined;
    if (file instanceof File && file.size > 0) {
      const saved = await saveUpload(file, `chat/${conversationId}`, "document");
      attachment = { path: saved.path, name: saved.name, size: saved.size, type: saved.type };
    }
    const msg = await sendMessage(conversationId, user.id, body, attachment);
    revalidatePath("/mesaje");
    return { ok: true, data: serializeMessage(msg) };
  } catch (err) {
    return toActionError(err);
  }
}

export async function reportConversationAction(conversationId: string, reason: string, details: string): Promise<ActionState> {
  try {
    const user = await requireUser();
    const c = await getConversationFor(conversationId, user.id);
    const other = c.clientId === user.id ? c.providerId : c.clientId;
    if (!reason) throw new DomainError("reason", "Alege motivul raportării.");
    await createReport(user.id, {
      targetType: "user",
      targetId: other,
      reason,
      details: `Conversația ${conversationId}${details ? `: ${details}` : ""}`.slice(0, 2_000),
    });
    return { ok: true, message: "Mulțumim! Echipa de moderare va verifica raportarea." };
  } catch (err) {
    return toActionError(err);
  }
}
