import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { freePlan, rules } from "@/config/site";
import { track } from "../analytics";
import { grantCompPlan } from "../billing/plans";
import { db } from "../db";
import { notificationPreferences, users, verificationTokens } from "../db/schema";
import { adminEmails, env } from "../env";
import { queueEmail } from "../email/send";
import { passwordResetTemplate, verifyEmailTemplate } from "../email/templates";
import { DomainError } from "../errors";
import { notify } from "../notifications";
import { hashPassword, randomOtp, randomToken, sha256, verifyPassword } from "./crypto";
import { sendSms } from "./sms";

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Scrie-ți numele").max(80),
  email: z.string().trim().toLowerCase().email("Email invalid").max(200),
  password: z.string().min(8, "Parola trebuie să aibă cel puțin 8 caractere").max(200),
  terms: z.literal(true, { message: "Trebuie să accepți termenii" }),
  ref: z.string().max(40).optional(),
});

export async function signUp(raw: unknown) {
  const input = signUpSchema.parse(raw);
  const [exists] = await db.select({ id: users.id }).from(users).where(sql`lower(${users.email}) = ${input.email}`);
  if (exists) throw new DomainError("email_taken", "Există deja un cont cu acest email. Încearcă să te autentifici.");
  let referredById: string | null = null;
  if (input.ref) {
    const [r] = await db.select({ id: users.id }).from(users).where(eq(users.referralCode, input.ref));
    referredById = r?.id ?? null;
  }
  const [user] = await db
    .insert(users)
    .values({
      email: input.email,
      name: input.name,
      passwordHash: await hashPassword(input.password),
      role: adminEmails.has(input.email) ? "admin" : "user",
      referralCode: randomToken(6).replace(/[-_]/g, "x").slice(0, 8).toLowerCase(),
      referredById,
    })
    .returning();
  await db.insert(notificationPreferences).values({ userId: user.id }).onConflictDoNothing();
  await sendVerificationEmail(user.id);
  await track("user.signed_up", user.id, { referred: Boolean(referredById) });
  return user;
}

export async function authenticate(email: string, password: string) {
  const [user] = await db.select().from(users).where(sql`lower(${users.email}) = ${email.trim().toLowerCase()}`);
  // Verificăm parola și când utilizatorul nu există, ca timpul de răspuns să nu dezvăluie conturile.
  const ok = await verifyPassword(password, user?.passwordHash ?? "scrypt$AAAAAAAAAAAAAAAAAAAAAA==$AAAA");
  if (user && !ok && user.passwordHash === "oauth") {
    throw new DomainError("google_account", "Acest cont folosește autentificarea cu Google. Apasă „Continuă cu Google” sau setează o parolă din „Ai uitat parola?”.");
  }
  if (!user || !ok) throw new DomainError("invalid_credentials", "Email sau parolă incorecte.");
  if (user.bannedAt) throw new DomainError("banned", "Contul este suspendat. Contactează-ne dacă e o greșeală.");
  if (user.deletedAt) throw new DomainError("deleted", "Contul a fost șters.");
  await db.update(users).set({ lastSeenAt: new Date() }).where(eq(users.id, user.id));
  return user;
}

async function createToken(userId: string, type: "email_verify" | "password_reset" | "phone_otp", ttlMinutes: number, target?: string) {
  const token = type === "phone_otp" ? randomOtp() : randomToken();
  await db
    .update(verificationTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(verificationTokens.userId, userId), eq(verificationTokens.type, type), isNull(verificationTokens.usedAt)));
  await db.insert(verificationTokens).values({
    userId,
    type,
    tokenHash: sha256(token),
    target: target ?? null,
    expiresAt: new Date(Date.now() + ttlMinutes * 60_000),
  });
  return token;
}

export async function sendVerificationEmail(userId: string) {
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  if (!u || u.emailVerifiedAt) return;
  const token = await createToken(userId, "email_verify", 60 * 48);
  const link = `${env.APP_URL}/verifica-email?token=${token}`;
  if (env.NODE_ENV !== "production") console.log(`[auth:dev] Link verificare pentru ${u.email}: ${link}`);
  const { subject, html, text } = verifyEmailTemplate({ firstName: u.name.split(" ")[0], link });
  await queueEmail({ to: u.email, userId, template: "verify-email", subject, html, text });
}

export async function verifyEmailToken(token: string) {
  const [row] = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.type, "email_verify"),
        eq(verificationTokens.tokenHash, sha256(token)),
        isNull(verificationTokens.usedAt),
        gt(verificationTokens.expiresAt, new Date()),
      ),
    );
  if (!row) throw new DomainError("invalid_token", "Linkul de confirmare este invalid sau a expirat.");
  await db.update(verificationTokens).set({ usedAt: new Date() }).where(eq(verificationTokens.id, row.id));
  await db.update(users).set({ emailVerifiedAt: new Date() }).where(and(eq(users.id, row.userId), isNull(users.emailVerifiedAt)));
  await maybeActivateProvider(row.userId);
  await track("user.email_verified", row.userId);
  return row.userId;
}

/**
 * Prestator activat (email confirmat): o singură dată. Dacă a venit printr-o recomandare, cel care l-a
 * recomandat primește Pro gratuit pentru o perioadă (doar dacă nu are deja un abonament plătit).
 */
