import { sql } from "drizzle-orm";
import { freePlan, plans } from "@/config/site";
import { db } from "./db";

export type CategoryDemand = {
  categoryId: number;
  name: string;
  slug: string;
  projects30d: number;
  providers: number;
  ratio: number;
  label: "Cerere mare" | "Echilibrat" | "Competiție mare" | "Fără date";
};

/** Cerere vs. ofertă pe categorii principale (ultimele 30 de zile), opțional pe județ. */
export async function categoryDemand(countyCode?: string | null): Promise<CategoryDemand[]> {
  const rows = (await db.execute(sql`
    WITH roots AS (SELECT id, name, slug FROM categories WHERE parent_id IS NULL),
    proj AS (
      SELECT coalesce(c.parent_id, c.id) AS root_id, count(*)::int AS n
      FROM projects p JOIN categories c ON c.id = p.category_id
      LEFT JOIN localities l ON l.id = p.locality_id
      WHERE p.published_at > now() - interval '30 days' AND p.status IN ('open','in_progress','closed')
        ${countyCode ? sql`AND (p.work_mode = 'remote' OR l.county_code = ${countyCode})` : sql``}
      GROUP BY 1
    ),
    prov AS (
      SELECT coalesce(c.parent_id, c.id) AS root_id, count(DISTINCT pc.provider_id)::int AS n
      FROM provider_categories pc JOIN categories c ON c.id = pc.category_id
      JOIN provider_profiles pp ON pp.user_id = pc.provider_id
      JOIN users u ON u.id = pc.provider_id
      LEFT JOIN localities l ON l.id = pp.locality_id
      WHERE u.onboarded_at IS NOT NULL AND u.banned_at IS NULL AND pp.availability <> 'unavailable'
        ${countyCode ? sql`AND (pp.remote OR l.county_code = ${countyCode})` : sql``}
      GROUP BY 1
    )
    SELECT r.id AS category_id, r.name, r.slug, coalesce(proj.n, 0) AS projects30d, coalesce(prov.n, 0) AS providers
    FROM roots r LEFT JOIN proj ON proj.root_id = r.id LEFT JOIN prov ON prov.root_id = r.id
    ORDER BY coalesce(proj.n, 0) DESC
  `)) as unknown as { category_id: number; name: string; slug: string; projects30d: number; providers: number }[];

  return rows.map((r) => {
    const ratio = r.providers === 0 ? (r.projects30d > 0 ? r.projects30d : 0) : r.projects30d / r.providers;
    const label: CategoryDemand["label"] =
      r.projects30d === 0 && r.providers === 0 ? "Fără date" : ratio >= 1.5 ? "Cerere mare" : ratio <= 0.3 ? "Competiție mare" : "Echilibrat";
    return { categoryId: r.category_id, name: r.name, slug: r.slug, projects30d: r.projects30d, providers: r.providers, ratio, label };
  });
}

