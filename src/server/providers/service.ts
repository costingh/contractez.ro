import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { normalizeText, slugify } from "@/lib/text";
import { getCatalog } from "../catalog/taxonomy";
import { getLocality } from "../catalog/localities";
import { db } from "../db";
import { portfolioItems, providerCategories, providerProfiles, providerServices, providerSkills, skills, users } from "../db/schema";
import { DomainError } from "../errors";
import { enqueue } from "../queue";

export const providerProfileSchema = z.object({
  headline: z.string().trim().min(5, "Scrie un titlu scurt (ex: Electrician autorizat ANRE)").max(120),
  bio: z.string().trim().min(30, "Descrie-ți experiența în câteva propoziții").max(4_000),
  pricingModel: z.enum(["hourly", "fixed", "quote"]),
  hourlyRate: z.coerce.number().int().min(0).max(100_000).nullable().optional(),
  minProjectBudget: z.coerce.number().int().min(0).max(10_000_000).nullable().optional(),
  remote: z.boolean(),
  onSite: z.boolean(),
  travelRadiusKm: z.coerce.number().int().min(0).max(500).default(25),
  localityId: z.coerce.number().int().positive().nullable().optional(),
  yearsExperience: z.coerce.number().int().min(0).max(70).nullable().optional(),
  languages: z.array(z.string().min(2).max(5)).default(["ro"]),
  availability: z.enum(["available", "busy", "unavailable"]).default("available"),
  hoursPerWeek: z.coerce.number().int().min(1).max(80).nullable().optional(),
  websiteUrl: z.string().url("Link invalid").max(300).nullable().optional().or(z.literal("").transform(() => null)),
  certifications: z.string().max(1_000).nullable().optional(),
  categoryIds: z.array(z.coerce.number().int().positive()).min(1, "Alege cel puțin o categorie").max(8),
  skills: z.array(z.string().trim().min(2).max(60)).max(30).default([]),
  issuesInvoice: z.boolean(),
  legalEntity: z.enum(["none", "pfa", "ii", "srl", "other"]),
  companyName: z.string().trim().max(200).nullable().optional(),
  companyCui: z
    .string()
    .trim()
    .max(20)
    .regex(/^(RO)?\d{2,10}$/i, "CUI invalid")
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
});

export type ProviderProfileInput = z.infer<typeof providerProfileSchema>;

async function uniqueSlug(base: string, userId: string) {
  const root = slugify(base) || "prestator";
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? root : `${root}-${i + 1}`;
    const [taken] = await db
      .select({ id: providerProfiles.userId })
      .from(providerProfiles)
      .where(and(eq(providerProfiles.slug, slug), ne(providerProfiles.userId, userId)));
    if (!taken) return slug;
  }
  return `${root}-${userId.slice(0, 8)}`;
}

export async function refreshProviderSearchText(userId: string) {
  const catalog = await getCatalog();
  const [p] = await db.select().from(providerProfiles).where(eq(providerProfiles.userId, userId));
  if (!p) return;
  const [u] = await db.select({ name: users.name, companyName: users.companyName }).from(users).where(eq(users.id, userId));
  const cats = await db.select({ id: providerCategories.categoryId }).from(providerCategories).where(eq(providerCategories.providerId, userId));
  const sk = await db
    .select({ name: skills.name })
    .from(providerSkills)
    .innerJoin(skills, eq(skills.id, providerSkills.skillId))
    .where(eq(providerSkills.providerId, userId));
  const services = await db
    .select({ title: providerServices.title, description: providerServices.description })
    .from(providerServices)
    .where(eq(providerServices.providerId, userId));
  const loc = p.localityId ? await getLocality(p.localityId) : null;
  const text = normalizeText(
    [
      u?.name,
      u?.companyName,
      p.headline,
      p.bio,
      loc?.name,
      ...cats.map((c) => catalog.byId.get(c.id)?.name),
      ...sk.map((s) => s.name),
      ...services.flatMap((s) => [s.title, s.description]),
    ]
      .filter(Boolean)
      .join(" "),
  ).slice(0, 20_000);
  await db.update(providerProfiles).set({ searchText: text }).where(eq(providerProfiles.userId, userId));
}

