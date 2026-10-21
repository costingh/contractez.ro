import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import type { MetadataRoute } from "next";
import { posts } from "@/content/blog/posts";
import { cities, cityServices, isCityPageIndexedByDefault } from "@/content/cities";
import { getCatalog } from "@/server/catalog/taxonomy";
import { db } from "@/server/db";
import { projects, providerProfiles, users } from "@/server/db/schema";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const now = new Date();
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

  const staticPages = ["", "/proiecte", "/prestatori", "/preturi", "/cum-functioneaza", "/contact", "/termeni", "/confidentialitate", "/blog", "/orase"].map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: (p === "" || p === "/proiecte" ? "daily" : "weekly") as "daily" | "weekly",
    priority: p === "" ? 1 : 0.7,
  }));
  const categories = [...catalog.byId.values()].map((c) => ({
    url: `${base}/categorii/${c.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: c.parentId ? 0.6 : 0.8,
  }));
  const cityPages = Object.keys(cityServices)
    .filter((slug) => catalog.bySlug.has(slug))
    .flatMap((slug) =>
      cities
        .filter((c) => isCityPageIndexedByDefault(slug, c))
        .map((c) => ({ url: `${base}/categorii/${slug}/${c.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.6 })),
    );
  const cityHubs = cities
    .filter((c) => Object.keys(cityServices).some((s) => isCityPageIndexedByDefault(s, c)))
    .map((c) => ({ url: `${base}/orase/${c.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.6 }));
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
