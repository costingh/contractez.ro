import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { loginErrorCode, type LoginErrorCode } from "@/lib/auth-errors";
import { finishGoogleLogin } from "@/server/auth/google";
import { createSession } from "@/server/auth/session";
import { isDomainError } from "@/server/errors";
import { rateLimit } from "@/server/rate-limit";
import { clientIp } from "@/server/request";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  // Doar coduri în URL; textul îl alege pagina de login (src/lib/auth-errors.ts).
  const fail = (code: LoginErrorCode) => redirect(`/autentificare?eroare=${code}`);
  if (sp.get("error")) fail(sp.get("error") === "access_denied" ? "google_cancelled" : "google_denied");
  const code = sp.get("code");
  const state = sp.get("state");
  if (!code || !state) fail("google_incomplete");
  if (!(await rateLimit(`google:${await clientIp()}`, 20, 300))) fail("rate_limited");

  let next = "/panou";
  try {
    const res = await finishGoogleLogin(code!, state!);
    await createSession(res.user.id);
    next = res.next;
  } catch (err) {
    console.error("[google] callback", (err as Error).message);
    fail(loginErrorCode(isDomainError(err) ? err.code : null));
  }
  redirect(next);
}