/**
 * Datele firmei: dacă CUI-ul a fost confirmat la ANAF și nu s-a schimbat, păstrăm datele oficiale
 * (denumire, formă juridică). Dacă CUI-ul se schimbă sau dispare, verificarea se anulează.
 */
function companyFields(u: typeof users.$inferSelect, input: ProviderProfileInput) {
  const newCui = input.legalEntity === "none" ? null : (input.companyCui?.toUpperCase().replace(/^RO/, "").trim() || null);
  const stillVerified = Boolean(u.companyVerifiedAt && newCui && newCui === u.companyCui);
  if (stillVerified) {
    return { issuesInvoice: input.issuesInvoice, legalEntity: u.legalEntity, companyName: u.companyName, companyCui: u.companyCui };
  }
  return {
    issuesInvoice: input.issuesInvoice,
    legalEntity: input.legalEntity,
    companyName: input.legalEntity === "none" ? null : (input.companyName ?? null),
    companyCui: newCui,
    companyVerifiedAt: null,
  };
}

export async function saveProviderProfile(userId: string, raw: unknown) {
  const input = providerProfileSchema.parse(raw);
  if (!input.remote && !input.onSite) throw new DomainError("mode", "Alege dacă lucrezi remote, la fața locului sau ambele.");
  if (input.onSite && !input.localityId) throw new DomainError("locality", "Alege localitatea din care te deplasezi.");
  const catalog = await getCatalog();
  const categoryIds = input.categoryIds.filter((id) => catalog.byId.has(id));
  if (categoryIds.length === 0) throw new DomainError("category", "Alege cel puțin o categorie validă.");
  const loc = input.localityId ? await getLocality(input.localityId) : null;
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  if (!u) throw new DomainError("not_found", "Utilizator inexistent");

  const skillIds: number[] = [];
  for (const name of input.skills) {
    const slug = slugify(name);
    if (!slug) continue;
    await db.insert(skills).values({ slug, name, categoryId: categoryIds[0] }).onConflictDoNothing();
    const [s] = await db.select({ id: skills.id }).from(skills).where(eq(skills.slug, slug));
    if (s) skillIds.push(s.id);
  }

  await db.transaction(async (tx) => {
    const values = {
      headline: input.headline,
      bio: input.bio,
      pricingModel: input.pricingModel,
      hourlyRate: input.hourlyRate ?? null,
      minProjectBudget: input.minProjectBudget ?? null,
      remote: input.remote,
      onSite: input.onSite,
      travelRadiusKm: input.onSite ? input.travelRadiusKm : 0,
      localityId: loc?.id ?? null,
      lat: loc?.lat ?? null,
      lng: loc?.lng ?? null,
      yearsExperience: input.yearsExperience ?? null,
      languages: input.languages,
      availability: input.availability,
      hoursPerWeek: input.hoursPerWeek ?? null,
      websiteUrl: input.websiteUrl ?? null,
      certifications: input.certifications ?? null,
    };
    const [existing] = await tx.select({ slug: providerProfiles.slug }).from(providerProfiles).where(eq(providerProfiles.userId, userId));
    if (existing) await tx.update(providerProfiles).set(values).where(eq(providerProfiles.userId, userId));
    else await tx.insert(providerProfiles).values({ userId, slug: await uniqueSlug(u.name, userId), ...values });

    await tx.delete(providerCategories).where(eq(providerCategories.providerId, userId));
    await tx.insert(providerCategories).values(categoryIds.map((categoryId) => ({ providerId: userId, categoryId })));
    await tx.delete(providerSkills).where(eq(providerSkills.providerId, userId));
    if (skillIds.length) {
      await tx.insert(providerSkills).values([...new Set(skillIds)].map((skillId) => ({ providerId: userId, skillId }))).onConflictDoNothing();
    }
    await tx
      .update(users)
      .set({
        isProvider: true,
        ...companyFields(u, input),
        localityId: u.localityId ?? loc?.id ?? null,
        lat: u.lat ?? loc?.lat ?? null,
        lng: u.lng ?? loc?.lng ?? null,
      })
      .where(eq(users.id, userId));
  });
  await refreshProviderSearchText(userId);
  // Potriviri cu proiectele deja deschise (o dată pe oră, la salvări repetate).
  await enqueue("matching", { providerId: userId }, { jobId: `provider-match-${userId}-${Math.floor(Date.now() / 3_600_000)}`, delay: 5_000 });
  if (skillIds.length === 0) await enqueue("ai", { kind: "provider-skills", providerId: userId }, { jobId: `skills-${userId}-${Date.now()}` });
}

