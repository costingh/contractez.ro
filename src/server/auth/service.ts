import { and, eq, gt, isNull, lt, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { freePlan, rules } from "@/config/site";
import { track } from "../analytics";
import { grantCompPlan } from "../billing/plans";
import { db } from "../db";
import { notificationPreferences, users, verificationTokens } from "../db/schema";
import { adminEmails, env } from "../env";
import { queueEmail } from "../email/send";
import { emailChangeConfirmTemplate, emailChangeNoticeTemplate, passwordResetTemplate, verifyEmailTemplate } from "../email/templates";
import { DomainError } from "../errors";
import { notify } from "../notifications";
import { hashPassword, randomOtp, randomToken, sha256, verifyPassword } from "./crypto";
import { sendSms } from "./sms";

/** Lungimea maximă a unei parole noi (limitează costul hash-ului scrypt pentru intrări uriașe). */
export const PASSWORD_MAX = 128;
const PASSWORD_TOO_LONG = `Parola poate avea cel mult ${PASSWORD_MAX} de caractere.`;

/** Câte coduri SMS greșite acceptăm pentru același cod. */
const OTP_MAX_ATTEMPTS = 5;

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Scrie-ți numele").max(80),
  email: z.string().trim().toLowerCase().email("Email invalid").max(200),
  password: z.string().min(8, "Parola trebuie să aibă cel puțin 8 caractere").max(PASSWORD_MAX, PASSWORD_TOO_LONG),
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

async function createToken(userId: string, type: "email_verify" | "password_reset" | "phone_otp" | "email_change", ttlMinutes: number, target?: string) {
  const token = type === "phone_otp" ? randomOtp() : randomToken();
  // Resetarea parolei, schimbarea emailului și codurile SMS: doar ultimul e valabil. Linkurile de confirmare a emailului rămân
  // valabile până expiră, ca un email mai vechi (sau unul deschis după „Retrimite”) să funcționeze în continuare.
  if (type !== "email_verify") {
    await db
      .update(verificationTokens)
      .set({ usedAt: new Date() })
      .where(and(eq(verificationTokens.userId, userId), eq(verificationTokens.type, type), isNull(verificationTokens.usedAt)));
  }
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
  // `target` = adresa la care a plecat linkul: linkul confirmă doar această adresă.
  const token = await createToken(userId, "email_verify", 60 * 48, u.email.toLowerCase());
  const link = `${env.APP_URL}/verifica-email?token=${token}`;
  if (env.NODE_ENV !== "production") console.log(`[auth:dev] Link verificare pentru ${u.email}: ${link}`);
  const { subject, html, text } = verifyEmailTemplate({ firstName: u.name.split(" ")[0], link });
  await queueEmail({ to: u.email, userId, template: "verify-email", subject, html, text });
}

/**
 * - `verified`: emailul a fost confirmat acum;
 * - `already`: contul linkului era deja confirmat (ex. linkul a fost deschis înainte de un scanner de securitate
 *   al emailului, de previzualizarea linkului sau de un clic anterior) — tot succes;
 * - `expired` / `invalid`: linkul nu (mai) poate confirma nimic. `userId` e setat dacă linkul aparține unui cont.
 */
export type EmailVerificationResult =
  | { status: "verified" | "already"; userId: string }
  | { status: "expired" | "invalid"; userId: string | null };

/**
 * Confirmă emailul din link. Idempotent: același link (sau unul mai vechi, încă valabil) poate fi deschis de mai
 * multe ori. Scannerele de linkuri (Gmail, Outlook Safe Links, previzualizări iOS) deschid linkul înaintea omului;
 * dacă primul GET l-ar „consuma”, clicul real ar afișa o eroare deși contul tocmai a fost confirmat.
 */
export async function verifyEmailToken(token: string): Promise<EmailVerificationResult> {
  if (!token || token.length > 200) return { status: "invalid", userId: null };
  const [row] = await db
    .select()
    .from(verificationTokens)
    .where(and(eq(verificationTokens.type, "email_verify"), eq(verificationTokens.tokenHash, sha256(token))))
    .limit(1);
  if (!row) return { status: "invalid", userId: null };
  const [u] = await db.select().from(users).where(eq(users.id, row.userId));
  if (!u || u.deletedAt) return { status: "invalid", userId: null };
  if (u.emailVerifiedAt) {
    if (!row.usedAt) await db.update(verificationTokens).set({ usedAt: new Date() }).where(eq(verificationTokens.id, row.id));
    return { status: "already", userId: u.id };
  }
  // Linkul confirmă doar adresa la care a fost trimis.
  if (row.target && row.target !== u.email.toLowerCase()) return { status: "invalid", userId: u.id };
  if (row.expiresAt <= new Date()) return { status: "expired", userId: u.id };

  const [flipped] = await db
    .update(users)
    .set({ emailVerifiedAt: new Date() })
    .where(and(eq(users.id, u.id), isNull(users.emailVerifiedAt)))
    .returning({ id: users.id });
  await db.update(verificationTokens).set({ usedAt: new Date() }).where(and(eq(verificationTokens.id, row.id), isNull(verificationTokens.usedAt)));
  // Două deschideri simultane (scanner + om): doar prima face efectele secundare; ambele văd succes.
  if (!flipped) return { status: "already", userId: u.id };
  await maybeActivateProvider(u.id);
  await track("user.email_verified", u.id);
  return { status: "verified", userId: u.id };
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

/** Starea unui link de resetare, verificată la afișarea paginii (înainte de formular). */
export type PasswordResetTokenState = "valid" | "used" | "expired" | "invalid";

export async function checkPasswordResetToken(token: string | undefined | null): Promise<PasswordResetTokenState> {
  if (!token || token.length > 200) return "invalid";
  const [row] = await db
    .select({ usedAt: verificationTokens.usedAt, expiresAt: verificationTokens.expiresAt, deletedAt: users.deletedAt })
    .from(verificationTokens)
    .innerJoin(users, eq(users.id, verificationTokens.userId))
    .where(and(eq(verificationTokens.type, "password_reset"), eq(verificationTokens.tokenHash, sha256(token))))
    .limit(1);
  if (!row || row.deletedAt) return "invalid";
  // `usedAt` e setat și când un link mai nou l-a înlocuit (doar ultimul link de resetare e valabil).
  if (row.usedAt) return "used";
  if (row.expiresAt <= new Date()) return "expired";
  return "valid";
}

export async function resetPassword(token: string, password: string) {
  if (password.length < 8) throw new DomainError("weak", "Parola trebuie să aibă cel puțin 8 caractere.");
  if (password.length > PASSWORD_MAX) throw new DomainError("long", PASSWORD_TOO_LONG);
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
  if (next.length > PASSWORD_MAX) throw new DomainError("long", PASSWORD_TOO_LONG);
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
  // Încercarea se numără atomic ÎNAINTE de comparare: cererile simultane nu pot depăși limita
  // (citirea + incrementarea separate permiteau oricâte încercări în paralel).
  const [counted] = await db
    .update(verificationTokens)
    .set({ attempts: sql`${verificationTokens.attempts} + 1` })
    .where(and(eq(verificationTokens.id, row.id), isNull(verificationTokens.usedAt), lt(verificationTokens.attempts, OTP_MAX_ATTEMPTS)))
    .returning({ attempts: verificationTokens.attempts });
  if (!counted) throw new DomainError("attempts", "Prea multe încercări. Cere un cod nou.");
  if (row.tokenHash !== sha256(code.trim())) throw new DomainError("invalid", "Cod incorect.");
  const [used] = await db
    .update(verificationTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(verificationTokens.id, row.id), isNull(verificationTokens.usedAt)))
    .returning({ id: verificationTokens.id });
  if (!used) throw new DomainError("expired", "Codul a fost deja folosit. Cere unul nou.");
  await db.update(users).set({ phone: row.target, phoneVerifiedAt: new Date() }).where(eq(users.id, userId));
}

/* ----------------------------- Schimbarea emailului ----------------------------- */

const EMAIL_CHANGE_TTL_MINUTES = 60 * 24;
/** Conturile Google fără parolă confirmă schimbarea printr-o autentificare recentă (sesiune mai nouă de atât). */
export const EMAIL_CHANGE_FRESH_SESSION_MINUTES = 15;

const newEmailSchema = z.string().trim().toLowerCase().email("Adresa de email nu este validă.").max(200, "Adresa de email este prea lungă.");

async function emailTaken(email: string, exceptUserId: string) {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(sql`lower(${users.email}) = ${email}`, ne(users.id, exceptUserId)))
    .limit(1);
  return Boolean(row);
}

