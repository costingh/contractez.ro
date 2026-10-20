import { NextResponse } from "next/server";
import { exportAccountData } from "@/server/account";
import { getCurrentUser } from "@/server/auth/session";
import { rateLimit } from "@/server/rate-limit";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  if (!(await rateLimit(`export:${user.id}`, 5, 3600))) return NextResponse.json({ error: "Prea multe cereri" }, { status: 429 });
  const data = await exportAccountData(user.id);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="datele-mele-${new Date().toISOString().slice(0, 10)}.json"`,
      "cache-control": "no-store",
    },
  });
}
