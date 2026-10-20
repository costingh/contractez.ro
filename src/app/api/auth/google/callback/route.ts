import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { finishGoogleLogin } from "@/server/auth/google";
import { createSession } from "@/server/auth/session";
import { isDomainError } from "@/server/errors";
import { rateLimit } from "@/server/rate-limit";
import { clientIp } from "@/server/request";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const fail = (msg: string) => redirect(`/autentificare?eroare=${encodeURIComponent(msg)}`);
  if (sp.get("error")) fail(sp.get("error") === "access_denied" ? "Ai anulat autentificarea cu Google." : "Google a refuzat autentificarea.");
  const code = sp.get("code");
  const state = sp.get("state");
  if (!code || !state) fail("Răspuns incomplet de la Google.");
  if (!(await rateLimit(`google:${await clientIp()}`, 20, 300))) fail("Prea multe încercări. Așteaptă câteva minute.");

  let next = "/panou";
  try {
    const res = await finishGoogleLogin(code!, state!);
    await createSession(res.user.id);
    next = res.next;
  } catch (err) {
    console.error("[google] callback", (err as Error).message);
    fail(isDomainError(err) ? err.message : "Autentificarea cu Google a eșuat. Încearcă din nou.");
  }
  redirect(next);
}
