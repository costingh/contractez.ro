import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { track } from "../analytics";
import { db } from "../db";
import { notificationPreferences, users, type User } from "../db/schema";
import { adminEmails, env, features } from "../env";
import { DomainError } from "../errors";
import { randomToken } from "./crypto";

/*
 * „Continuă cu Google” — OAuth 2.0 Authorization Code + PKCE (OpenID Connect).
 * - state, nonce și code_verifier stau într-un cookie httpOnly semnat (HMAC cu APP_SECRET), valabil 10 minute;
 * - id_token-ul vine direct de la Google prin canalul server-to-server (TLS), deci validăm claim-urile
 *   (iss, aud, exp, nonce, email_verified) conform OIDC Core §3.1.3.7;
 * - conturile existente cu același email (verificat de Google) sunt legate automat.
 */

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const COOKIE = "g_oauth";

export const OAUTH_PASSWORD_MARKER = "oauth";

type Pending = { state: string; nonce: string; verifier: string; next: string | null; rol: string | null; ref: string | null; exp: number };

function redirectUri() {
  return `${env.APP_URL}/api/auth/google/callback`;
}

function sign(payload: string) {
  return createHmac("sha256", env.APP_SECRET).update(payload).digest("base64url");
}

function safeNext(next: string | null | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export async function startGoogleLogin(opts: { next?: string | null; rol?: string | null; ref?: string | null }) {
  if (!features.google) throw new DomainError("google_off", "Autentificarea cu Google nu este configurată.");
  const pending: Pending = {
    state: randomToken(16),
    nonce: randomToken(16),
    verifier: randomToken(48),
    next: safeNext(opts.next),
    rol: opts.rol === "prestator" || opts.rol === "client" ? opts.rol : null,
    ref: opts.ref?.slice(0, 40) ?? null,
    exp: Date.now() + 10 * 60_000,
  };
  const body = Buffer.from(JSON.stringify(pending)).toString("base64url");
  (await cookies()).set(COOKIE, `${body}.${sign(body)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.APP_URL.startsWith("https://"),
    path: "/api/auth/google",
    maxAge: 600,
  });
  const challenge = createHash("sha256").update(pending.verifier).digest("base64url");
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state: pending.state,
    nonce: pending.nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return `${AUTH_URL}?${params.toString()}`;
}

async function readPending(): Promise<Pending> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  jar.delete({ name: COOKIE, path: "/api/auth/google" });
  if (!raw) throw new DomainError("google_state", "Sesiunea de autentificare a expirat. Încearcă din nou.");
  const [body, sig] = raw.split(".");
  const expected = sign(body ?? "");
  if (!sig || sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    throw new DomainError("google_state", "Cerere de autentificare invalidă.");
  }
  const pending = JSON.parse(Buffer.from(body, "base64url").toString()) as Pending;
  if (pending.exp < Date.now()) throw new DomainError("google_state", "Sesiunea de autentificare a expirat. Încearcă din nou.");
  return pending;
}

type IdTokenClaims = { iss: string; aud: string; exp: number; nonce?: string; sub: string; email?: string; email_verified?: boolean; name?: string; given_name?: string };

export async function finishGoogleLogin(code: string, state: string): Promise<{ user: User; next: string; isNew: boolean }> {
  const pending = await readPending();
  if (state !== pending.state) throw new DomainError("google_state", "Cerere de autentificare invalidă.");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID!,
      client_secret: env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
      code_verifier: pending.verifier,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    console.error("[google] token exchange", res.status, await res.text().catch(() => ""));
    throw new DomainError("google_token", "Google nu a confirmat autentificarea. Încearcă din nou.");
  }
  const tokens = (await res.json()) as { id_token?: string };
  if (!tokens.id_token) throw new DomainError("google_token", "Răspuns invalid de la Google.");
  const claims = JSON.parse(Buffer.from(tokens.id_token.split(".")[1] ?? "", "base64url").toString()) as IdTokenClaims;

  if (!["accounts.google.com", "https://accounts.google.com"].includes(claims.iss)) throw new DomainError("google_claims", "Emitent invalid.");
  if (claims.aud !== env.GOOGLE_CLIENT_ID) throw new DomainError("google_claims", "Token destinat altei aplicații.");
  if (claims.exp * 1000 < Date.now()) throw new DomainError("google_claims", "Token expirat.");
  if (claims.nonce !== pending.nonce) throw new DomainError("google_claims", "Cerere de autentificare invalidă.");
  if (!claims.email || !claims.email_verified) {
    throw new DomainError("google_email", "Adresa de email Google nu este verificată. Folosește înregistrarea cu email și parolă.");
  }

  const email = claims.email.toLowerCase();
  const { user, isNew } = await upsertGoogleUser({ sub: claims.sub, email, name: claims.name ?? claims.given_name ?? email.split("@")[0], ref: pending.ref });
  if (user.bannedAt) throw new DomainError("banned", "Contul este suspendat. Contactează-ne dacă e o greșeală.");
  if (user.deletedAt) throw new DomainError("deleted", "Contul a fost șters.");

  const next = pending.next ?? (user.onboardedAt ? "/panou" : `/onboarding${pending.rol ? `?rol=${pending.rol}` : ""}`);
  return { user, next, isNew };
}

async function upsertGoogleUser(p: { sub: string; email: string; name: string; ref: string | null }) {
  const [byGoogle] = await db.select().from(users).where(eq(users.googleId, p.sub));
  if (byGoogle) {
    await db.update(users).set({ lastSeenAt: new Date() }).where(eq(users.id, byGoogle.id));
    return { user: byGoogle, isNew: false };
  }
  // Emailul este verificat de Google → putem lega în siguranță contul existent.
  const [byEmail] = await db.select().from(users).where(sql`lower(${users.email}) = ${p.email}`);
  if (byEmail) {
    const [linked] = await db
      .update(users)
      .set({ googleId: p.sub, emailVerifiedAt: byEmail.emailVerifiedAt ?? new Date(), lastSeenAt: new Date() })
      .where(eq(users.id, byEmail.id))
      .returning();
    await track("user.google_linked", byEmail.id);
    return { user: linked, isNew: false };
  }
  let referredById: string | null = null;
  if (p.ref) {
    const [r] = await db.select({ id: users.id }).from(users).where(eq(users.referralCode, p.ref));
    referredById = r?.id ?? null;
  }
  const [created] = await db
    .insert(users)
    .values({
      email: p.email,
      name: p.name.slice(0, 80),
      passwordHash: OAUTH_PASSWORD_MARKER,
      googleId: p.sub,
      emailVerifiedAt: new Date(),
      role: adminEmails.has(p.email) ? "admin" : "user",
      referralCode: randomToken(6).replace(/[-_]/g, "x").slice(0, 8).toLowerCase(),
      referredById,
      lastSeenAt: new Date(),
    })
    .returning();
  await db.insert(notificationPreferences).values({ userId: created.id }).onConflictDoNothing();
  await track("user.signed_up", created.id, { method: "google", referred: Boolean(referredById) });
  return { user: created, isNew: true };
}
