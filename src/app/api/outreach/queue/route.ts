import type { NextRequest } from "next/server";
import { checkOutreachAuth, json } from "@/server/outreach/api";
import { queueFilterSchema, queueNext } from "@/server/outreach/service";

export const dynamic = "force-dynamic";

/** `?type=client|provider&minScore=0..100` → următorul lead din coadă (sau null la limită / coadă goală). */
export async function GET(req: NextRequest) {
  const denied = checkOutreachAuth(req);
  if (denied) return denied;
  const sp = req.nextUrl.searchParams;
  const parsed = queueFilterSchema.safeParse({ type: sp.get("type") || null, minScore: sp.get("minScore") ?? undefined });
  if (!parsed.success) return json({ error: "Filtre invalide." }, 400);
  return json(await queueNext(parsed.data));
}