/**
 * Cere schimbarea adresei de email: linkul de confirmare pleacă la adresa NOUĂ (dovedește că omul o deține),
 * iar adresa veche primește o notificare. Contul rămâne pe adresa veche până la confirmare.
 * - conturile cu parolă confirmă cu parola curentă;
 * - conturile create cu Google (fără parolă) trebuie să se fi autentificat recent (`sessionAgeMinutes`).
 */
export async function requestEmailChange(userId: string, input: { newEmail: string; password?: string; sessionAgeMinutes?: number | null }) {
  const newEmail = newEmailSchema.parse(input.newEmail);
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  if (!u || u.deletedAt) throw new DomainError("invalid", "Utilizator inexistent.");
  if (u.passwordHash === "oauth") {
    if (input.sessionAgeMinutes == null || input.sessionAgeMinutes > EMAIL_CHANGE_FRESH_SESSION_MINUTES) {
      throw new DomainError("reauth", "Pentru siguranță, reconectează-te cu Google și încearcă din nou în următoarele 15 minute.");
    }
  } else if (!input.password || !(await verifyPassword(input.password, u.passwordHash))) {
    throw new DomainError("password", "Parola curentă este greșită.");
  }
  if (newEmail === u.email.toLowerCase()) throw new DomainError("same", "Aceasta este deja adresa contului tău.");
  if (await emailTaken(newEmail, userId)) throw new DomainError("email_taken", "Există deja un cont cu această adresă de email.");

  // `target` = adresa nouă; un link nou îl invalidează pe cel vechi (vezi `createToken`).
  const token = await createToken(userId, "email_change", EMAIL_CHANGE_TTL_MINUTES, newEmail);
  const link = `${env.APP_URL}/schimba-email?token=${token}`;
  if (env.NODE_ENV !== "production") console.log(`[auth:dev] Link schimbare email pentru ${newEmail}: ${link}`);
  const firstName = u.name.split(" ")[0];
  const confirm = emailChangeConfirmTemplate({ firstName, newEmail, link });
  await queueEmail({ to: newEmail, userId, template: "email-change", subject: confirm.subject, html: confirm.html, text: confirm.text });
  // Adresa veche: doar dacă a fost confirmată (altfel poate fi o greșeală de tastare, a altcuiva).
  if (u.emailVerifiedAt) {
    const notice = emailChangeNoticeTemplate({ firstName, newEmail, stage: "requested" });
    await queueEmail({ to: u.email, userId, template: "email-change-requested", subject: notice.subject, html: notice.html, text: notice.text });
  }
  await track("user.email_change_requested", userId);
  return { newEmail };
}

