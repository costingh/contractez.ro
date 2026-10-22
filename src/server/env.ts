import { z } from "zod";
// Mesajele de validare Zod în română (global, pentru tot codul de server).
import "../lib/zod-ro";

const bool = z
  .string()
  .optional()
  .transform((v) => v === "true" || v === "1");

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  APP_NAME: z.string().default("Contractez"),
  APP_SECRET: z.string().min(16).default("dev-secret-change-me-please"),
  ADMIN_EMAILS: z.string().default(""),
  DATABASE_URL: z.string().default("postgres://prestio:prestio@localhost:5442/prestio"),
  REDIS_URL: z.string().default("redis://localhost:6392"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-5.4-mini"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Contractez <noreply@contractez.ro>"),
  PAYMENTS_ENABLED: bool,
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  // Stripe Managed Payments: Stripe (prin Link) e vânzătorul oficial (merchant of record) și se ocupă de TVA și facturi.
  STRIPE_MANAGED_PAYMENTS: bool,
  STRIPE_TAX_CODE: z.string().default("txcd_10103001"), // SaaS — business use (eligibil Managed Payments)
  /** Prețuri create în Dashboard (necesare pentru schimbarea planului din portalul de facturare). */
  STRIPE_PRICE_PRO: z.string().optional(),
  STRIPE_PRICE_BUSINESS: z.string().optional(),
  UPLOAD_DIR: z.string().default("./uploads"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  /** VisitTrack (opțional): id-ul public al site-ului (scriptul de tracking) și cheia API (evenimente de pe server). */
  VISITRACK_SITE_ID: z.string().optional(),
  VISITRACK_API_KEY: z.string().optional(),
  /** Crisp (opțional): id-ul site-ului din Crisp → Settings → Website Settings. */
  CRISP_WEBSITE_ID: z.string().optional(),
  /** Outreach copilot (docs/OUTREACH.md): token Bearer al extensiei; fără el, API-ul /api/outreach/* răspunde 503. */
  OUTREACH_TOKEN: z.string().min(24).optional(),
  /** Câte mesaje de outreach trimite omul pe zi (doar afișat și verificat în /admin/leads). */
  OUTREACH_DAILY_CAP: z.coerce.number().int().min(1).max(500).default(20),
});

const parsed = schema.safeParse(
  Object.fromEntries(Object.entries(process.env).map(([k, v]) => [k, v === "" ? undefined : v])),
);
if (!parsed.success) {
  console.error("Configurație invalidă:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

export const env = parsed.data;

export const features = {
  ai: Boolean(env.OPENAI_API_KEY),
  email: Boolean(env.RESEND_API_KEY),
  payments: env.PAYMENTS_ENABLED && Boolean(env.STRIPE_SECRET_KEY),
  stripeConfigured: Boolean(env.STRIPE_SECRET_KEY),
  managedPayments: env.STRIPE_MANAGED_PAYMENTS,
  google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
  visitrack: Boolean(env.VISITRACK_SITE_ID),
  outreach: Boolean(env.OUTREACH_TOKEN),
};

export const adminEmails = new Set(
  env.ADMIN_EMAILS.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);
