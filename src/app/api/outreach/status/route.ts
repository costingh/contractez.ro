import type { NextRequest } from "next/server";
import { checkOutreachAuth, json } from "@/server/outreach/api";
import { leadStatuses, statusIdsSchema } from "@/server/outreach/service";

export const dynamic = "force-dynamic";

/** `?ids=post:1,comment:2` (max 100) → statusul lead-urilor, pentru chip-urile extensiei. */
export async function GET(req: NextRequest) {
  const denied = checkOutreachAuth(req);
  if (denied) return denied;
  const raw = req.nextUrl.searchParams.getAll("ids").join(",");
  const ids = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const parsed = statusIdsSchema.safeParse(ids);
  if (!parsed.success) return json({ error: "Parametrul ids trebuie să conțină între 1 și 100 de id-uri." }, 400);
  return json(await leadStatuses(parsed.data));
}
