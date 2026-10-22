import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { randomToken } from "./auth/crypto";
import { getLocality } from "./catalog/localities";
import { cancelAllSubscriptions } from "./billing/stripe";
import { db } from "./db";
import {
  applications,
  autoBidExecutions,
  messages,
  notificationPreferences,
  portfolioItems,
  projects,
  providerProfiles,
  providerServices,
  reviews,
  sessions,
  subscriptions,
  users,
} from "./db/schema";
import { DomainError } from "./errors";
import { deleteUpload } from "./uploads";

/* --------------------------- Informații de bază --------------------------- */

export const basicInfoSchema = z.object({
  name: z.string().trim().min(2, "Scrie-ți numele").max(80),
  localityId: z.coerce.number().int().positive().nullable().optional(),
});

/**
 * `avatar`: `undefined` = neschimbat, `null` = eliminat, funcție = salvează fotografia nouă. Funcția e apelată
 * abia după validarea datelor, ca un formular invalid să nu lase fișiere orfane. Fotografia veche se șterge.
 */
export async function updateBasicInfo(userId: string, raw: unknown, avatar?: null | (() => Promise<string>)) {
  const input = basicInfoSchema.parse(raw);
  const loc = input.localityId ? await getLocality(input.localityId) : null;
  const avatarPath = typeof avatar === "function" ? await avatar() : avatar;
  let previous: string | null = null;
  try {
    previous = await db.transaction(async (tx) => {
      const [old] = await tx.select({ avatarPath: users.avatarPath }).from(users).where(eq(users.id, userId)).for("update");
      await tx
        .update(users)
        .set({
          name: input.name,
          localityId: loc?.id ?? null,
          lat: loc?.lat ?? null,
          lng: loc?.lng ?? null,
          ...(avatarPath !== undefined ? { avatarPath } : {}),
        })
        .where(eq(users.id, userId));
      return old?.avatarPath ?? null;
    });
  } catch (err) {
    if (avatarPath) await deleteUpload(avatarPath);
    throw err;
  }
  if (avatarPath !== undefined && previous && previous !== avatarPath) await deleteUpload(previous);
}

export async function setProfilePublic(userId: string, isPublic: boolean) {
  await db.update(providerProfiles).set({ isPublic }).where(eq(providerProfiles.userId, userId));
}

/* ------------------------------ Preferințe ------------------------------ */

export const preferencesSchema = z.object({
  matchFrequency: z.enum(["instant", "daily", "weekly", "off"]),
  messagesEmail: z.boolean(),
  applicationUpdatesEmail: z.boolean(),
  autoBidEmail: z.boolean(),
  productEmail: z.boolean(),
  minMatchScore: z.coerce.number().int().min(30).max(100),
});

export async function savePreferences(userId: string, raw: unknown) {
  const input = preferencesSchema.parse(raw);
  await db
    .insert(notificationPreferences)
    .values({ userId, ...input })
    .onConflictDoUpdate({ target: notificationPreferences.userId, set: input });
}

/* ------------------------------- Recomandări ------------------------------- */

export async function ensureReferralCode(userId: string): Promise<string> {
  const [u] = await db.select({ code: users.referralCode }).from(users).where(eq(users.id, userId));
  if (u?.code) return u.code;
  for (let i = 0; i < 5; i++) {
    const code = randomToken(6).replace(/[-_]/g, "x").slice(0, 8).toLowerCase();
    try {
      await db.update(users).set({ referralCode: code }).where(and(eq(users.id, userId), isNull(users.referralCode)));
      const [again] = await db.select({ code: users.referralCode }).from(users).where(eq(users.id, userId));
      if (again?.code) return again.code;
    } catch {
      /* coliziune pe indexul unic — reîncercăm */
    }
  }
  throw new DomainError("referral", "Nu am putut genera codul de recomandare.");
}

export async function referralStats(userId: string) {
  const [r] = await db
    .select({
      invited: sql<number>`count(*)::int`,
      verified: sql<number>`count(*) FILTER (WHERE ${users.welcomeCreditsGrantedAt} IS NOT NULL)::int`,
    })
    .from(users)
    .where(eq(users.referredById, userId));
  return r ?? { invited: 0, verified: 0 };
}

/* --------------------------------- GDPR --------------------------------- */

/** Exportul datelor personale (dreptul de acces / portabilitate). */
export async function exportAccountData(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) throw new DomainError("not_found", "Utilizator inexistent");
  const { passwordHash: _omit, ...safeUser } = user;
  void _omit;
  const [profile] = await db.select().from(providerProfiles).where(eq(providerProfiles.userId, userId));
  const [prefs] = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId));
  const [services, portfolio, myProjects, myApplications, sentMessages, plans, writtenReviews, autoBids] = await Promise.all([
    db.select().from(providerServices).where(eq(providerServices.providerId, userId)),
    db.select().from(portfolioItems).where(eq(portfolioItems.providerId, userId)),
    db.select().from(projects).where(eq(projects.clientId, userId)),
    db.select().from(applications).where(eq(applications.providerId, userId)),
    db
      .select({ id: messages.id, conversationId: messages.conversationId, body: messages.body, attachmentName: messages.attachmentName, createdAt: messages.createdAt })
      .from(messages)
      .where(eq(messages.senderId, userId))
      .orderBy(desc(messages.createdAt)),
    db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).orderBy(desc(subscriptions.createdAt)),
    db.select().from(reviews).where(eq(reviews.authorId, userId)),
    db.select().from(autoBidExecutions).where(eq(autoBidExecutions.providerId, userId)),
  ]);
  const { searchVector: _sv, ...safeProfile } = profile ?? ({} as Record<string, unknown>);
  void _sv;
  return {
    exportedAt: new Date().toISOString(),
    user: safeUser,
    providerProfile: profile ? safeProfile : null,
    notificationPreferences: prefs ?? null,
    services,
    portfolio,
    projects: myProjects.map((p) => {
      const { searchVector, ...rest } = p;
      void searchVector;
      return rest;
    }),
    applications: myApplications,
    messagesSent: sentMessages,
    subscriptions: plans,
    reviewsWritten: writtenReviews,
    autoBidExecutions: autoBids,
  };
}

