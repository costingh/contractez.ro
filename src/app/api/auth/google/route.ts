import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { loginErrorCode } from "@/lib/auth-errors";
import { startGoogleLogin } from "@/server/auth/google";
import { isDomainError } from "@/server/errors";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  let url: string;
  try {
    url = await startGoogleLogin({ next: sp.get("next"), rol: sp.get("rol"), ref: sp.get("ref") });
  } catch (err) {
    redirect(`/autentificare?eroare=${loginErrorCode(isDomainError(err) ? err.code : null, "google_off")}`);
  }
  redirect(url);
}
