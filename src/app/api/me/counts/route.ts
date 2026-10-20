import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { getPlanUsage } from "@/server/billing/plans";
import { unreadConversationCount } from "@/server/chat/service";
import { unreadNotificationCount } from "@/server/notifications";

export const dynamic = "force-dynamic";

/** Contoarele din antet (actualizate periodic de client). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  const [notifications, messages, usage] = await Promise.all([
    unreadNotificationCount(user.id),
    unreadConversationCount(user.id),
    user.isProvider ? getPlanUsage(user.id) : null,
  ]);
  return NextResponse.json({ notifications, messages, applicationsLeft: usage?.remaining ?? null }, { headers: { "cache-control": "no-store" } });
}
