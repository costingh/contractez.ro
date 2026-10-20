import { and, eq, inArray, sql } from "drizzle-orm";
import Stripe from "stripe";
import { getPlan, type Plan } from "@/config/site";
import { track } from "../analytics";
import { db } from "../db";
import { stripeEvents, subscriptions, users } from "../db/schema";
import { env, features } from "../env";
import { DomainError } from "../errors";
import { notify } from "../notifications";
import { syncPlanPerks } from "./plans";

/*
 * Stripe vinde DOAR abonamentele prestatorilor (Pro, Business). Fără Connect: nu transferăm bani către
 * prestatori. Reguli:
 *  - planul se activează exclusiv din webhook (checkout.session.completed, customer.subscription.*),
 *    niciodată din pagina de succes;
 *  - fiecare eveniment Stripe este procesat o singură dată (tabela stripe_events);
 *  - planul se deduce din prețul abonamentului (STRIPE_PRICE_PRO/BUSINESS) sau din metadata, ca schimbările
 *    de plan făcute din portalul de facturare să fie preluate corect.
 *
 * Cu STRIPE_MANAGED_PAYMENTS=true, Stripe (prin Link) e vânzătorul oficial (merchant of record):
 * calculează și virează TVA-ul, trimite chitanțele/facturile și gestionează disputele. Noi doar
 * marcăm sesiunea și dăm produsului un cod fiscal eligibil (STRIPE_TAX_CODE). Prețurile din aplicație
 * sunt finale (TVA inclus), de aceea tax_behavior = "inclusive".
 */

let stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) throw new DomainError("payments_off", "Plățile nu sunt configurate.");
  stripe ??= new Stripe(env.STRIPE_SECRET_KEY, { maxNetworkRetries: 2, appInfo: { name: env.APP_NAME } });
  return stripe;
}

function assertPaymentsEnabled() {
  if (!features.payments) {
    throw new DomainError("payments_off", "Plățile nu sunt încă active. În beta, planul Gratuit îți oferă aplicări lunare fără cost.");
  }
}

async function ensureCustomer(userId: string) {
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  if (!u) throw new DomainError("not_found", "Utilizator inexistent");
  if (u.stripeCustomerId) return u.stripeCustomerId;
  const customer = await getStripe().customers.create(
    { email: u.email, name: u.companyName ?? u.name, metadata: { userId } },
    { idempotencyKey: `customer-${userId}` },
  );
  await db.update(users).set({ stripeCustomerId: customer.id }).where(eq(users.id, userId));
  return customer.id;
}

const INTEGRATION_ID = "prestio_plans_wpxtlnse";

function managedPayments(): Pick<Stripe.Checkout.SessionCreateParams, "managed_payments"> {
  return features.managedPayments ? { managed_payments: { enabled: true } } : {};
}

function priceIdFor(plan: Plan) {
  return { pro: env.STRIPE_PRICE_PRO, business: env.STRIPE_PRICE_BUSINESS, free: undefined }[plan.id];
}

function planPrice(plan: Plan): Stripe.Checkout.SessionCreateParams.LineItem {
  const priceId = priceIdFor(plan);
  if (priceId) return { price: priceId, quantity: 1 };
  return {
    quantity: 1,
    price_data: {
      currency: "ron",
      unit_amount: plan.priceLei * 100,
      tax_behavior: "inclusive",
      recurring: { interval: "month" },
      product_data: { name: `${env.APP_NAME} ${plan.name}`, tax_code: env.STRIPE_TAX_CODE, metadata: { planId: plan.id } },
    },
  };
}

export async function createPlanCheckout(userId: string, planId: string) {
  assertPaymentsEnabled();
  const plan = getPlan(planId);
  if (!plan || plan.priceLei === 0) throw new DomainError("plan", "Planul nu este disponibil.");
  const [paid] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), inArray(subscriptions.status, ["active", "past_due"]), sql`${subscriptions.stripeSubscriptionId} IS NOT NULL`));
  if (paid) throw new DomainError("active", "Ai deja un abonament. Schimbă planul sau anulează-l din „Gestionează abonamentul”.");
  const customer = await ensureCustomer(userId);
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [planPrice(plan)],
    metadata: { kind: "plan", planId: plan.id, userId },
    subscription_data: { metadata: { kind: "plan", planId: plan.id, userId } },
    success_url: `${env.APP_URL}/abonament?plata=succes`,
    cancel_url: `${env.APP_URL}/abonament?plata=anulata`,
    integration_identifier: INTEGRATION_ID,
    locale: "ro",
    ...managedPayments(),
  });
  await track("checkout.started", userId, { planId });
  return session.url!;
}

/** La ștergerea contului: oprim imediat abonamentele plătite (fără facturi viitoare) și planurile oferite. */
export async function cancelAllSubscriptions(userId: string) {
  const rows = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), inArray(subscriptions.status, ["active", "past_due", "incomplete"])));
  for (const s of rows) {
    if (s.stripeSubscriptionId) {
      try {
        await getStripe().subscriptions.cancel(s.stripeSubscriptionId);
      } catch (err) {
        const missing = err instanceof Stripe.errors.StripeInvalidRequestError && err.code === "resource_missing";
        if (!missing) throw new DomainError("stripe", "Nu am putut anula abonamentul. Încearcă din nou peste câteva minute.");
      }
    }
    await db.update(subscriptions).set({ status: "canceled", updatedAt: new Date() }).where(eq(subscriptions.id, s.id));
  }
}

