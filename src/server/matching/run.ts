import { and, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import { rules } from "@/config/site";
import { normalizeText, truncate } from "@/lib/text";
import { describeBudget } from "../ai/features";
import { categoryPath, getCatalog, rootOf } from "../catalog/taxonomy";
import { db } from "../db";
import { localities, projectMatches, projectSkills, projects, type Project } from "../db/schema";
import { getPreferences, notify } from "../notifications";
import { matchNewTemplate, matchSummaryTemplate } from "../email/templates";
import { distribute, keywordsFrom, scoreMatch, type ProjectForMatch, type ProviderForMatch } from "./score";

type CandidateRow = {
  user_id: string;
  name: string;
  created_at: Date;
  category_ids: number[] | null;
  skill_ids: number[] | null;
  search_text: string;
  hourly_rate: number | null;
  min_project_budget: number | null;
  remote: boolean;
  on_site: boolean;
  travel_radius_km: number;
  distance_km: number | null;
  rating_avg: number | null;
  rating_count: number;
  completed_count: number;
  availability: "available" | "busy" | "unavailable";
  response_time_minutes: number | null;
  notified_today: number;
};

export async function projectForMatch(project: Project): Promise<ProjectForMatch> {
  const catalog = await getCatalog();
  const skillRows = await db.select({ id: projectSkills.skillId }).from(projectSkills).where(eq(projectSkills.projectId, project.id));
  return {
    categoryId: project.categoryId,
    rootCategoryId: rootOf(catalog, project.categoryId)?.id ?? project.categoryId,
    skillIds: skillRows.map((r) => r.id),
    keywords: keywordsFrom(normalizeText(`${project.title} ${project.description}`)),
    budgetType: project.budgetType,
    budgetMin: project.budgetMin,
    budgetMax: project.budgetMax,
    estimatedHours: project.estimatedHours,
    workMode: project.workMode,
    radiusKm: project.radiusKm,
  };
}

/** Încarcă prestatorii candidați (filtrare grosieră în SQL; filtrarea exactă se face în `scoreMatch`). */
async function loadCandidates(project: Project, rootIds: number[], providerIds?: string[]): Promise<CandidateRow[]> {
  const catIds = [...new Set([project.categoryId, ...rootIds])];
  const catalog = await getCatalog();
  // Includem și subcategoriile surori (domenii apropiate).
  const related = catalog.tree.filter((t) => catIds.includes(t.id)).flatMap((t) => t.children.map((c) => c.id));
  const allCats = [...new Set([...catIds, ...related])];
  const geo = project.lat !== null && project.lng !== null ? sql`ST_SetSRID(ST_MakePoint(${project.lng}, ${project.lat}), 4326)::geography` : null;

  const rows = await db.execute<CandidateRow>(sql`
    SELECT pp.user_id, u.name, u.created_at,
      (SELECT array_agg(pc.category_id) FROM provider_categories pc WHERE pc.provider_id = pp.user_id) AS category_ids,
      (SELECT array_agg(ps.skill_id) FROM provider_skills ps WHERE ps.provider_id = pp.user_id) AS skill_ids,
      pp.search_text, pp.hourly_rate, pp.min_project_budget, pp.remote, pp.on_site, pp.travel_radius_km,
      ${geo ? sql`CASE WHEN pp.geo IS NOT NULL THEN ST_Distance(pp.geo, ${geo}) / 1000 END` : sql`NULL::float8`} AS distance_km,
      pp.rating_avg, pp.rating_count, pp.completed_count, pp.availability, pp.response_time_minutes,
      (SELECT count(*)::int FROM project_matches pm WHERE pm.provider_id = pp.user_id AND pm.notified_at > now() - interval '24 hours') AS notified_today
    FROM provider_profiles pp
    JOIN users u ON u.id = pp.user_id
    WHERE u.is_provider AND u.email_verified_at IS NOT NULL AND u.banned_at IS NULL AND u.deleted_at IS NULL
      AND u.onboarded_at IS NOT NULL AND pp.is_public AND pp.availability <> 'unavailable'
      AND u.id <> ${project.clientId}
      ${providerIds ? (providerIds.length ? sql`AND pp.user_id IN ${providerIds}` : sql`AND false`) : sql``}
      AND EXISTS (SELECT 1 FROM provider_categories pc WHERE pc.provider_id = pp.user_id AND pc.category_id IN ${allCats})
      ${project.invoice === "required" ? sql`AND u.issues_invoice` : sql``}
      ${
        project.workMode === "on_site"
          ? geo
            ? sql`AND pp.on_site AND pp.geo IS NOT NULL AND ST_DWithin(pp.geo, ${geo}, LEAST(pp.travel_radius_km, ${project.radiusKm}) * 1000)`
            : sql`AND false`
          : project.workMode === "remote"
            ? sql`AND pp.remote`
            : sql``
      }
    LIMIT 2000
  `);
  return rows as unknown as CandidateRow[];
}

function toProvider(row: CandidateRow, catalog: Awaited<ReturnType<typeof getCatalog>>): ProviderForMatch {
  const categoryIds = row.category_ids ?? [];
  return {
    categoryIds,
    rootCategoryIds: [...new Set(categoryIds.map((id) => rootOf(catalog, id)?.id ?? id))],
    skillIds: row.skill_ids ?? [],
    searchText: row.search_text,
    hourlyRate: row.hourly_rate,
    minProjectBudget: row.min_project_budget,
    remote: row.remote,
    onSite: row.on_site,
    travelRadiusKm: row.travel_radius_km,
    distanceKm: row.distance_km === null ? null : Number(row.distance_km),
    ratingAvg: row.rating_avg,
    ratingCount: row.rating_count,
    completedCount: row.completed_count,
    availability: row.availability,
    responseTimeMinutes: row.response_time_minutes,
  };
}

/**
 * Calculează potrivirile pentru un proiect publicat, le salvează și notifică prestatorii
 * (instant sau prin digest, după preferințe). Idempotent: poate rula de mai multe ori.
 */
export async function runMatchingForProject(projectId: string) {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project || project.status !== "open") return { matched: 0, notified: 0 };
  const catalog = await getCatalog();
  const pm = await projectForMatch(project);
  const rows = await loadCandidates(project, [pm.rootCategoryId]);

  const scored = rows
    .map((row) => {
      const res = scoreMatch(pm, toProvider(row, catalog));
      return {
        row,
        ...res,
        isNewcomer: row.completed_count === 0 && Date.now() - new Date(row.created_at).getTime() < 60 * 86_400_000,
        notifiedToday: row.notified_today,
      };
    })
    .filter((r) => r.eligible && r.score >= rules.minMatchScore);

  if (scored.length > 0) {
    await db
      .insert(projectMatches)
      .values(
        scored.map((s) => ({
          projectId,
          providerId: s.row.user_id,
          score: s.score,
          reasons: s.reasons,
          distanceKm: s.row.distance_km === null ? null : Number(s.row.distance_km),
        })),
      )
      .onConflictDoUpdate({
        target: [projectMatches.projectId, projectMatches.providerId],
        set: { score: sql`excluded.score`, reasons: sql`excluded.reasons`, distanceKm: sql`excluded.distance_km` },
      });
  }

  const toNotify = distribute(scored, rules.maxInstantNotifications, rules.newcomerShare);
  const [loc] = project.localityId
    ? await db.select({ name: localities.name }).from(localities).where(eq(localities.id, project.localityId)).limit(1)
    : [];
  const where = project.workMode === "remote" ? "Remote" : (loc?.name ?? "");
  const path = categoryPath(catalog, project.categoryId);
  let notified = 0;

  for (const s of toNotify) {
    const prefs = await getPreferences(s.row.user_id);
    if (s.score < prefs.minMatchScore) continue;
    const [claimed] = await db
      .update(projectMatches)
      .set({ notifiedAt: new Date() })
      .where(and(eq(projectMatches.projectId, projectId), eq(projectMatches.providerId, s.row.user_id), isNull(projectMatches.notifiedAt)))
      .returning({ id: projectMatches.id });
    if (!claimed) continue; // deja notificat
    notified++;
    const top = s.reasons.filter((r) => r.positive).slice(0, 3).map((r) => r.label);
    await notify({
      userId: s.row.user_id,
      type: "match.new",
      title: `Proiect compatibil ${s.score}%: ${project.title}`,
      body: `${path} · ${where} · ${describeBudget(project)}`,
      link: `/proiecte/${project.id}`,
      dedupeKey: `match:${projectId}:${s.row.user_id}`,
      email:
        prefs.matchFrequency === "instant"
          ? matchNewTemplate({
              projectTitle: project.title,
              path,
              where,
              budget: describeBudget(project),
              score: s.score,
              reasons: top,
              description: truncate(project.description.replace(/\s+/g, " "), 240),
            })
          : undefined,
    });
  }
  return { matched: scored.length, notified };
}

