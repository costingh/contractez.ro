import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { createTestUser } from "./helpers";

// Înainte de orice import care citește env (helpers → db → env).
vi.hoisted(() => {
  process.env.PAYMENTS_ENABLED = "true";
  process.env.STRIPE_SECRET_KEY = "sk_test_fake";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_fake";
  process.env.STRIPE_MANAGED_PAYMENTS = "true";
});

// Stripe fals: capturăm parametrii sesiunilor Checkout; webhook-ul parsează direct corpul.
const { createSession } = vi.hoisted(() => ({
  createSession: vi.fn<(params: Record<string, unknown>) => Promise<{ id: string; url: string }>>(async () => ({
    id: `cs_test_${Date.now()}`,
    url: "https://checkout.stripe.test/s",
  })),
}));
vi.mock("stripe", () => ({
  default: class {
    customers = { create: async () => ({ id: `cus_${Math.random().toString(36).slice(2)}` }) };
    checkout = { sessions: { create: createSession } };
    webhooks = { constructEvent: (body: string) => JSON.parse(body) };
  },
}));

let stripe: typeof import("@/server/billing/stripe");
let db: typeof import("@/server/db").db;
let users: typeof import("@/server/db/schema").users;
let subscriptions: typeof import("@/server/db/schema").subscriptions;
let grantCompPlan: typeof import("@/server/billing/plans").grantCompPlan;
let getActivePlan: typeof import("@/server/billing/plans").getActivePlan;

beforeAll(async () => {
  stripe = await import("@/server/billing/stripe");
  ({ db } = await import("@/server/db"));
  ({ users, subscriptions } = await import("@/server/db/schema"));
  ({ grantCompPlan, getActivePlan } = await import("@/server/billing/plans"));
});

type LineItem = { price_data: { tax_behavior: string; recurring: unknown; product_data: { tax_code: string; metadata: Record<string, string> } } };

describe("Stripe Managed Payments", () => {
  it("abonamentul Pro e vândut prin Managed Payments, cu cod fiscal și TVA inclus în preț", async () => {
    const u = await createTestUser({ isProvider: true });
    await stripe.createPlanCheckout(u.id, "pro");
    const params = createSession.mock.calls.at(-1)![0] as { mode: string; managed_payments: unknown; line_items: LineItem[]; automatic_tax?: unknown };
    expect(params.mode).toBe("subscription");
    expect(params.managed_payments).toEqual({ enabled: true });
    const pd = params.line_items[0].price_data;
    expect(pd.product_data.tax_code).toBe("txcd_10103001");
    expect(pd.product_data.metadata.planId).toBe("pro");
    expect(pd.tax_behavior).toBe("inclusive");
    expect(pd.recurring).toEqual({ interval: "month" });
    expect(params.automatic_tax).toBeUndefined(); // nesuportat cu Managed Payments
  });

  it("planul Gratuit nu se poate cumpăra", async () => {
    const u = await createTestUser({ isProvider: true });
    await expect(stripe.createPlanCheckout(u.id, "free")).rejects.toMatchObject({ code: "plan" });
  });

  it("webhook-ul activează planul după preț și înlocuiește planul oferit de echipă", async () => {
    const u = await createTestUser({ isProvider: true });
    await grantCompPlan(u.id, "pro", 30);
    const now = Math.floor(Date.now() / 1000);
    const sub = {
      id: `sub_${Date.now()}`,
      status: "active",
      cancel_at_period_end: false,
      metadata: { userId: u.id, planId: "pro" },
      // Prestatorul a trecut pe Business din portal: contează prețul, nu metadata abonamentului.
      items: { data: [{ current_period_start: now, current_period_end: now + 30 * 86_400, price: { id: "price_x", metadata: { planId: "business" }, product: "prod_x" } }] },
    };
    await stripe.handleStripeWebhook(JSON.stringify({ id: `evt_${Date.now()}`, type: "customer.subscription.updated", data: { object: sub } }), "sig");
    const active = await getActivePlan(u.id);
    expect(active.plan.id).toBe("business");
    expect(active.comp).toBe(false);
    const rows = await db.select().from(subscriptions).where(eq(subscriptions.userId, u.id));
    expect(rows.filter((r) => r.status === "active")).toHaveLength(1);
  });

  it("customer.deleted (ștergere date din Link) dezleagă clientul Stripe de cont", async () => {
    const u = await createTestUser({ stripeCustomerId: "cus_sters_123" });
    const event = { id: `evt_${Date.now()}`, type: "customer.deleted", data: { object: { id: "cus_sters_123" } } };
    await stripe.handleStripeWebhook(JSON.stringify(event), "sig");
    const [after] = await db.select().from(users).where(eq(users.id, u.id));
    expect(after.stripeCustomerId).toBeNull();
  });
});
