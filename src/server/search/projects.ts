import { and, desc, eq, gte, inArray, lte, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { normalizeText, stripControlChars } from "@/lib/text";
import { expandCategory, getCatalog } from "../catalog/taxonomy";
import { getLocality } from "../catalog/localities";
import { db } from "../db";
import { categories, localities, projects, users } from "../db/schema";
import { features, phoneVerifiedSql } from "../features";

const csv = z
  .string()
  .optional()
  .transform((v) => (v ? v.split(",").filter(Boolean) : []));
const num = z.coerce.number().int().positive().optional().catch(undefined);

export const projectFiltersSchema = z.object({
  q: z.string().trim().max(200).optional().catch(undefined),
  cat: num,
  min: num,
  max: num,
  bt: z.enum(["fixed", "hourly", "monthly", "unknown"]).optional().catch(undefined),
  mode: csv.pipe(z.array(z.enum(["remote", "on_site", "hybrid"]))).catch([]),
  loc: num,
  r: z.coerce.number().int().min(1).max(500).optional().catch(undefined),
  inv: z.enum(["required", "not_required"]).optional().catch(undefined),
  urg: z.enum(["urgent", "this_week", "this_month"]).optional().catch(undefined),
  verified: z.literal("1").optional().catch(undefined),
  few: z.literal("1").optional().catch(undefined),
  days: z.coerce.number().int().min(1).max(60).optional().catch(undefined),
  sort: z.enum(["relevance", "newest", "budget", "distance", "ending"]).default("newest").catch("newest"),
  page: z.coerce.number().int().min(1).max(100).default(1).catch(1),
});
export type ProjectFilters = z.infer<typeof projectFiltersSchema>;

export function parseProjectFilters(params: Record<string, string | string[] | undefined>): ProjectFilters {
  // Fără caractere de control: `\u0000` din URL (ex. ?q=%00) ar face interogarea Postgres să eșueze.
  const flat = Object.fromEntries(
    Object.entries(params).map(([k, v]) => {
      const value = Array.isArray(v) ? v[0] : v;
      return [k, value === undefined ? undefined : stripControlChars(value)];
    }),
  );
  const filters = projectFiltersSchema.parse(flat);
  // Fără verificare SMS nimeni nu are telefon verificat: ignorăm filtrul (altfel ar ascunde tot).
  if (!features.phoneVerification) filters.verified = undefined;
  return filters;
}

const PAGE_SIZE = 20;

export async function searchProjects(filters: ProjectFilters) {
  const catalog = await getCatalog();
  const where: (SQL | undefined)[] = [eq(projects.status, "open")];
  const q = filters.q ? normalizeText(filters.q) : "";
  const tsQuery = q
    ? sql`plainto_tsquery('simple', ${q})`
    : null;

  if (tsQuery) where.push(sql`(${projects.searchVector} @@ ${tsQuery} OR ${projects.searchText} ILIKE ${"%" + q + "%"})`);
  if (filters.cat) where.push(inArray(projects.categoryId, expandCategory(catalog, filters.cat)));
  if (filters.min) where.push(sql`coalesce(${projects.budgetMax}, ${projects.budgetMin}, 0) >= ${filters.min}`);
  if (filters.max) where.push(sql`coalesce(${projects.budgetMin}, ${projects.budgetMax}, 0) <= ${filters.max}`);
  if (filters.bt) where.push(eq(projects.budgetType, filters.bt));
  if (filters.mode.length) where.push(inArray(projects.workMode, filters.mode));
  if (filters.inv === "required") where.push(eq(projects.invoice, "required"));
  if (filters.inv === "not_required") where.push(sql`${projects.invoice} <> 'required'`);
  if (filters.urg === "urgent") where.push(eq(projects.urgency, "urgent"));
  if (filters.urg === "this_week") where.push(inArray(projects.urgency, ["urgent", "this_week"]));
  if (filters.urg === "this_month") where.push(inArray(projects.urgency, ["urgent", "this_week", "this_month"]));
  if (filters.verified && features.phoneVerification) where.push(sql`${users.phoneVerifiedAt} IS NOT NULL`);
  if (filters.few) where.push(sql`${projects.applicationsCount} < 2`);
  if (filters.days) where.push(gte(projects.publishedAt, new Date(Date.now() - filters.days * 86_400_000)));

  const origin = filters.loc ? await getLocality(filters.loc) : null;
  const originGeo = origin ? sql`ST_SetSRID(ST_MakePoint(${origin.lng}, ${origin.lat}), 4326)::geography` : null;
  if (originGeo && filters.r) {
    // Proiectele remote rămân incluse; cele fizice trebuie să fie în rază.
    where.push(sql`(${projects.workMode} = 'remote' OR ST_DWithin(${projects.geo}, ${originGeo}, ${filters.r * 1000}))`);
  }

  const distance = originGeo
    ? sql<number | null>`CASE WHEN ${projects.geo} IS NOT NULL THEN ST_Distance(${projects.geo}, ${originGeo}) / 1000 END`
    : sql<number | null>`NULL::float8`;

  const order =
    filters.sort === "budget"
      ? [sql`coalesce(${projects.budgetMax}, ${projects.budgetMin}, 0) DESC`]
      : filters.sort === "distance" && originGeo
        ? [sql`${distance} ASC NULLS LAST`]
        : filters.sort === "ending"
          ? [sql`${projects.expiresAt} ASC`]
          : filters.sort === "relevance" && tsQuery
            ? [sql`ts_rank(${projects.searchVector}, ${tsQuery}) DESC`, desc(projects.publishedAt)]
            : [desc(projects.publishedAt)];

  const base = db
    .select({
      project: projects,
      categoryName: categories.name,
      localityName: localities.name,
      countyCode: localities.countyCode,
      clientName: users.name,
      clientPhoneVerified: phoneVerifiedSql(),
      clientEmailVerified: sql<boolean>`${users.emailVerifiedAt} IS NOT NULL`,
      distanceKm: distance,
    })
    .from(projects)
    .innerJoin(users, eq(users.id, projects.clientId))
    .innerJoin(categories, eq(categories.id, projects.categoryId))
    .leftJoin(localities, eq(localities.id, projects.localityId))
    .where(and(...where));

  const [rows, [{ total }]] = await Promise.all([
    base
      .orderBy(...order)
      .limit(PAGE_SIZE)
      .offset((filters.page - 1) * PAGE_SIZE),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(projects)
      .innerJoin(users, eq(users.id, projects.clientId))
      .where(and(...where)),
  ]);
  return { rows, total, page: filters.page, pageSize: PAGE_SIZE, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export type ProjectSearchRow = Awaited<ReturnType<typeof searchProjects>>["rows"][number];

export async function latestOpenProjects(limit = 6) {
  return db
    .select({
      project: projects,
      categoryName: categories.name,
      localityName: localities.name,
      countyCode: localities.countyCode,
      clientName: users.name,
      clientPhoneVerified: phoneVerifiedSql(),
      clientEmailVerified: sql<boolean>`${users.emailVerifiedAt} IS NOT NULL`,
      distanceKm: sql<number | null>`NULL::float8`,
    })
    .from(projects)
    .innerJoin(users, eq(users.id, projects.clientId))
    .innerJoin(categories, eq(categories.id, projects.categoryId))
    .leftJoin(localities, eq(localities.id, projects.localityId))
    .where(and(eq(projects.status, "open"), lte(projects.publishedAt, new Date())))
    .orderBy(desc(projects.publishedAt))
    .limit(limit);
}