export async function createBillingPortal(userId: string) {
  const customer = await ensureCustomer(userId);
  const session = await getStripe().billingPortal.sessions.create({ customer, return_url: `${env.APP_URL}/abonament` });
  return session.url;
}

/* -------------------------------- Webhook -------------------------------- */

export async function handleStripeWebhook(rawBody: string, signature: string | null) {
  if (!env.STRIPE_WEBHOOK_SECRET) throw new Error("STRIPE_WEBHOOK_SECRET lipsește");
  if (!signature) throw new DomainError("signature", "Semnătură lipsă");
  const event = getStripe().webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);

  const [fresh] = await db.insert(stripeEvents).values({ id: event.id, type: event.type }).onConflictDoNothing().returning();
  if (!fresh) {
    const [prev] = await db.select().from(stripeEvents).where(eq(stripeEvents.id, event.id));
    if (prev?.processedAt) return { duplicate: true };
  }
  try {
    await processEvent(event);
    await db.update(stripeEvents).set({ processedAt: new Date(), error: null }).where(eq(stripeEvents.id, event.id));
  } catch (err) {
    await db.update(stripeEvents).set({ error: (err as Error).message.slice(0, 1_000) }).where(eq(stripeEvents.id, event.id));
    throw err; // Stripe va reîncerca
  }
  return { duplicate: false };
}

async function processEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object;
      if (s.metadata?.kind === "plan" && s.subscription) {
        const subId = typeof s.subscription === "string" ? s.subscription : s.subscription.id;
        await syncSubscription(await getStripe().subscriptions.retrieve(subId));
      }
      break;
    }
    case "customer.deleted":
      // Ex: clientul cere ștergerea datelor din Link → Stripe șterge Customer-ul; la următoarea plată creăm altul.
      await db.update(users).set({ stripeCustomerId: null }).where(eq(users.stripeCustomerId, event.data.object.id));
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(event.data.object);
      break;
    default:
      break;
  }
}

function mapStatus(s: Stripe.Subscription.Status): "incomplete" | "active" | "past_due" | "canceled" {
  if (s === "active" || s === "trialing") return "active";
  if (s === "past_due" || s === "unpaid") return "past_due";
  if (s === "canceled" || s === "incomplete_expired") return "canceled";
  return "incomplete";
}

/** Planul unui abonament: după prețul configurat, apoi după metadata prețului/produsului/abonamentului. */
function planOf(sub: Stripe.Subscription) {
  const item = sub.items.data[0];
  const priceId = item?.price.id;
  if (priceId && priceId === env.STRIPE_PRICE_PRO) return getPlan("pro");
  if (priceId && priceId === env.STRIPE_PRICE_BUSINESS) return getPlan("business");
  const product = item?.price.product;
  const productPlan = product && typeof product === "object" && "metadata" in product ? product.metadata?.planId : undefined;
  return getPlan(item?.price.metadata?.planId ?? productPlan ?? sub.metadata?.planId);
}

async function syncSubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata?.userId;
  const plan = planOf(sub);
  if (!userId || !plan) return;
  const [before] = await db.select().from(subscriptions).where(eq(subscriptions.stripeSubscriptionId, sub.id));
  const item = sub.items.data[0];
  const values = {
    userId,
    planId: plan.id,
    status: mapStatus(sub.status),
    stripeSubscriptionId: sub.id,
    currentPeriodStart: item ? new Date(item.current_period_start * 1000) : null,
    currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  };
  await db
    .insert(subscriptions)
    .values(values)
    .onConflictDoUpdate({ target: subscriptions.stripeSubscriptionId, set: { ...values, updatedAt: sql`now()` } });
  if (values.status === "active") {
    // Un abonament plătit înlocuiește planurile oferite de echipă.
    await db
      .update(subscriptions)
      .set({ status: "canceled", updatedAt: new Date() })
      .where(and(eq(subscriptions.userId, userId), sql`${subscriptions.stripeSubscriptionId} IS NULL`, eq(subscriptions.status, "active")));
  }
  await syncPlanPerks(userId);

  const activated = values.status === "active" && (before?.status !== "active" || before.planId !== plan.id);
  if (activated) {
    await notify({
      userId,
      type: "plan.activated",
      title: `Planul ${plan.name} este activ`,
      body: `Ai ${plan.monthlyApplications} aplicări pe lună${plan.autoBid ? " și Auto Bid" : ""}.`,
      link: "/abonament",
      dedupeKey: `plan-active:${sub.id}:${plan.id}`,
      email: {
        kind: "system",
        subject: `Planul ${plan.name} este activ`,
        blocks: [{ type: "p", text: `Mulțumim! Ai acum ${plan.monthlyApplications} aplicări pe lună${plan.autoBid ? ", Auto Bid" : ""} și toate avantajele planului ${plan.name}.` }],
      },
    });
    await track("plan.activated", userId, { planId: plan.id });
  }
}