/** Scorurile unor prestatori anume pentru un proiect (folosit de Auto Bid). */
export async function scoreProvidersForProject(project: Project, providerIds: string[]) {
  const catalog = await getCatalog();
  const pm = await projectForMatch(project);
  const rows = await loadCandidates(project, [pm.rootCategoryId], providerIds);
  const out = new Map<string, { score: number; reasons: ProviderMatchReason[]; distanceKm: number | null }>();
  for (const row of rows) {
    const provider = toProvider(row, catalog);
    const res = scoreMatch(pm, provider);
    if (res.eligible) out.set(row.user_id, { score: res.score, reasons: res.reasons, distanceKm: provider.distanceKm });
  }
  return out;
}

export type RecommendedProject = { project: Project; score: number; reasons: ProviderMatchReason[]; distanceKm: number | null };
type ProviderMatchReason = { label: string; points: number; positive: boolean };

/** Recomandări pentru un prestator (calcul la cerere, pentru proiectele deschise recente). */
export async function recommendProjectsForProvider(
  providerId: string,
  opts: { minScore?: number; limit?: number; relaxed?: boolean } = {},
): Promise<RecommendedProject[]> {
  const catalog = await getCatalog();
  const [row] = (await db.execute<CandidateRow & { lat: number | null; lng: number | null; issues_invoice: boolean }>(sql`
    SELECT pp.user_id, u.name, u.created_at, pp.lat, pp.lng, u.issues_invoice,
      (SELECT array_agg(pc.category_id) FROM provider_categories pc WHERE pc.provider_id = pp.user_id) AS category_ids,
      (SELECT array_agg(ps.skill_id) FROM provider_skills ps WHERE ps.provider_id = pp.user_id) AS skill_ids,
      pp.search_text, pp.hourly_rate, pp.min_project_budget, pp.remote, pp.on_site, pp.travel_radius_km,
      NULL::float8 AS distance_km, pp.rating_avg, pp.rating_count, pp.completed_count, pp.availability,
      pp.response_time_minutes, 0 AS notified_today
    FROM provider_profiles pp JOIN users u ON u.id = pp.user_id WHERE pp.user_id = ${providerId}
  `)) as unknown as (CandidateRow & { lat: number | null; lng: number | null; issues_invoice: boolean })[];
  if (!row) return [];
  const base = toProvider(row, catalog);
  if (base.categoryIds.length === 0) return [];
  const rootIds = base.rootCategoryIds;
  const allCats = [...new Set([...base.categoryIds, ...rootIds, ...catalog.tree.filter((t) => rootIds.includes(t.id)).flatMap((t) => t.children.map((c) => c.id))])];

  const open = await db
    .select({
      project: projects,
      distanceKm:
        row.lat !== null && row.lng !== null
          ? sql<number | null>`CASE WHEN ${projects.geo} IS NOT NULL THEN ST_Distance(${projects.geo}, ST_SetSRID(ST_MakePoint(${row.lng}, ${row.lat}), 4326)::geography) / 1000 END`
          : sql<number | null>`NULL::float8`,
    })
    .from(projects)
    .where(
      and(
        eq(projects.status, "open"),
        inArray(projects.categoryId, allCats),
        gte(projects.publishedAt, new Date(Date.now() - 45 * 86_400_000)),
        sql`${projects.clientId} <> ${providerId}`,
        sql`NOT EXISTS (SELECT 1 FROM applications a WHERE a.project_id = ${projects.id} AND a.provider_id = ${providerId})`,
      ),
    )
    .limit(500);

  const minScore = opts.minScore ?? (opts.relaxed ? 30 : rules.minMatchScore);
  const results: RecommendedProject[] = [];
  for (const { project, distanceKm } of open) {
    const pm = await projectForMatchCached(project);
    const provider = { ...base, distanceKm: distanceKm === null ? null : Number(distanceKm) };
    const relaxedProvider = opts.relaxed ? { ...provider, remote: true, travelRadiusKm: provider.travelRadiusKm * 2 } : provider;
    const res = scoreMatch({ ...pm, radiusKm: opts.relaxed ? pm.radiusKm * 2 : pm.radiusKm }, relaxedProvider);
    if (!res.eligible || res.score < minScore) continue;
    if (project.invoice === "required" && !row.issues_invoice && !opts.relaxed) continue;
    results.push({ project, score: res.score, reasons: res.reasons, distanceKm: provider.distanceKm });
  }
  return results.sort((a, b) => b.score - a.score).slice(0, opts.limit ?? 30);
}

