import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { hashPassword } from "@/server/auth/crypto";
import { confirmEmailChange, pendingEmailChange, requestEmailChange, sendVerificationEmail, verifyEmailToken } from "@/server/auth/service";
import { db } from "@/server/db";
import { emailLog, users, verificationTokens } from "@/server/db/schema";
import { deliverableContent } from "@/server/email/send";
import { createTestUser } from "./helpers";

const PASSWORD = "parola-sigura-123";
const newAddress = () => `nou-${randomUUID()}@example.com`;

async function userWithPassword(overrides: Parameters<typeof createTestUser>[0] = {}) {
  return createTestUser({ passwordHash: await hashPassword(PASSWORD), ...overrides });
}

async function emailsFor(userId: string, template: string) {
  return db
    .select()
    .from(emailLog)
    .where(and(eq(emailLog.userId, userId), eq(emailLog.template, template)))
    .orderBy(desc(emailLog.createdAt));
}

/** Tokenul din ultimul email de schimbare (conținutul real de livrat; `email_log` îl păstrează ascuns). */
async function latestChangeToken(userId: string) {
  const [row] = await emailsFor(userId, "email-change");
  const token = (row && deliverableContent(row))?.text?.match(/schimba-email\?token=([\w-]+)/)?.[1];
  if (!token) throw new Error("emailul de schimbare nu conține linkul");
  return token;
}

async function emailOf(userId: string) {
  const [u] = await db.select({ email: users.email, verifiedAt: users.emailVerifiedAt }).from(users).where(eq(users.id, userId));
  return u;
}

