import { checkOutreachAuth, domainErrorResponse, json, readBody } from "@/server/outreach/api";
import { queueLeadSchema, setLeadStatus } from "@/server/outreach/service";

export const dynamic = "force-dynamic";

/** „Sari” din bannerul extensiei, în tab-ul Messenger al cozii. */
export async function POST(req: Request) {
  const denied = checkOutreachAuth(req);
  if (denied) return denied;
  const body = await readBody(req, queueLeadSchema);
  if ("error" in body) return body.error;
  try {
    await setLeadStatus(body.data.leadId, "skipped");
    return json({ ok: true });
  } catch (err) {
    return domainErrorResponse(err);
  }
}
