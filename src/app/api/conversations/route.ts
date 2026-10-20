import { NextResponse } from "next/server";
import { conversationItems } from "@/app/mesaje/data";
import { getCurrentUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

/** Lista de conversații, pentru actualizarea live a inbox-ului. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  return NextResponse.json({ items: await conversationItems(user.id) }, { headers: { "cache-control": "no-store" } });
}