describe("schimbarea adresei de email", () => {
  it("trimite linkul la adresa nouă, anunță adresa veche și schimbă emailul după confirmare", async () => {
    const u = await userWithPassword();
    const target = newAddress();
    await requestEmailChange(u.id, { newEmail: `  ${target.toUpperCase()} `, password: PASSWORD });

    // Până la confirmare, contul rămâne pe adresa veche.
    expect((await emailOf(u.id)).email).toBe(u.email);
    expect(await pendingEmailChange(u.id)).toMatchObject({ newEmail: target });

    const [confirm] = await emailsFor(u.id, "email-change");
    expect(confirm.to).toBe(target);
    // Linkul nu apare în clar în email_log (vizibil adminilor).
    expect(confirm.html).toContain("token=[ascuns]");
    expect(confirm.text).toContain("token=[ascuns]");
    const [requested] = await emailsFor(u.id, "email-change-requested");
    expect(requested.to).toBe(u.email);
    expect(requested.subject).toContain("S-a cerut schimbarea adresei de email");

    const token = await latestChangeToken(u.id);
    expect(await confirmEmailChange(token)).toEqual({ status: "changed", userId: u.id, email: target });
    const after = await emailOf(u.id);
    expect(after.email).toBe(target);
    expect(after.verifiedAt).not.toBeNull();
    expect(await pendingEmailChange(u.id)).toBeNull();

    const [changed] = await emailsFor(u.id, "email-changed");
    expect(changed.to).toBe(u.email);
    expect(changed.subject).toContain("Adresa contului tău a fost schimbată");

    // A doua deschidere (ex. scanner de linkuri + clicul omului): tot succes, fără efecte noi.
    expect(await confirmEmailChange(token)).toEqual({ status: "already", userId: u.id, email: target });
    expect(await emailsFor(u.id, "email-changed")).toHaveLength(1);
  });

  it("cere parola curentă corectă și respinge adresa actuală sau una invalidă", async () => {
    const u = await userWithPassword();
    await expect(requestEmailChange(u.id, { newEmail: newAddress(), password: "gresita" })).rejects.toThrow("Parola curentă este greșită.");
    await expect(requestEmailChange(u.id, { newEmail: newAddress() })).rejects.toThrow("Parola curentă este greșită.");
    await expect(requestEmailChange(u.id, { newEmail: u.email.toUpperCase(), password: PASSWORD })).rejects.toThrow("Aceasta este deja adresa contului tău.");
    await expect(requestEmailChange(u.id, { newEmail: "nu-e-email", password: PASSWORD })).rejects.toThrow("Adresa de email nu este validă.");
    expect(await emailsFor(u.id, "email-change")).toHaveLength(0);
  });

  it("nu permite o adresă folosită de alt cont (indiferent de majuscule), nici la cerere, nici la confirmare", async () => {
    const other = await createTestUser();
    const u = await userWithPassword();
    await expect(requestEmailChange(u.id, { newEmail: other.email.toUpperCase(), password: PASSWORD })).rejects.toThrow("Există deja un cont");

    const target = newAddress();
    await requestEmailChange(u.id, { newEmail: target, password: PASSWORD });
    const token = await latestChangeToken(u.id);
    // Între timp, altcineva își face cont cu adresa (scrisă cu majuscule).
    await createTestUser({ email: target.toUpperCase() });
    expect((await confirmEmailChange(token)).status).toBe("taken");
    expect((await emailOf(u.id)).email).toBe(u.email);
  });

  it("conturile Google (fără parolă) au nevoie de o autentificare recentă, nu de parolă", async () => {
    const u = await createTestUser({ passwordHash: "oauth" });
    await expect(requestEmailChange(u.id, { newEmail: newAddress(), sessionAgeMinutes: 60 * 24 })).rejects.toThrow("reconectează-te cu Google");
    await expect(requestEmailChange(u.id, { newEmail: newAddress(), sessionAgeMinutes: null })).rejects.toThrow("reconectează-te cu Google");
    const target = newAddress();
    await requestEmailChange(u.id, { newEmail: target, sessionAgeMinutes: 2 });
    expect((await confirmEmailChange(await latestChangeToken(u.id))).status).toBe("changed");
    expect((await emailOf(u.id)).email).toBe(target);
  });

  it("doar ultimul link e valabil; linkurile expirate sau necunoscute nu schimbă nimic", async () => {
    const u = await userWithPassword();
    await requestEmailChange(u.id, { newEmail: newAddress(), password: PASSWORD });
    const first = await latestChangeToken(u.id);
    const second = newAddress();
    await requestEmailChange(u.id, { newEmail: second, password: PASSWORD });
    const latest = await latestChangeToken(u.id);

    expect((await confirmEmailChange(first)).status).toBe("invalid");
    expect(await confirmEmailChange("nu-exista")).toEqual({ status: "invalid", userId: null });
    expect(await confirmEmailChange("")).toEqual({ status: "invalid", userId: null });

    await db
      .update(verificationTokens)
      .set({ expiresAt: new Date(Date.now() - 60_000) })
      .where(and(eq(verificationTokens.userId, u.id), eq(verificationTokens.type, "email_change")));
    expect(await confirmEmailChange(latest)).toEqual({ status: "expired", userId: u.id });
    expect((await emailOf(u.id)).email).toBe(u.email);
  });

  it("cont neconfirmat (ex. adresă greșită la înregistrare): fără anunț la adresa veche; noua adresă devine confirmată", async () => {
    const u = await userWithPassword({ emailVerifiedAt: null, onboardedAt: null });
    await sendVerificationEmail(u.id);
    const target = newAddress();
    await requestEmailChange(u.id, { newEmail: target, password: PASSWORD });
    expect(await emailsFor(u.id, "email-change-requested")).toHaveLength(0);

    expect((await confirmEmailChange(await latestChangeToken(u.id))).status).toBe("changed");
    const after = await emailOf(u.id);
    expect(after.email).toBe(target);
    expect(after.verifiedAt).not.toBeNull();
    expect(await emailsFor(u.id, "email-changed")).toHaveLength(0);
  });

  it("confirmarea emailului (tokenurile email_verify) nu e afectată de tipul nou", async () => {
    const u = await createTestUser({ emailVerifiedAt: null, onboardedAt: null });
    await sendVerificationEmail(u.id);
    const [row] = await emailsFor(u.id, "verify-email");
    const token = deliverableContent(row)?.text?.match(/verifica-email\?token=([\w-]+)/)?.[1];
    expect(token).toBeTruthy();
    // Un token de verificare nu poate fi folosit ca token de schimbare și invers.
    expect((await confirmEmailChange(token!)).status).toBe("invalid");
    expect((await verifyEmailToken(token!)).status).toBe("verified");
  });
});
