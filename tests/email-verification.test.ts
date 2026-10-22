import { and, desc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { sendVerificationEmail, verifyEmailToken } from "@/server/auth/service";
import { db } from "@/server/db";
import { emailLog, notifications, users, verificationTokens } from "@/server/db/schema";
import { createTestUser } from "./helpers";

/** Tokenul din ultimul email de confirmare trimis utilizatorului (ca în E2E: citit din email_log). */
async function latestToken(userId: string) {
  const [row] = await db
    .select({ text: emailLog.text })
    .from(emailLog)
    .where(and(eq(emailLog.userId, userId), eq(emailLog.template, "verify-email")))
    .orderBy(desc(emailLog.createdAt))
    .limit(1);
  const token = row?.text?.match(/verifica-email\?token=([\w-]+)/)?.[1];
  if (!token) throw new Error("emailul de confirmare nu conține linkul");
  return token;
}

async function unverifiedUser(overrides: Parameters<typeof createTestUser>[0] = {}) {
  return createTestUser({ emailVerifiedAt: null, onboardedAt: null, ...overrides });
}

async function isVerified(userId: string) {
  const [u] = await db.select({ at: users.emailVerifiedAt }).from(users).where(eq(users.id, userId));
  return Boolean(u?.at);
}

describe("confirmarea emailului", () => {
  it("confirmă contul, iar a doua deschidere a aceluiași link (ex. după un scanner de linkuri) arată tot succes", async () => {
    const u = await unverifiedUser();
    await sendVerificationEmail(u.id);
    const token = await latestToken(u.id);

    // Primul GET: scannerul de securitate al emailului (Outlook Safe Links, Gmail etc.).
    expect(await verifyEmailToken(token)).toEqual({ status: "verified", userId: u.id });
    expect(await isVerified(u.id)).toBe(true);
    // Clicul omului, imediat după: nu mai e „link invalid”.
    expect(await verifyEmailToken(token)).toEqual({ status: "already", userId: u.id });
  });

  it("„Retrimite” nu invalidează linkul din emailul trimis deja", async () => {
    const u = await unverifiedUser();
    await sendVerificationEmail(u.id);
    const first = await latestToken(u.id);
    await sendVerificationEmail(u.id); // ex. butonul de pe pasul 3 din onboarding
    const second = await latestToken(u.id);
    expect(second).not.toBe(first);

    expect((await verifyEmailToken(first)).status).toBe("verified");
    expect((await verifyEmailToken(second)).status).toBe("already");
  });

  it("două deschideri simultane: ambele văd succes, bonusul de bun venit se acordă o singură dată", async () => {
    const u = await unverifiedUser({ isProvider: true });
    await sendVerificationEmail(u.id);
    const token = await latestToken(u.id);
    const results = await Promise.all([verifyEmailToken(token), verifyEmailToken(token)]);
    expect(results.map((r) => r.status).sort()).toEqual(["already", "verified"]);
    const welcome = await db.select().from(notifications).where(and(eq(notifications.userId, u.id), eq(notifications.type, "plan.welcome")));
    expect(welcome).toHaveLength(1);
  });

  it("un link expirat nu confirmă contul, dar dacă contul e deja confirmat arată succes", async () => {
    const u = await unverifiedUser();
    await sendVerificationEmail(u.id);
    const token = await latestToken(u.id);
    await db.update(verificationTokens).set({ expiresAt: new Date(Date.now() - 60_000) }).where(eq(verificationTokens.userId, u.id));

    expect(await verifyEmailToken(token)).toEqual({ status: "expired", userId: u.id });
    expect(await isVerified(u.id)).toBe(false);

    await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, u.id));
    expect(await verifyEmailToken(token)).toEqual({ status: "already", userId: u.id });
  });

  it("respinge linkurile necunoscute și pe cele trimise la altă adresă", async () => {
    expect(await verifyEmailToken("nu-exista")).toEqual({ status: "invalid", userId: null });
    expect(await verifyEmailToken("")).toEqual({ status: "invalid", userId: null });

    const u = await unverifiedUser();
    await sendVerificationEmail(u.id);
    const token = await latestToken(u.id);
    await db.update(users).set({ email: `altul-${u.email}` }).where(eq(users.id, u.id));
    expect(await verifyEmailToken(token)).toEqual({ status: "invalid", userId: u.id });
    expect(await isVerified(u.id)).toBe(false);
  });

  it("nu trimite emailuri de confirmare conturilor deja confirmate", async () => {
    const u = await createTestUser();
    await sendVerificationEmail(u.id);
    const rows = await db.select().from(emailLog).where(eq(emailLog.userId, u.id));
    expect(rows).toHaveLength(0);
  });
});
