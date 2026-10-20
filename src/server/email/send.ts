import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "../db";
import { emailLog } from "../db/schema";
import { env, features } from "../env";
import { enqueue } from "../queue";

/** Salvează emailul și îl pune în coadă. Worker-ul îl trimite prin Resend (sau doar îl loghează în dev). */
export async function queueEmail(opts: {
  to: string;
  subject: string;
  html: string;
  template: string;
  userId?: string | null;
  dedupeKey?: string;
}) {
  const [row] = await db
    .insert(emailLog)
    .values({
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
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
    await db.update(emailLog).set({ status: "logged" }).where(eq(emailLog.id, emailId));
    return;
  }
  resend ??= new Resend(env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send(
    { from: env.EMAIL_FROM, to: row.to, subject: row.subject, html: row.html },
    { idempotencyKey: `email-${row.id}` },
  );
  if (error) {
    await db.update(emailLog).set({ status: "failed", error: error.message }).where(eq(emailLog.id, emailId));
    throw new Error(`Resend: ${error.message}`);
  }
  await db
    .update(emailLog)
    .set({ status: "sent", providerMessageId: data?.id ?? null, error: null })
    .where(eq(emailLog.id, emailId));
}
