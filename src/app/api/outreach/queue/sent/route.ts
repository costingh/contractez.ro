import { checkOutreachAuth, domainErrorResponse, json, readBody } from "@/server/outreach/api";
import { markLeadSent, queueLeadSchema } from "@/server/outreach/service";

export const dynamic = "force-dynamic";

/** Extensia a văzut în Messenger mesajul trimis de om pentru lead-ul deschis din coadă. */
export async function POST(req: Request) {
  const denied = checkOutreachAuth(req);
  if (denied) return denied;
  const body = await readBody(req, queueLeadSchema);
  if ("error" in body) return body.error;
  try {
    return json({ ok: true, ...(await markLeadSent(body.data.leadId)) });
  } catch (err) {
    return domainErrorResponse(err);
  }
}
