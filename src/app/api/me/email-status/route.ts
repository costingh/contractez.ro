import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

/** Dacă emailul utilizatorului curent este confirmat (verificat periodic de bannerele „Confirmă emailul”). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  return NextResponse.json({ verified: Boolean(user.emailVerifiedAt) }, { headers: { "cache-control": "no-store" } });
}
