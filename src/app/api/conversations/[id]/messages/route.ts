import { NextResponse, type NextRequest } from "next/server";
import { serializeMessage } from "@/components/chat/types";
import { getCurrentUser } from "@/server/auth/session";
import { listMessages, markConversationRead } from "@/server/chat/service";
import { isDomainError } from "@/server/errors";

export const dynamic = "force-dynamic";

/** Polling pentru mesaje noi: GET ?after=ISO. Doar participanții conversației au acces. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  const { id } = await ctx.params;
  const afterRaw = req.nextUrl.searchParams.get("after");
  const after = afterRaw ? new Date(afterRaw) : undefined;
  if (after && Number.isNaN(after.getTime())) return NextResponse.json({ error: "Parametru invalid" }, { status: 400 });
  try {
    const { messages } = await listMessages(id, user.id, after);
    if (messages.some((m) => m.senderId !== user.id)) await markConversationRead(id, user.id);
    return NextResponse.json({ messages: messages.map(serializeMessage) }, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    if (isDomainError(err)) return NextResponse.json({ error: err.message }, { status: 404 });
    throw err;
  }
}
