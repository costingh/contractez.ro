import { and, desc, eq, gt, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { normalizeText } from "@/lib/text";
import { expandCategory, getCatalog } from "../catalog/taxonomy";
import { getLocality } from "../catalog/localities";
import { db } from "../db";
import { localities, providerProfiles, users } from "../db/schema";

const num = z.coerce.number().int().positive().optional().catch(undefined);
const flag = z.literal("1").optional().catch(undefined);

export const providerFiltersSchema = z.object({
  q: z.string().trim().max(200).optional().catch(undefined),
  ai: z.string().trim().max(400).optional().catch(undefined),
  cat: num,
  loc: num,
  r: z.coerce.number().int().min(1).max(500).optional().catch(undefined),
  remote: flag,
  onsite: flag,
  inv: z.enum(["yes", "no"]).optional().catch(undefined),
  le: z.enum(["company", "pfa", "srl", "none"]).optional().catch(undefined),
  rate: num,
  budget: num,
  rating: z.coerce.number().min(1).max(5).optional().catch(undefined),
  avail: flag,
  lang: z.string().max(5).optional().catch(undefined),
  portfolio: flag,
  done: flag,
  fast: flag,
  anaf: flag,
  sort: z.enum(["relevance", "rating", "rate", "distance", "response", "experience"]).default("relevance").catch("relevance"),
  page: z.coerce.number().int().min(1).max(100).default(1).catch(1),
});
export type ProviderFilters = z.infer<typeof providerFiltersSchema>;

export function parseProviderFilters(params: Record<string, string | string[] | undefined>): ProviderFilters {
  const flat = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  return providerFiltersSchema.parse(flat);
}

const PAGE_SIZE = 20;

function buildWhere(filters: ProviderFilters, catalog: Awaited<ReturnType<typeof getCatalog>>, originGeo: SQL | null) {
  const where: (SQL | undefined)[] = [
    eq(users.isProvider, true),
    sql`${users.onboardedAt} IS NOT NULL`,
    sql`${users.emailVerifiedAt} IS NOT NULL`,
    sql`${users.bannedAt} IS NULL`,
    sql`${users.deletedAt} IS NULL`,
    eq(providerProfiles.isPublic, true),
  ];
  const q = filters.q ? normalizeText(filters.q) : "";
  if (q) where.push(sql`(${providerProfiles.searchVector} @@ plainto_tsquery('simple', ${q}) OR ${providerProfiles.searchText} ILIKE ${"%" + q + "%"})`);
  if (filters.cat) {
    const ids = expandCategory(catalog, filters.cat);
    where.push(sql`EXISTS (SELECT 1 FROM provider_categories pc WHERE pc.provider_id = ${providerProfiles.userId} AND pc.category_id IN ${ids})`);
  }
  if (filters.remote && !filters.onsite) where.push(eq(providerProfiles.remote, true));
  if (filters.onsite) where.push(eq(providerProfiles.onSite, true));
  if (originGeo && filters.r) {
    // Prestatorul trebuie să fie în raza cerută ȘI să accepte deplasarea până acolo; remote-ul e acceptat doar dacă nu se cere prezență fizică.
    const local = sql`(${providerProfiles.onSite} AND ST_DWithin(${providerProfiles.geo}, ${originGeo}, LEAST(${filters.r}, ${providerProfiles.travelRadiusKm}) * 1000))`;
    where.push(filters.onsite ? local : sql`(${local} OR ${providerProfiles.remote})`);
  }
  if (filters.inv === "yes") where.push(eq(users.issuesInvoice, true));
  if (filters.inv === "no") where.push(eq(users.issuesInvoice, false));
  if (filters.le === "company") where.push(sql`${users.legalEntity} IN ('pfa','ii','srl','other')`);
  if (filters.le === "pfa") where.push(sql`${users.legalEntity} IN ('pfa','ii')`);
  if (filters.le === "srl") where.push(eq(users.legalEntity, "srl"));
  if (filters.le === "none") where.push(eq(users.legalEntity, "none"));
  if (filters.rate) where.push(sql`(${providerProfiles.hourlyRate} IS NULL OR ${providerProfiles.hourlyRate} <= ${filters.rate})`);
  if (filters.budget) where.push(sql`(${providerProfiles.minProjectBudget} IS NULL OR ${providerProfiles.minProjectBudget} <= ${filters.budget})`);
  if (filters.rating) where.push(sql`${providerProfiles.ratingAvg} >= ${filters.rating}`);
  if (filters.avail) where.push(eq(providerProfiles.availability, "available"));
  else where.push(sql`${providerProfiles.availability} <> 'unavailable'`);
  if (filters.lang) where.push(sql`${filters.lang} = ANY(${providerProfiles.languages})`);
  if (filters.portfolio) where.push(sql`EXISTS (SELECT 1 FROM portfolio_items pi WHERE pi.provider_id = ${providerProfiles.userId})`);
  if (filters.done) where.push(gt(providerProfiles.completedCount, 0));
  if (filters.anaf) where.push(sql`${users.companyVerifiedAt} IS NOT NULL`);
  if (filters.fast) where.push(sql`${providerProfiles.responseTimeMinutes} <= 180`);
  return where;
}

const selection = (distance: SQL<number | null>) => ({
  profile: providerProfiles,
  name: users.name,
  avatarPath: users.avatarPath,
  issuesInvoice: users.issuesInvoice,
  legalEntity: users.legalEntity,
  phoneVerified: sql<boolean>`${users.phoneVerifiedAt} IS NOT NULL`,
  companyVerified: sql<boolean>`${users.companyVerifiedAt} IS NOT NULL`,
  localityName: localities.name,
  countyCode: localities.countyCode,
  distanceKm: distance,
  boosted: sql<boolean>`coalesce(${providerProfiles.boostedUntil} > now(), false)`,
});

export async function searchProviders(filters: ProviderFilters) {
  const catalog = await getCatalog();
  const origin = filters.loc ? await getLocality(filters.loc) : null;
  const originGeo = origin ? sql`ST_SetSRID(ST_MakePoint(${origin.lng}, ${origin.lat}), 4326)::geography` : null;
  const where = buildWhere(filters, catalog, originGeo);
  const distance = originGeo
    ? sql<number | null>`CASE WHEN ${providerProfiles.geo} IS NOT NULL THEN ST_Distance(${providerProfiles.geo}, ${originGeo}) / 1000 END`
    : sql<number | null>`NULL::float8`;
  const q = filters.q ? normalizeText(filters.q) : "";

  // Relevanța: potrivire text + reputație + răspuns rapid + completitudinea profilului. Boost-ul NU modifică relevanța.
  const relevance = sql`(
    ${q ? sql`ts_rank(${providerProfiles.searchVector}, plainto_tsquery('simple', ${q})) * 40 +` : sql``}
    coalesce(${providerProfiles.ratingAvg}, 3.5) * 4 + least(${providerProfiles.completedCount}, 10) * 1.5
    + CASE WHEN ${providerProfiles.responseTimeMinutes} <= 180 THEN 4 ELSE 0 END
    + CASE WHEN ${providerProfiles.availability} = 'available' THEN 3 ELSE 0 END
    + least(length(${providerProfiles.bio}), 600) / 200.0
  )`;
  const order =
    filters.sort === "rating"
      ? [sql`${providerProfiles.ratingAvg} DESC NULLS LAST`, desc(providerProfiles.ratingCount)]
      : filters.sort === "rate"
        ? [sql`${providerProfiles.hourlyRate} ASC NULLS LAST`]
        : filters.sort === "distance" && originGeo
          ? [sql`${distance} ASC NULLS LAST`]
          : filters.sort === "response"
            ? [sql`${providerProfiles.responseTimeMinutes} ASC NULLS LAST`]
            : filters.sort === "experience"
              ? [sql`${providerProfiles.yearsExperience} DESC NULLS LAST`]
              : [sql`${relevance} DESC`];

  const query = () =>
    db
      .select(selection(distance))
      .from(providerProfiles)
      .innerJoin(users, eq(users.id, providerProfiles.userId))
      .leftJoin(localities, eq(localities.id, providerProfiles.localityId));

  const [rows, [{ total }], promoted] = await Promise.all([
    query()
      .where(and(...where))
      .orderBy(...order)
      .limit(PAGE_SIZE)
      .offset((filters.page - 1) * PAGE_SIZE),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(providerProfiles)
      .innerJoin(users, eq(users.id, providerProfiles.userId))
      .where(and(...where)),
    filters.page === 1
      ? query()
          .where(and(...where, sql`${providerProfiles.boostedUntil} > now()`))
          .orderBy(sql`random()`)
          .limit(3)
      : Promise.resolve([]),
  ]);
  return { rows, promoted, total, page: filters.page, pageSize: PAGE_SIZE, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export type ProviderSearchRow = Awaited<ReturnType<typeof searchProviders>>["rows"][number];

/** Explică de ce nu există rezultate și ce filtre ar putea fi relaxate. */
export async function suggestRelaxations(filters: ProviderFilters) {
  const candidates: { key: keyof ProviderFilters; label: string }[] = [
    { key: "inv", label: "fără filtrul de factură" },
    { key: "le", label: "orice formă juridică" },
    { key: "rating", label: "fără rating minim" },
    { key: "rate", label: "fără tarif maxim" },
    { key: "avail", label: "inclusiv prestatori ocupați parțial" },
    { key: "fast", label: "fără filtrul de răspuns rapid" },
    { key: "anaf", label: "inclusiv firme neverificate ANAF" },
    { key: "done", label: "inclusiv profiluri noi" },
    { key: "portfolio", label: "inclusiv fără portofoliu" },
    { key: "lang", label: "orice limbă" },
  ];
  const out: { label: string; count: number; params: Partial<ProviderFilters> }[] = [];
  for (const c of candidates) {
    if (filters[c.key] === undefined) continue;
    const relaxed = { ...filters, [c.key]: undefined, page: 1 };
    const res = await searchProviders(relaxed);
    if (res.total > 0) out.push({ label: c.label, count: res.total, params: { [c.key]: undefined } });
  }
  if (filters.r && filters.loc) {
    const res = await searchProviders({ ...filters, r: Math.min(filters.r * 2, 500), page: 1 });
    if (res.total > 0) out.push({ label: `rază de ${Math.min(filters.r * 2, 500)} km`, count: res.total, params: { r: Math.min(filters.r * 2, 500) } });
  }
  return out.slice(0, 4);
}
