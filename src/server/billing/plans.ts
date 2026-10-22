import { and, desc, eq, gte, inArray, isNull, ne, sql } from "drizzle-orm";
import { freePlan, getPlan, type Plan, type PlanId } from "@/config/site";
import { db, type DbOrTx, type Tx } from "../db";
import { applications, events, providerProfiles, subscriptions, type Subscription } from "../db/schema";
import { DomainError } from "../errors";

/*
 * Abonamentele prestatorilor. Reguli:
 *  - un singur plan activ contează: cel mai recent abonament activ (plătit prin Stripe sau oferit de echipă);
 *  - limita lunară se calculează din aplicările trimise în perioada curentă (fără cele restituite),
 *    deci nu există solduri care să se poată desincroniza;
 *  - perioada: luna calendaristică (ora României) pentru Gratuit și pentru planurile oferite de echipă,
 *    perioada de facturare pentru abonamentele Stripe;
 *  - aplicările concurente ale aceluiași prestator sunt serializate cu un advisory lock (vezi `lockUsage`).
 */

/** Toleranță pentru webhook-ul de reînnoire întârziat: abonamentul Stripe rămâne valabil încă 2 zile. */
const STRIPE_GRACE_MS = 2 * 86_400_000;

export type ActivePlan = {
  plan: Plan;
  subscription: Subscription | null;
  /** Plan oferit de echipă (fără plată Stripe). */
  comp: boolean;
  /** Fereastra în care se numără aplicările (limita „lunară”). */
  periodStart: Date;
  periodEnd: Date;
  /** Până când e valabil planul plătit sau oferit (null pentru Gratuit). Pentru planurile oferite diferă de `periodEnd`. */
  planEndsAt: Date | null;
};

export type PlanUsage = ActivePlan & { used: number; limit: number; remaining: number };

/** Cât timp după pornirea unei plăți afișăm „Plata este în curs de confirmare” (webhook-ul Stripe vine de obicei în secunde). */
export const CHECKOUT_PENDING_MINUTES = 30;

/** A pornit utilizatorul o plată (Stripe Checkout) în ultimele minute? Folosit pentru mesajul de la întoarcerea din Stripe. */
export async function hasRecentCheckout(userId: string, minutes = CHECKOUT_PENDING_MINUTES): Promise<boolean> {
  const [row] = await db
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.name, "checkout.started"), eq(events.userId, userId), gte(events.createdAt, new Date(Date.now() - minutes * 60_000))))
    .limit(1);
  return Boolean(row);
}

export async function activeSubscription(userId: string, conn: DbOrTx = db): Promise<Subscription | null> {
  const rows = await conn
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), inArray(subscriptions.status, ["active", "past_due"])))
    .orderBy(desc(subscriptions.createdAt));
  const now = Date.now();
  for (const sub of rows) {
    if (!getPlan(sub.planId)) continue;
    if (!sub.currentPeriodEnd) return sub;
    const grace = sub.stripeSubscriptionId ? STRIPE_GRACE_MS : 0;
    if (sub.currentPeriodEnd.getTime() + grace > now) return sub;
  }
  return null;
}

async function calendarMonth(conn: DbOrTx) {
  const [r] = (await conn.execute(sql`
    SELECT (date_trunc('month', now() AT TIME ZONE 'Europe/Bucharest') AT TIME ZONE 'Europe/Bucharest') AS start,
           ((date_trunc('month', now() AT TIME ZONE 'Europe/Bucharest') + interval '1 month') AT TIME ZONE 'Europe/Bucharest') AS end`)) as unknown as {
    start: string | Date;
    end: string | Date;
  }[];
  return { start: new Date(r.start), end: new Date(r.end) };
}

/**
 * Fereastra de numărare pentru un plan oferit de echipă (până la 366 de zile): limita rămâne lunară, deci
 * numărăm pe luna calendaristică (ora României), restrânsă la durata planului. Astfel aplicările trimise
 * înainte de acordarea planului nu se socotesc, iar „se reînnoiește pe” nu depășește finalul planului.
 */
export function usageWindow(month: { start: Date; end: Date }, sub: Pick<Subscription, "currentPeriodStart" | "currentPeriodEnd">) {
  const start = sub.currentPeriodStart && sub.currentPeriodStart > month.start ? sub.currentPeriodStart : month.start;
  const end = sub.currentPeriodEnd && sub.currentPeriodEnd < month.end ? sub.currentPeriodEnd : month.end;
  return { periodStart: start, periodEnd: end };
}

