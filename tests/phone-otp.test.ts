import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { changePassword, resetPassword, verifyPhoneOtp } from "@/server/auth/service";
import { sha256 } from "@/server/auth/crypto";
import { db } from "@/server/db";
import { users, verificationTokens } from "@/server/db/schema";
import { createTestUser } from "./helpers";

async function otp(userId: string, code = "123456") {
  const [row] = await db
    .insert(verificationTokens)
    .values({ userId, type: "phone_otp", tokenHash: sha256(code), target: "+40712345678", expiresAt: new Date(Date.now() + 600_000) })
    .returning();
  return row;
}

describe("codul SMS: limita de încercări", () => {
  it("încercările simultane nu depășesc limita de 5 (contorul e atomic)", async () => {
    const u = await createTestUser();
    const row = await otp(u.id);
    const results = await Promise.allSettled(Array.from({ length: 20 }, () => verifyPhoneOtp(u.id, "000000")));
    const codes = results.map((r) => (r.status === "rejected" ? (r.reason as { code?: string }).code : "ok"));
    expect(codes.filter((c) => c === "invalid")).toHaveLength(5);
    expect(codes.filter((c) => c === "attempts")).toHaveLength(15);
    const [after] = await db.select().from(verificationTokens).where(eq(verificationTokens.id, row.id));
    expect(after.attempts).toBe(5);
    // Nici codul corect nu mai e acceptat după 5 încercări.
    await expect(verifyPhoneOtp(u.id, "123456")).rejects.toMatchObject({ code: "attempts" });
  });

  it("codul corect, la a cincea încercare, confirmă numărul o singură dată", async () => {
    const u = await createTestUser();
    await otp(u.id);
    for (let i = 0; i < 4; i++) await expect(verifyPhoneOtp(u.id, "999999")).rejects.toMatchObject({ code: "invalid" });
    await verifyPhoneOtp(u.id, " 123456 ");
    const [after] = await db.select().from(users).where(eq(users.id, u.id));
    expect(after.phone).toBe("+40712345678");
    expect(after.phoneVerifiedAt).toBeTruthy();
    await expect(verifyPhoneOtp(u.id, "123456")).rejects.toMatchObject({ code: "expired" });
  });
});

describe("parole: lungime maximă", () => {
  it("resetarea și schimbarea refuză parolele de peste 128 de caractere înainte de hash", async () => {
    const u = await createTestUser({ passwordHash: "oauth" });
    await expect(changePassword(u.id, "", "a".repeat(129))).rejects.toMatchObject({ code: "long" });
    await expect(resetPassword("orice-token", "a".repeat(10_000))).rejects.toMatchObject({ code: "long" });
    await expect(changePassword(u.id, "", "a".repeat(128))).resolves.toBeUndefined();
  });
});