/**
 * Ștergere cont (soft delete + anonimizare). Păstrăm înregistrările necesare pentru
 * evidența financiară și integritatea conversațiilor, dar eliminăm datele de identificare.
 */
export async function deleteAccount(userId: string) {
  await cancelAllSubscriptions(userId);
  const files = await db.transaction(async (tx) => {
    // Fișierele publice (avatar, copertă, portofoliu) se șterg de pe disc după tranzacție.
    const [u] = await tx.select({ avatarPath: users.avatarPath }).from(users).where(eq(users.id, userId)).for("update");
    const [profile] = await tx.select({ coverPath: providerProfiles.coverPath }).from(providerProfiles).where(eq(providerProfiles.userId, userId));
    const portfolio = await tx.delete(portfolioItems).where(eq(portfolioItems.providerId, userId)).returning({ imagePath: portfolioItems.imagePath });
    await tx.delete(providerServices).where(eq(providerServices.providerId, userId));
    await tx
      .update(users)
      .set({
        deletedAt: new Date(),
        email: `deleted-${userId}@deleted.local`,
        name: "Cont șters",
        phone: null,
        phoneVerifiedAt: null,
        avatarPath: null,
        companyName: null,
        companyCui: null,
        referralCode: null,
      })
      .where(eq(users.id, userId));
    await tx.update(providerProfiles).set({ isPublic: false, bio: "", headline: "", websiteUrl: null, socialLinks: {}, coverPath: null, searchText: "" }).where(eq(providerProfiles.userId, userId));
    await tx
      .update(projects)
      .set({ status: "cancelled", closedAt: new Date() })
      .where(and(eq(projects.clientId, userId), inArray(projects.status, ["draft", "pending_review", "open"])));
    const withdrawn = await tx
      .update(applications)
      .set({ status: "withdrawn", decidedAt: new Date() })
      .where(and(eq(applications.providerId, userId), inArray(applications.status, ["submitted", "viewed", "shortlisted"])))
      .returning({ projectId: applications.projectId, isAuto: applications.isAuto });
    // Aplicările retrase eliberează locurile ocupate în proiectele respective.
    const freed = new Map<string, { all: number; auto: number }>();
    for (const a of withdrawn) {
      const f = freed.get(a.projectId) ?? { all: 0, auto: 0 };
      f.all += 1;
      if (a.isAuto) f.auto += 1;
      freed.set(a.projectId, f);
    }
    for (const [projectId, f] of freed) {
      await tx
        .update(projects)
        .set({
          applicationsCount: sql`greatest(${projects.applicationsCount} - ${f.all}, 0)`,
          autoApplicationsCount: sql`greatest(${projects.autoApplicationsCount} - ${f.auto}, 0)`,
        })
        .where(eq(projects.id, projectId));
    }
    await tx.delete(sessions).where(eq(sessions.userId, userId));
    return [u?.avatarPath, profile?.coverPath, ...portfolio.map((p) => p.imagePath)];
  });
  await Promise.all(files.map((f) => deleteUpload(f)));
}

/* ------------------------- Date pentru formulare ------------------------- */

/** Valorile curente ale profilului de prestator, pentru formularul de editare. */
export async function getProviderFormData(userId: string) {
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  if (!u) return null;
  const [p] = await db.select().from(providerProfiles).where(eq(providerProfiles.userId, userId));
  const cats = (await db.execute(sql`SELECT category_id FROM provider_categories WHERE provider_id = ${userId}`)) as unknown as { category_id: number }[];
  const sk = (await db.execute(
    sql`SELECT s.name FROM provider_skills ps JOIN skills s ON s.id = ps.skill_id WHERE ps.provider_id = ${userId} ORDER BY s.name`,
  )) as unknown as { name: string }[];
  const locId = p?.localityId ?? u.localityId;
  const loc = locId ? await getLocality(locId) : null;
  return {
    exists: Boolean(p),
    slug: p?.slug ?? null,
    isPublic: p?.isPublic ?? true,
    coverPath: p?.coverPath ?? null,
    initial: {
      headline: p?.headline ?? "",
      bio: p?.bio ?? "",
      pricingModel: p?.pricingModel ?? ("hourly" as const),
      hourlyRate: p?.hourlyRate ?? null,
      minProjectBudget: p?.minProjectBudget ?? null,
      remote: p?.remote ?? true,
      onSite: p?.onSite ?? false,
      travelRadiusKm: p?.travelRadiusKm || 25,
      locality: loc ? { id: loc.id, name: loc.name, county: loc.county, countyCode: loc.countyCode } : null,
      yearsExperience: p?.yearsExperience ?? null,
      languages: p?.languages ?? ["ro"],
      availability: p?.availability ?? ("available" as const),
      hoursPerWeek: p?.hoursPerWeek ?? null,
      websiteUrl: p?.websiteUrl ?? null,
      socialLinks: p?.socialLinks ?? {},
      certifications: p?.certifications ?? null,
      categoryIds: cats.map((c) => c.category_id),
      skills: sk.map((s) => s.name),
      issuesInvoice: u.issuesInvoice,
      legalEntity: u.legalEntity,
      companyName: u.companyName,
      companyCui: u.companyCui,
    },
  };
}