/** Statistici publice pentru pagina principală. */
export async function publicStats() {
  const [r] = (await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM projects WHERE status = 'open') AS open_projects,
      (SELECT count(*)::int FROM provider_profiles pp JOIN users u ON u.id = pp.user_id WHERE u.onboarded_at IS NOT NULL AND u.banned_at IS NULL) AS providers,
      (SELECT count(*)::int FROM collaborations WHERE status IN ('active','completed')) AS collaborations,
      (SELECT round(avg(rating)::numeric, 1)::float8 FROM reviews WHERE NOT hidden_by_admin) AS avg_rating
  `)) as unknown as { open_projects: number; providers: number; collaborations: number; avg_rating: number | null }[];
  return r;
}

export type FeaturedReview = { id: string; author: string; comment: string; rating: number; category: string; locality: string | null };

/** Recenzii reale, bune și cu text, pentru pagina principală (autorul ascuns apare ca „Client verificat”). */
export async function featuredReviews(limit = 3): Promise<FeaturedReview[]> {
  return (await db.execute(sql`
    SELECT * FROM (
    SELECT DISTINCT ON (lower(r.comment)) r.id, r.rating, r.comment, r.created_at,
      CASE WHEN r.hide_author THEN 'Client verificat'
           ELSE split_part(a.name, ' ', 1) || COALESCE(' ' || left(nullif(split_part(a.name, ' ', 2), ''), 1) || '.', '') END AS author,
      c.name AS category, l.name AS locality
    FROM reviews r
    JOIN users a ON a.id = r.author_id AND a.banned_at IS NULL
    JOIN collaborations co ON co.id = r.collaboration_id
    JOIN projects p ON p.id = co.project_id
    JOIN categories c ON c.id = p.category_id
    LEFT JOIN localities l ON l.id = p.locality_id
    WHERE NOT r.hidden_by_admin AND r.rating >= 4 AND r.target_id = co.provider_id AND length(r.comment) >= 30
    ORDER BY lower(r.comment), r.created_at DESC
    ) d
    ORDER BY rating DESC, created_at DESC
    LIMIT ${limit}
  `)) as unknown as FeaturedReview[];
}

/** Statistici pentru panoul prestatorului. */
export async function providerStats(userId: string) {
  const [r] = (await db.execute(sql`
    SELECT
      count(*)::int AS applications,
      count(*) FILTER (WHERE viewed_at IS NOT NULL)::int AS viewed,
      count(*) FILTER (WHERE status IN ('shortlisted','hired'))::int AS shortlisted,
      count(*) FILTER (WHERE status = 'hired')::int AS hired,
      count(*) FILTER (WHERE created_at > now() - interval '30 days')::int AS last30
    FROM applications WHERE provider_id = ${userId}
  `)) as unknown as { applications: number; viewed: number; shortlisted: number; hired: number; last30: number }[];
  const [m] = (await db.execute(sql`
    SELECT count(*)::int AS matches30, (SELECT profile_views FROM provider_profiles WHERE user_id = ${userId}) AS views
    FROM project_matches WHERE provider_id = ${userId} AND created_at > now() - interval '30 days'
  `)) as unknown as { matches30: number; views: number | null }[];
  return { ...r, matches30: m?.matches30 ?? 0, profileViews: m?.views ?? 0 };
}

/** Metrici pentru admin (funnel-ul de validare din plan). */
/** Venitul lunar recurent, calculat din prețurile planurilor (constante din config, nu input). */
const planPriceCase = `CASE plan_id ${plans.map((p) => `WHEN '${p.id}' THEN ${p.priceLei}`).join(" ")} ELSE 0 END`;

export async function adminMetrics() {
  const [r] = (await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM users) AS users,
      (SELECT count(*)::int FROM users WHERE email_verified_at IS NOT NULL) AS verified_users,
      (SELECT count(*)::int FROM users WHERE is_provider AND onboarded_at IS NOT NULL) AS providers,
      (SELECT count(*)::int FROM users WHERE is_client) AS clients,
      (SELECT count(*)::int FROM projects WHERE published_at IS NOT NULL) AS published_projects,
      (SELECT count(*)::int FROM projects WHERE status = 'open') AS open_projects,
      (SELECT count(*)::int FROM projects WHERE status = 'pending_review') AS pending_review,
      (SELECT count(*)::int FROM applications) AS applications,
      (SELECT count(*)::int FROM applications WHERE viewed_at IS NOT NULL) AS applications_viewed,
      (SELECT count(*)::int FROM conversations c WHERE EXISTS (SELECT 1 FROM messages m WHERE m.conversation_id = c.id AND m.sender_id = c.client_id)) AS conversations_with_reply,
      (SELECT count(*)::int FROM collaborations WHERE status IN ('active','completed')) AS collaborations,
      (SELECT count(DISTINCT user_id)::int FROM subscriptions WHERE status = 'active' AND stripe_subscription_id IS NOT NULL) AS paying_users,
      (SELECT coalesce(sum(${sql.raw(planPriceCase)}), 0)::int FROM subscriptions WHERE status = 'active' AND stripe_subscription_id IS NOT NULL) AS mrr_lei,
      (SELECT count(*)::int FROM subscriptions WHERE status = 'active' AND stripe_subscription_id IS NULL AND current_period_end > now()) AS comp_plans,
      (SELECT count(*)::int FROM (
         SELECT a.provider_id FROM applications a
         WHERE a.created_at >= date_trunc('month', now() AT TIME ZONE 'Europe/Bucharest') AT TIME ZONE 'Europe/Bucharest'
           AND a.status <> 'refunded'
         GROUP BY a.provider_id HAVING count(*) >= ${freePlan.monthlyApplications}) t) AS hit_free_limit,
      (SELECT count(*)::int FROM reports WHERE status = 'open') AS open_reports,
      (SELECT count(*)::int FROM ai_usage WHERE created_at > now() - interval '24 hours') AS ai_calls_24h
  `)) as unknown as Record<string, number>[];
  return r;
}
