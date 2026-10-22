import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { and, eq, isNotNull, lt } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "../db";
import { emailLog } from "../db/schema";
import { env, features } from "../env";
import { enqueue } from "../queue";

/*
 * Linkurile secrete (resetare parolă, confirmare email, schimbare email) nu rămân în clar în `email_log`:
 * oricine vede /admin/emailuri ar putea folosi un link de resetare și prelua contul.
 *  - `html` / `text` se salvează cu tokenurile ascunse (`token=[ascuns]`) — asta vede adminul;
 *  - conținutul real se salvează criptat în `secret` (AES-256-GCM, cheie derivată din APP_SECRET), ca worker-ul
 *    să-l poată livra și la reîncercări sau după o repornire;
 *  - după livrare (sau înregistrare în dev), `secret` se șterge. Job-ul de mentenanță îl șterge și pe cel rămas.
 */

export const REDACTED_TOKEN = "[ascuns]";
const SECRET_PARAM = /([?&](?:amp;)?token=)([^&"'\s<>]+)/g;

/** Înlocuiește valorile parametrilor `token=` din linkuri cu `[ascuns]`. */
export function redactSecrets(content: string) {
  return content.replace(SECRET_PARAM, (_, prefix: string, value: string) => (value === REDACTED_TOKEN ? `${prefix}${value}` : `${prefix}${REDACTED_TOKEN}`));
}

const secretKey = () => createHash("sha256").update(`email-log-secret:${env.APP_SECRET}`).digest();

type SecretContent = { html: string; text: string | null };

export function encryptEmailSecret(content: SecretContent) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secretKey(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(content), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

export function decryptEmailSecret(secret: string): SecretContent | null {
  try {
    const raw = Buffer.from(secret, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", secretKey(), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    const json = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
    return JSON.parse(json) as SecretContent;
  } catch {
    return null; // APP_SECRET schimbat sau conținut corupt
  }
}

/** Conținutul de trimis pentru un rând din `email_log`: cel real (decriptat) dacă emailul are linkuri secrete. */
export function deliverableContent(row: { html: string; text: string | null; secret: string | null }): SecretContent | null {
  if (!row.secret) return { html: row.html, text: row.text };
  return decryptEmailSecret(row.secret);
}

/** Salvează emailul și îl pune în coadă. Worker-ul îl trimite prin Resend (sau doar îl loghează în dev). */
export async function queueEmail(opts: {
  to: string;
  subject: string;
  html: string;
  /** Varianta text (o generează `renderEmail`); ajută livrabilitatea. */
  text?: string;
  template: string;
  userId?: string | null;
  dedupeKey?: string;
}) {
  const text = opts.text ?? null;
  const html = redactSecrets(opts.html);
  const redactedText = text === null ? null : redactSecrets(text);
  const hasSecrets = html !== opts.html || redactedText !== text;
  const [row] = await db
    .insert(emailLog)
    .values({
      to: opts.to,
      subject: opts.subject,
      html,
      text: redactedText,
      secret: hasSecrets ? encryptEmailSecret({ html: opts.html, text }) : null,
      template: opts.template,
      userId: opts.userId ?? null,
      dedupeKey: opts.dedupeKey ?? null,
    })
    .onConflictDoNothing({ target: emailLog.dedupeKey })
    .returning({ id: emailLog.id });
  if (!row) return null; // deja trimis (dedupe)
  if (env.NODE_ENV !== "production" && !features.email) {
    console.log(`[email:dev] → ${opts.to} | ${opts.subject} | vezi /admin/emailuri`);
  }
  await enqueue("email", { emailId: row.id }, { jobId: `email-${row.id}` });
  return row.id;
}

let resend: Resend | null = null;

/** Rulat de worker. Idempotent: un email deja trimis nu este retrimis. */
export async function deliverEmail(emailId: string) {
  const [row] = await db.select().from(emailLog).where(eq(emailLog.id, emailId)).limit(1);
  if (!row || row.status === "sent" || row.status === "logged") return;
  if (!features.email) {
    await db.update(emailLog).set({ status: "logged", secret: null }).where(eq(emailLog.id, emailId));
    return;
  }
  const content = deliverableContent(row);
  if (!content) {
    // Fără conținutul real, un email cu linkul ascuns n-ar ajuta pe nimeni; nu reîncercăm.
    await db.update(emailLog).set({ status: "failed", error: "Conținutul securizat nu mai este disponibil." }).where(eq(emailLog.id, emailId));
    return;
  }
  resend ??= new Resend(env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send(
    { from: env.EMAIL_FROM, to: row.to, subject: row.subject, html: content.html, ...(content.text ? { text: content.text } : {}) },
    { idempotencyKey: `email-${row.id}` },
  );
  if (error) {
    await db.update(emailLog).set({ status: "failed", error: error.message }).where(eq(emailLog.id, emailId));
    throw new Error(`Resend: ${error.message}`);
  }
  await db
    .update(emailLog)
    .set({ status: "sent", providerMessageId: data?.id ?? null, error: null, secret: null })
    .where(eq(emailLog.id, emailId));
}

/** Mentenanță: șterge conținutul secret rămas (emailuri nelivrate). Linkurile oricum expiră în cel mult 48 de ore. */
export async function purgeEmailSecrets(olderThanMs = 3 * 86_400_000) {
  await db
    .update(emailLog)
    .set({ secret: null })
    .where(and(isNotNull(emailLog.secret), lt(emailLog.createdAt, new Date(Date.now() - olderThanMs))));
}
