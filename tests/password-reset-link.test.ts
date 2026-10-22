import { and, desc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { checkPasswordResetToken, requestPasswordReset, resetPassword } from "@/server/auth/service";
import { db } from "@/server/db";
import { emailLog, users, verificationTokens } from "@/server/db/schema";
import { deliverableContent } from "@/server/email/send";
import { createTestUser } from "./helpers";

async function latestResetToken(userId: string) {
  const [row] = await db
    .select()
    .from(emailLog)
    .where(and(eq(emailLog.userId, userId), eq(emailLog.template, "password-reset")))
    .orderBy(desc(emailLog.createdAt))
    .limit(1);
  const token = (row && deliverableContent(row))?.text?.match(/resetare-parola\?token=([\w-]+)/)?.[1];
  if (!token) throw new Error("emailul de resetare nu conține linkul");
  return token;
}

describe("linkul de resetare a parolei, verificat la afișarea paginii", () => {
  it("valid → folosit după resetare", async () => {
    const u = await createTestUser();
    await requestPasswordReset(u.email);
    const token = await latestResetToken(u.id);
    expect(await checkPasswordResetToken(token)).toBe("valid");
    await resetPassword(token, "parola-noua-123");
    expect(await checkPasswordResetToken(token)).toBe("used");
  });

  it("un link înlocuit de unul mai nou apare ca folosit", async () => {
    const u = await createTestUser();
    await requestPasswordReset(u.email);
    const first = await latestResetToken(u.id);
    await requestPasswordReset(u.email);
    expect(await checkPasswordResetToken(first)).toBe("used");
    expect(await checkPasswordResetToken(await latestResetToken(u.id))).toBe("valid");
  });

  it("expirat, necunoscut, lipsă sau al unui cont șters", async () => {
    const u = await createTestUser();
    await requestPasswordReset(u.email);
    const token = await latestResetToken(u.id);
    await db
      .update(verificationTokens)
      .set({ expiresAt: new Date(Date.now() - 60_000) })
      .where(and(eq(verificationTokens.userId, u.id), eq(verificationTokens.type, "password_reset")));
    expect(await checkPasswordResetToken(token)).toBe("expired");

    expect(await checkPasswordResetToken("nu-exista")).toBe("invalid");
    expect(await checkPasswordResetToken("")).toBe("invalid");
    expect(await checkPasswordResetToken(undefined)).toBe("invalid");
    expect(await checkPasswordResetToken("x".repeat(500))).toBe("invalid");

    const d = await createTestUser();
    await requestPasswordReset(d.email);
    const dt = await latestResetToken(d.id);
    await db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, d.id));
    expect(await checkPasswordResetToken(dt)).toBe("invalid");
  });
});
