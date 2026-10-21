import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { env } from "../env";

const NO_STORE = { "cache-control": "no-store" };

export function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

/** Comparare în timp constant (pe digest, ca lungimea diferită să nu scurgă informații). */
export function tokensMatch(given: string, expected: string): boolean {
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/** `Authorization: Bearer <OUTREACH_TOKEN>`. Fără token configurat → 503; token lipsă/greșit → 401. */
export function checkOutreachAuth(req: Request): NextResponse | null {
  const expected = env.OUTREACH_TOKEN;
  if (!expected) return json({ error: "Outreach dezactivat: OUTREACH_TOKEN nu este configurat pe server." }, 503);
  const header = req.headers.get("authorization") ?? "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m || !tokensMatch(m[1].trim(), expected)) return json({ error: "Neautorizat" }, 401);
  return null;
}

const MAX_BODY = 1_000_000;

/** Citește și validează corpul JSON; întoarce fie datele, fie un răspuns 400/413. */
export async function readBody<S extends z.ZodType>(req: Request, schema: S): Promise<{ data: z.infer<S> } | { error: NextResponse }> {
  const raw = await req.text();
  if (raw.length > MAX_BODY) return { error: json({ error: "Cerere prea mare" }, 413) };
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return { error: json({ error: "JSON invalid" }, 400) };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { error: json({ error: "Date invalide", issues: parsed.error.issues.slice(0, 10).map((i) => ({ path: i.path.join("."), message: i.message })) }, 400) };
  }
  return { data: parsed.data };
}