/** Schimbarea de email în așteptare (link trimis, neconfirmat, neexpirat). */
export async function pendingEmailChange(userId: string): Promise<{ newEmail: string; expiresAt: Date } | null> {
  const [row] = await db
    .select({ target: verificationTokens.target, expiresAt: verificationTokens.expiresAt })
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.userId, userId),
        eq(verificationTokens.type, "email_change"),
        isNull(verificationTokens.usedAt),
        gt(verificationTokens.expiresAt, new Date()),
      ),
    )
    .orderBy(sql`${verificationTokens.createdAt} DESC`)
    .limit(1);
  return row?.target ? { newEmail: row.target, expiresAt: row.expiresAt } : null;
}

/**
 * - `changed`: adresa contului este acum cea nouă;
 * - `already`: linkul a fost deja folosit și contul e pe adresa din link (ex. scanner de linkuri + clicul omului);
 * - `taken`: între timp, adresa a fost folosită de alt cont;
 * - `expired` / `invalid`: linkul nu (mai) poate schimba nimic.
 */
export type EmailChangeResult = { status: "changed" | "already" | "taken" | "expired" | "invalid"; userId: string | null; email?: string };

export async function confirmEmailChange(token: string): Promise<EmailChangeResult> {
  if (!token || token.length > 200) return { status: "invalid", userId: null };
  const [row] = await db
    .select()
    .from(verificationTokens)
    .where(and(eq(verificationTokens.type, "email_change"), eq(verificationTokens.tokenHash, sha256(token))))
    .limit(1);
  if (!row?.target) return { status: "invalid", userId: null };
  const [u] = await db.select().from(users).where(eq(users.id, row.userId));
  if (!u || u.deletedAt) return { status: "invalid", userId: null };
  const newEmail = row.target;
  if (row.usedAt) {
    return u.email.toLowerCase() === newEmail ? { status: "already", userId: u.id, email: newEmail } : { status: "invalid", userId: u.id };
  }
  if (row.expiresAt <= new Date()) return { status: "expired", userId: u.id };
  if (await emailTaken(newEmail, u.id)) return { status: "taken", userId: u.id };

  const oldEmail = u.email;
  // Consumăm linkul atomic: două deschideri simultane → doar una face schimbarea.
  const [claimed] = await db
    .update(verificationTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(verificationTokens.id, row.id), isNull(verificationTokens.usedAt)))
    .returning({ id: verificationTokens.id });
  if (!claimed) return { status: "already", userId: u.id, email: newEmail };
  try {
    // Linkul deschis dovedește deținerea noii adrese → contul rămâne (sau devine) confirmat.
    await db.update(users).set({ email: newEmail, emailVerifiedAt: new Date() }).where(eq(users.id, u.id));
  } catch (err) {
    // Indexul unic pe lower(email): alt cont a luat adresa chiar acum.
    if ((err as { code?: string }).code === "23505" || (err as { cause?: { code?: string } }).cause?.code === "23505") {
      return { status: "taken", userId: u.id };
    }
    throw err;
  }
  // Linkurile de confirmare trimise la adresa veche nu mai au obiect.
  await db
    .update(verificationTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(verificationTokens.userId, u.id), eq(verificationTokens.type, "email_verify"), isNull(verificationTokens.usedAt)));
  if (u.emailVerifiedAt) {
    const notice = emailChangeNoticeTemplate({ firstName: u.name.split(" ")[0], newEmail, stage: "changed" });
    await queueEmail({ to: oldEmail, userId: u.id, template: "email-changed", subject: notice.subject, html: notice.html, text: notice.text });
  } else {
    // Contul nu era confirmat (ex. adresă greșită la înregistrare): acum este.
    await maybeActivateProvider(u.id);
  }
  await track("user.email_changed", u.id);
  return { status: "changed", userId: u.id, email: newEmail };
}