export async function maybeActivateProvider(userId: string) {
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  if (!u || !u.isProvider || !u.emailVerifiedAt || u.welcomeCreditsGrantedAt) return false;
  const [claimed] = await db
    .update(users)
    .set({ welcomeCreditsGrantedAt: new Date() })
    .where(and(eq(users.id, userId), isNull(users.welcomeCreditsGrantedAt)))
    .returning({ id: users.id });
  if (!claimed) return false;
  await notify({
    userId,
    type: "plan.welcome",
    title: `Bun venit! Ai ${freePlan.monthlyApplications} aplicări gratuite în fiecare lună`,
    body: "Aplică la proiectele potrivite din recomandări. Chat-ul cu clienții e nelimitat.",
    link: "/recomandari",
    dedupeKey: `welcome:${userId}`,
  });
  if (u.referredById) {
    const res = await grantCompPlan(u.referredById, "pro", rules.referralProDays);
    if (res.granted) {
      await notify({
        userId: u.referredById,
        type: "plan.referral",
        title: `Ai primit ${rules.referralProDays} de zile de Pro pentru o recomandare`,
        link: "/abonament",
        dedupeKey: `referral:${userId}`,
      });
    }
  }
  return true;
}

export async function requestPasswordReset(email: string) {
  const [u] = await db.select().from(users).where(sql`lower(${users.email}) = ${email.trim().toLowerCase()}`);
  if (!u || u.deletedAt) return; // nu dezvăluim dacă emailul există
  const token = await createToken(u.id, "password_reset", 60);
  const link = `${env.APP_URL}/resetare-parola?token=${token}`;
  if (env.NODE_ENV !== "production") console.log(`[auth:dev] Link resetare pentru ${u.email}: ${link}`);
  const { subject, html, text } = passwordResetTemplate({ link });
  await queueEmail({ to: u.email, userId: u.id, template: "password-reset", subject, html, text });
}

export async function resetPassword(token: string, password: string) {
  if (password.length < 8) throw new DomainError("weak", "Parola trebuie să aibă cel puțin 8 caractere.");
  const [row] = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.type, "password_reset"),
        eq(verificationTokens.tokenHash, sha256(token)),
        isNull(verificationTokens.usedAt),
        gt(verificationTokens.expiresAt, new Date()),
      ),
    );
  if (!row) throw new DomainError("invalid_token", "Linkul de resetare este invalid sau a expirat.");
  await db.update(verificationTokens).set({ usedAt: new Date() }).where(eq(verificationTokens.id, row.id));
  // Resetarea prin email dovedește și deținerea adresei.
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(password), emailVerifiedAt: sql`coalesce(${users.emailVerifiedAt}, now())` })
    .where(eq(users.id, row.userId));
  return row.userId;
}

export async function changePassword(userId: string, current: string, next: string) {
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  if (!u) throw new DomainError("invalid", "Utilizator inexistent.");
  // Conturile create cu Google nu au parolă: o pot seta fără cea curentă.
  if (u.passwordHash !== "oauth" && !(await verifyPassword(current, u.passwordHash))) throw new DomainError("invalid", "Parola curentă este greșită.");
  if (next.length < 8) throw new DomainError("weak", "Parola nouă trebuie să aibă cel puțin 8 caractere.");
  await db.update(users).set({ passwordHash: await hashPassword(next) }).where(eq(users.id, userId));
}

const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s.-]/g, ""))
  .pipe(z.string().regex(/^(\+40|0040|0)7\d{8}$/, "Număr de mobil românesc invalid (ex: 07xx xxx xxx)"))
  .transform((v) => "+40" + v.replace(/^(\+40|0040|0)/, ""));

export async function sendPhoneOtp(userId: string, rawPhone: string) {
  const phone = phoneSchema.parse(rawPhone);
  const [taken] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.phone, phone), sql`${users.phoneVerifiedAt} IS NOT NULL`, sql`${users.id} <> ${userId}`));
  if (taken) throw new DomainError("phone_taken", "Numărul este deja verificat pe alt cont.");
  const code = await createToken(userId, "phone_otp", 10, phone);
  await sendSms(phone, `Codul tău ${env.APP_NAME}: ${code}. Expiră în 10 minute.`);
  return phone;
}

export async function verifyPhoneOtp(userId: string, code: string) {
  const [row] = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.userId, userId),
        eq(verificationTokens.type, "phone_otp"),
        isNull(verificationTokens.usedAt),
        gt(verificationTokens.expiresAt, new Date()),
      ),
    )
    .orderBy(sql`${verificationTokens.createdAt} DESC`)
    .limit(1);
  if (!row) throw new DomainError("expired", "Codul a expirat. Cere unul nou.");
  if (row.attempts >= 5) throw new DomainError("attempts", "Prea multe încercări. Cere un cod nou.");
  if (row.tokenHash !== sha256(code.trim())) {
    await db.update(verificationTokens).set({ attempts: row.attempts + 1 }).where(eq(verificationTokens.id, row.id));
    throw new DomainError("invalid", "Cod incorect.");
  }
  await db.update(verificationTokens).set({ usedAt: new Date() }).where(eq(verificationTokens.id, row.id));
  await db.update(users).set({ phone: row.target, phoneVerifiedAt: new Date() }).where(eq(users.id, userId));
}