export async function getActivePlan(userId: string, conn: DbOrTx = db): Promise<ActivePlan> {
  const sub = await activeSubscription(userId, conn);
  const plan = sub ? getPlan(sub.planId) : undefined;
  if (sub && plan) {
    const comp = !sub.stripeSubscriptionId;
    if (!comp && sub.currentPeriodStart && sub.currentPeriodEnd) {
      return { plan, subscription: sub, comp, periodStart: sub.currentPeriodStart, periodEnd: sub.currentPeriodEnd, planEndsAt: sub.currentPeriodEnd };
    }
    return { plan, subscription: sub, comp, planEndsAt: sub.currentPeriodEnd, ...usageWindow(await calendarMonth(conn), sub) };
  }
  const month = await calendarMonth(conn);
  return { plan: freePlan, subscription: null, comp: false, periodStart: month.start, periodEnd: month.end, planEndsAt: null };
}

export async function applicationsUsedSince(userId: string, since: Date, conn: DbOrTx = db) {
  const [r] = await conn
    .select({ n: sql<number>`count(*)::int` })
    .from(applications)
    .where(and(eq(applications.providerId, userId), gte(applications.createdAt, since), ne(applications.status, "refunded")));
  return r?.n ?? 0;
}

export async function getPlanUsage(userId: string, conn: DbOrTx = db): Promise<PlanUsage> {
  const active = await getActivePlan(userId, conn);
  const used = await applicationsUsedSince(userId, active.periodStart, conn);
  const limit = active.plan.monthlyApplications;
  return { ...active, used, limit, remaining: Math.max(0, limit - used) };
}

/** Serializează verificarea limitei pentru același prestator până la finalul tranzacției. */
export async function lockUsage(tx: Tx, userId: string) {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`plan-usage:${userId}`}, 0))`);
}

/**
 * Sincronizează avantajele vizibile ale planului cu profilul: Business = profil promovat + „Recomandat”
 * până la finalul perioadei. Apelat la fiecare schimbare de abonament.
 */
export async function syncPlanPerks(userId: string) {
  const { plan, periodEnd, planEndsAt } = await getActivePlan(userId);
  const until = plan.promotedProfile ? (planEndsAt ?? periodEnd) : null;
  await db.update(providerProfiles).set({ boostedUntil: until, featuredUntil: until }).where(eq(providerProfiles.userId, userId));
}

/**
 * Plan oferit de echipă (recomandare, beta, compensație), fără plată. Dacă există deja un plan oferit,
 * activ, pentru același plan, îl prelungim. Nu înlocuiește un abonament plătit.
 */
export async function grantCompPlan(userId: string, planId: PlanId, days: number) {
  const plan = getPlan(planId);
  if (!plan || plan.priceLei === 0) throw new DomainError("plan", "Alege un plan plătit (Pro sau Business).");
  if (!Number.isInteger(days) || days < 1 || days > 366) throw new DomainError("days", "Alege între 1 și 366 de zile.");
  const current = await activeSubscription(userId);
  if (current?.stripeSubscriptionId) return { granted: false as const, reason: "paid" as const };

  const ms = days * 86_400_000;
  if (current && current.planId === planId && current.currentPeriodEnd) {
    await db
      .update(subscriptions)
      .set({ currentPeriodEnd: new Date(current.currentPeriodEnd.getTime() + ms), updatedAt: new Date() })
      .where(eq(subscriptions.id, current.id));
  } else {
    if (current) await db.update(subscriptions).set({ status: "canceled", updatedAt: new Date() }).where(eq(subscriptions.id, current.id));
    const now = new Date();
    await db.insert(subscriptions).values({ userId, planId, status: "active", currentPeriodStart: now, currentPeriodEnd: new Date(now.getTime() + ms) });
  }
  await syncPlanPerks(userId);
  return { granted: true as const };
}

/** Anulează planurile oferite de echipă (nu atinge abonamentele plătite). */
export async function revokeCompPlans(userId: string) {
  const rows = await db
    .update(subscriptions)
    .set({ status: "canceled", updatedAt: new Date() })
    .where(and(eq(subscriptions.userId, userId), isNull(subscriptions.stripeSubscriptionId), eq(subscriptions.status, "active")))
    .returning({ id: subscriptions.id });
  await syncPlanPerks(userId);
  return rows.length;
}
