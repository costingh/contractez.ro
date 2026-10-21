import { checkOutreachAuth, json, readBody } from "@/server/outreach/api";
import { ingestLeads, ingestSchema } from "@/server/outreach/service";

export const dynamic = "force-dynamic";

/** Extensia trimite postările/comentariile derulate de utilizator (docs/OUTREACH.md). */
export async function POST(req: Request) {
  const denied = checkOutreachAuth(req);
  if (denied) return denied;
  const body = await readBody(req, ingestSchema);
  if ("error" in body) return body.error;
  return json(await ingestLeads(body.data));
}
