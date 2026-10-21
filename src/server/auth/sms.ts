import { env } from "../env";

/**
 * Trimitere SMS printr-un gateway HTTP generic (ex: SMSLink, SMSO, Twilio printr-un mic adaptor).
 * Configurează SMS_WEBHOOK_URL (+ opțional SMS_WEBHOOK_TOKEN). Fără configurare, în dezvoltare codul
 * apare în consolă, iar în producție verificarea telefonului este dezactivată în interfață
 * (vezi `features.phoneVerification` din ../features.ts).
 */
export const smsConfigured = Boolean(process.env.SMS_WEBHOOK_URL);

export async function sendSms(to: string, text: string) {
  const url = process.env.SMS_WEBHOOK_URL;
  if (!url) {
    if (env.NODE_ENV === "production") throw new Error("Trimiterea SMS nu este configurată");
    console.log(`[sms:dev] → ${to}: ${text}`);
    return;
  }
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(process.env.SMS_WEBHOOK_TOKEN ? { authorization: `Bearer ${process.env.SMS_WEBHOOK_TOKEN}` } : {}),
    },
    body: JSON.stringify({ to, text }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`SMS gateway: ${res.status}`);
}