export const serviceSchema = z.object({
  categoryId: z.coerce.number().int().positive(),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2_000).default(""),
  priceFrom: z.coerce.number().int().min(0).max(10_000_000).nullable().optional(),
  priceUnit: z.enum(["hour", "project", "day", "sqm", "unit", "month"]),
});

export async function addService(userId: string, raw: unknown) {
  const input = serviceSchema.parse(raw);
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(providerServices).where(eq(providerServices.providerId, userId));
  if (n >= 20) throw new DomainError("limit", "Poți lista maximum 20 de servicii.");
  await db.insert(providerServices).values({ providerId: userId, ...input, priceFrom: input.priceFrom ?? null, sortOrder: n });
  await db.insert(providerCategories).values({ providerId: userId, categoryId: input.categoryId }).onConflictDoNothing();
  await refreshProviderSearchText(userId);
}

export async function deleteService(userId: string, serviceId: string) {
  await db.delete(providerServices).where(and(eq(providerServices.id, serviceId), eq(providerServices.providerId, userId)));
  await refreshProviderSearchText(userId);
}

export const portfolioSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(1_000).default(""),
  url: z.string().url("Link invalid").max(400).nullable().optional().or(z.literal("").transform(() => null)),
});

export async function addPortfolioItem(userId: string, raw: unknown, imagePath: string | null) {
  const input = portfolioSchema.parse(raw);
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(portfolioItems).where(eq(portfolioItems.providerId, userId));
  if (n >= 30) throw new DomainError("limit", "Poți adăuga maximum 30 de lucrări în portofoliu.");
  await db.insert(portfolioItems).values({ providerId: userId, ...input, url: input.url ?? null, imagePath, sortOrder: n });
}

export async function deletePortfolioItem(userId: string, itemId: string) {
  await db.delete(portfolioItems).where(and(eq(portfolioItems.id, itemId), eq(portfolioItems.providerId, userId)));
}

/** Reîmprospătează rating-ul și numărul de colaborări finalizate. */
export async function refreshProviderStats(userId: string) {
  await db.execute(sql`
    UPDATE provider_profiles SET
      rating_avg = (SELECT avg(rating)::float8 FROM reviews WHERE target_id = ${userId} AND NOT hidden_by_admin),
      rating_count = (SELECT count(*)::int FROM reviews WHERE target_id = ${userId} AND NOT hidden_by_admin),
      completed_count = (SELECT count(*)::int FROM collaborations WHERE provider_id = ${userId} AND status = 'completed')
    WHERE user_id = ${userId}`);
}

/** Timpul mediu de răspuns: primul mesaj al prestatorului după un mesaj al clientului (ultimele 90 zile). */
export async function refreshResponseTimes() {
  await db.execute(sql`
    WITH firsts AS (
      SELECT c.provider_id,
        EXTRACT(EPOCH FROM (
          (SELECT min(m2.created_at) FROM messages m2 WHERE m2.conversation_id = c.id AND m2.sender_id = c.provider_id AND m2.created_at > m1.created_at)
          - m1.created_at)) / 60 AS minutes
      FROM conversations c
      JOIN LATERAL (
        SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id AND m.sender_id = c.client_id ORDER BY m.created_at LIMIT 1
      ) m1 ON true
      WHERE c.created_at > now() - interval '90 days'
    )
    UPDATE provider_profiles pp SET response_time_minutes = sub.avg_minutes
    FROM (SELECT provider_id, round(avg(minutes))::int AS avg_minutes FROM firsts WHERE minutes IS NOT NULL GROUP BY provider_id) sub
    WHERE pp.user_id = sub.provider_id`);
}
