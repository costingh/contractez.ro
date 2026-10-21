import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { cleanVisitorId, linkVisitor } from "@/server/visitrack";

export const dynamic = "force-dynamic";

/** Browserul trimite id-ul de vizitator VisitTrack al utilizatorului logat (vezi VisitrackIdentify). */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { visitorId?: unknown } | null;
  const visitorId = cleanVisitorId(body?.visitorId);
  if (!visitorId) return NextResponse.json({ error: "visitorId invalid" }, { status: 400 });
  await linkVisitor(user.id, visitorId, user.vtVisitorId);
  return NextResponse.json({ ok: true });
}
