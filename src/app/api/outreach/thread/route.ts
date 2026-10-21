import { checkOutreachAuth, json, readBody } from "@/server/outreach/api";
import { threadOpened, threadSchema } from "@/server/outreach/service";

export const dynamic = "force-dynamic";

/** Utilizatorul a deschis o conversație Messenger: marcăm persoanele cu istoric ca deja contactate. */
export async function POST(req: Request) {
  const denied = checkOutreachAuth(req);
  if (denied) return denied;
  const body = await readBody(req, threadSchema);
  if ("error" in body) return body.error;
  return json(await threadOpened(body.data));
}
