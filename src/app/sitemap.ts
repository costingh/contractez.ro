import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import type { MetadataRoute } from "next";
import { posts } from "@/content/blog/posts";
import { guidesUpdatedIso } from "@/content/category-guides";
import { cities, cityServices, isCityHubIndexed, isCityPageIndexedByDefault } from "@/content/cities";
import { getCatalog } from "@/server/catalog/taxonomy";
import { db } from "@/server/db";
import { projects, providerProfiles, users } from "@/server/db/schema";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const [catalog, openProjects, providers] = await Promise.all([
    getCatalog(),
    db
      .select({ id: projects.id, updatedAt: projects.updatedAt })
      .from(projects)
      .where(eq(projects.status, "open"))
      .orderBy(desc(projects.publishedAt))
      .limit(5000),
    db
      .select({ slug: providerProfiles.slug, updatedAt: providerProfiles.updatedAt })
      .from(providerProfiles)
      .innerJoin(users, eq(users.id, providerProfiles.userId))
      .where(
        and(
          eq(providerProfiles.isPublic, true),
          eq(users.isProvider, true),
          isNotNull(users.onboardedAt),
          isNotNull(users.emailVerifiedAt),
          isNull(users.bannedAt),
          isNull(users.deletedAt),
        ),
      )
      .limit(10000),
  ]);

  // lastmod doar unde îl știm cu adevărat: Google ignoră lastmod-ul unui sitemap care pretinde mereu „acum”.
  const guidesDate = new Date(guidesUpdatedIso);
  const latestPost = posts.reduce((d, p) => ((p.updated ?? p.date) > d ? (p.updated ?? p.date) : d), "");
  const latestProject = openProjects[0]?.updatedAt;
  const latestProvider = providers.reduce<Date | undefined>((d, p) => (!d || p.updatedAt > d ? p.updatedAt : d), undefined);
  const page = (path: string, lastModified: Date | undefined, changeFrequency: "daily" | "weekly" | "monthly", priority: number) => ({
    url: `${base}${path}`,
    ...(lastModified ? { lastModified } : {}),
    changeFrequency,
    priority,
  });

  const staticPages = [
    page("", latestProject, "daily", 1),
    page("/proiecte", latestProject, "daily", 0.7),
    page("/prestatori", latestProvider, "daily", 0.7),
    page("/categorii", guidesDate, "weekly", 0.8),
    page("/ghid-preturi", guidesDate, "monthly", 0.8),
    page("/blog", latestPost ? new Date(latestPost) : undefined, "weekly", 0.7),
    page("/orase", guidesDate, "weekly", 0.7),
    ...["/preturi", "/cum-functioneaza", "/despre", "/contact", "/termeni", "/confidentialitate"].map((p) => page(p, undefined, "monthly", 0.5)),
  ];
  const categories = [...catalog.byId.values()].map((c) => page(`/categorii/${c.slug}`, guidesDate, "weekly", c.parentId ? 0.6 : 0.8));
  const cityPages = Object.keys(cityServices)
    .filter((slug) => catalog.bySlug.has(slug))
    .flatMap((slug) => cities.filter((c) => isCityPageIndexedByDefault(slug, c)).map((c) => page(`/categorii/${slug}/${c.slug}`, guidesDate, "weekly", 0.6)));
  const cityHubs = cities.filter(isCityHubIndexed).map((c) => page(`/orase/${c.slug}`, guidesDate, "weekly", 0.6));
  return [
    ...staticPages,
    ...cityHubs,
    ...categories,
    ...cityPages,
    ...posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: new Date(p.updated ?? p.date), changeFrequency: "monthly" as const, priority: 0.7 })),
    ...openProjects.map((p) => ({ url: `${base}/proiecte/${p.id}`, lastModified: p.updatedAt, changeFrequency: "daily" as const, priority: 0.6 })),
    ...providers.map((p) => ({ url: `${base}/prestatori/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.5 })),
  ];
}