const pmCache = new Map<string, { at: number; value: ProjectForMatch }>();
async function projectForMatchCached(project: Project) {
  const hit = pmCache.get(project.id);
  if (hit && Date.now() - hit.at < 60_000 && hit.value.budgetMax === project.budgetMax) return hit.value;
  const value = await projectForMatch(project);
  pmCache.set(project.id, { at: Date.now(), value });
  if (pmCache.size > 2_000) pmCache.clear();
  return value;
}

/**
 * Prestator nou (sau care și-a schimbat categoriile/zona): îi calculăm potrivirile cu proiectele deja deschise
 * și îi trimitem un singur rezumat (nu câte un email per proiect). Idempotent: proiectele deja anunțate nu se repetă.
 */
export async function matchOpenProjectsForProvider(providerId: string) {
  const recs = await recommendProjectsForProvider(providerId, { limit: 15 });
  const prefs = await getPreferences(providerId);
  const relevant = recs.filter((r) => r.score >= prefs.minMatchScore);
  if (relevant.length === 0) return { matched: 0, notified: 0 };

  const fresh: RecommendedProject[] = [];
  for (const r of relevant) {
    const [row] = await db
      .insert(projectMatches)
      .values({ projectId: r.project.id, providerId, score: r.score, reasons: r.reasons, distanceKm: r.distanceKm, notifiedAt: new Date() })
      .onConflictDoNothing()
      .returning({ id: projectMatches.id });
    if (row) fresh.push(r);
  }
  if (fresh.length === 0) return { matched: relevant.length, notified: 0 };

  const catalog = await getCatalog();
  const top = fresh.slice(0, 5);
  await notify({
    userId: providerId,
    type: "match.summary",
    title: `${fresh.length === 1 ? "Un proiect deschis se potrivește" : `${fresh.length} proiecte deschise se potrivesc`} cu profilul tău`,
    body: top.map((r) => r.project.title).slice(0, 2).join(" · "),
    link: "/recomandari",
    dedupeKey: `provider-matches:${providerId}:${new Date().toISOString().slice(0, 10)}`,
    email:
      prefs.matchFrequency === "off"
        ? undefined
        : matchSummaryTemplate({
            total: fresh.length,
            projects: top.map((r) => ({
              meta: `${categoryPath(catalog, r.project.categoryId)} · compatibilitate ${r.score}%`,
              title: r.project.title,
              href: `${process.env.APP_URL ?? ""}/proiecte/${r.project.id}`,
              budget: describeBudget(r.project),
            })),
          }),
  });
  return { matched: relevant.length, notified: fresh.length };
}
