import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

// Cookie jar în memorie în locul `next/headers`.
const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => void jar.set(name, value),
    delete: (opts: string | { name: string }) => void jar.delete(typeof opts === "string" ? opts : opts.name),
  }),
  headers: async () => new Headers(),
}));

process.env.GOOGLE_CLIENT_ID = "test-client.apps.googleusercontent.com";
process.env.GOOGLE_CLIENT_SECRET = "test-secret";

let google: typeof import("@/server/auth/google");
let db: typeof import("@/server/db").db;
let users: typeof import("@/server/db/schema").users;

beforeAll(async () => {
  google = await import("@/server/auth/google");
  ({ db } = await import("@/server/db"));
  ({ users } = await import("@/server/db/schema"));
});

afterEach(() => {
  vi.unstubAllGlobals();
  jar.clear();
});

function idToken(claims: Record<string, unknown>) {
  const enc = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${enc({ alg: "RS256" })}.${enc(claims)}.sig`;
}

/** Pornește fluxul și întoarce state + nonce din URL-ul către Google. */
async function start(opts: { next?: string; rol?: string } = {}) {
  const url = new URL(await google.startGoogleLogin(opts));
  return { state: url.searchParams.get("state")!, nonce: url.searchParams.get("nonce")!, url };
}

function mockGoogle(claims: Record<string, unknown>) {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ id_token: idToken(claims) }), { status: 200 })));
}

const base = (nonce: string, email: string, sub = randomUUID()) => ({
  iss: "https://accounts.google.com",
  aud: "test-client.apps.googleusercontent.com",
  exp: Math.floor(Date.now() / 1000) + 600,
  nonce,
  sub,
  email,
  email_verified: true,
  name: "Ana Google",
});

describe("autentificare cu Google", () => {
  it("URL-ul folosește PKCE S256, state și nonce", async () => {
    const { url } = await start();
    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("scope")).toBe("openid email profile");
    expect(url.searchParams.get("redirect_uri")).toMatch(/\/api\/auth\/google\/callback$/);
  });

  it("creează un cont nou, cu email confirmat, și trimite la onboarding", async () => {
    const email = `g-${randomUUID()}@gmail.com`;
    const { state, nonce } = await start({ rol: "prestator" });
    mockGoogle(base(nonce, email));
    const res = await google.finishGoogleLogin("code", state);
    expect(res.isNew).toBe(true);
    expect(res.next).toBe("/onboarding?rol=prestator");
    expect(res.user.emailVerifiedAt).not.toBeNull();
    expect(res.user.passwordHash).toBe("oauth");
  });

  it("leagă contul existent cu email confirmat și păstrează parola", async () => {
    const email = `existing-${randomUUID()}@gmail.com`;
    const [u] = await db.insert(users).values({ email, name: "Existent", passwordHash: "scrypt$x$y", emailVerifiedAt: new Date() }).returning();
    const { state, nonce } = await start({ next: "/proiecte/nou" });
    const sub = randomUUID();
    mockGoogle(base(nonce, email.toUpperCase(), sub));
    const res = await google.finishGoogleLogin("code", state);
    expect(res.isNew).toBe(false);
    expect(res.user.id).toBe(u.id);
    expect(res.next).toBe("/proiecte/nou");
    const [after] = await db.select().from(users).where(eq(users.id, u.id));
    expect(after.googleId).toBe(sub);
    expect(after.passwordHash).toBe("scrypt$x$y");
    expect(after.emailVerifiedAt).not.toBeNull();
  });

  it("la un cont cu email neconfirmat anulează parola (pre-înregistrare de către altcineva)", async () => {
    const email = `unverified-${randomUUID()}@gmail.com`;
    const [u] = await db.insert(users).values({ email, name: "Neconfirmat", passwordHash: "scrypt$atacator$y" }).returning();
    const { state, nonce } = await start();
    mockGoogle(base(nonce, email, randomUUID()));
    const res = await google.finishGoogleLogin("code", state);
    expect(res.user.id).toBe(u.id);
    const [after] = await db.select().from(users).where(eq(users.id, u.id));
    expect(after.passwordHash).not.toBe("scrypt$atacator$y");
    expect(after.emailVerifiedAt).not.toBeNull();
  });

  it("respinge state greșit, nonce greșit, alt client sau email neverificat", async () => {
    let s = await start();
    mockGoogle(base(s.nonce, "x@gmail.com"));
    await expect(google.finishGoogleLogin("code", "alt-state")).rejects.toMatchObject({ code: "google_state" });

    s = await start();
    mockGoogle(base("nonce-falsificat", "x@gmail.com"));
    await expect(google.finishGoogleLogin("code", s.state)).rejects.toMatchObject({ code: "google_claims" });

    s = await start();
    mockGoogle({ ...base(s.nonce, "x@gmail.com"), aud: "alta-aplicatie" });
    await expect(google.finishGoogleLogin("code", s.state)).rejects.toMatchObject({ code: "google_claims" });

    s = await start();
    mockGoogle({ ...base(s.nonce, "x@gmail.com"), email_verified: false });
    await expect(google.finishGoogleLogin("code", s.state)).rejects.toMatchObject({ code: "google_email" });
  });

  it("cookie-ul de stare nu poate fi refolosit sau falsificat", async () => {
    const { state, nonce } = await start();
    const cookie = jar.get("g_oauth")!;
    mockGoogle(base(nonce, `r-${randomUUID()}@gmail.com`));
    await google.finishGoogleLogin("code", state);
    await expect(google.finishGoogleLogin("code", state)).rejects.toMatchObject({ code: "google_state" }); // consumat

    jar.set("g_oauth", cookie.replace(/\.[^.]+$/, ".semnatura-falsa"));
    await expect(google.finishGoogleLogin("code", state)).rejects.toMatchObject({ code: "google_state" });
  });

  it("un cont suspendat nu se poate autentifica prin Google", async () => {
    const email = `ban-${randomUUID()}@gmail.com`;
    await db.insert(users).values({ email, name: "Ban", passwordHash: "oauth", bannedAt: new Date() });
    const { state, nonce } = await start();
    mockGoogle(base(nonce, email));
    await expect(google.finishGoogleLogin("code", state)).rejects.toMatchObject({ code: "banned" });
  });
});
