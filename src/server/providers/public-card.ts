import { eq } from "drizzle-orm";
import { getCatalog } from "../catalog/taxonomy";
import { db } from "../db";
import { localities, providerCategories, providerProfiles, providerSkills, skills, users } from "../db/schema";

/** Datele pentru cardul distribuibil și imaginea de previzualizare (OG). */
export async function getPublicCard(slug: string) {
  const [row] = await db
    .select({
      profile: providerProfiles,
      name: users.name,
      avatarPath: users.avatarPath,
      legalEntity: users.legalEntity,
      issuesInvoice: users.issuesInvoice,
      companyName: users.companyName,
      companyVerifiedAt: users.companyVerifiedAt,
      companyVerification: users.companyVerification,
      phoneVerifiedAt: users.phoneVerifiedAt,
      bannedAt: users.bannedAt,
      deletedAt: users.deletedAt,
      localityName: localities.name,
      countyCode: localities.countyCode,
    })
    .from(providerProfiles)
    .innerJoin(users, eq(users.id, providerProfiles.userId))
    .leftJoin(localities, eq(localities.id, providerProfiles.localityId))
    .where(eq(providerProfiles.slug, slug))
    .limit(1);
  if (!row || !row.profile.isPublic || row.bannedAt || row.deletedAt) return null;
  const catalog = await getCatalog();
  const [cats, sk] = await Promise.all([
    db.select({ id: providerCategories.categoryId }).from(providerCategories).where(eq(providerCategories.providerId, row.profile.userId)),
    db
      .select({ name: skills.name })
      .from(providerSkills)
      .innerJoin(skills, eq(skills.id, providerSkills.skillId))
      .where(eq(providerSkills.providerId, row.profile.userId))
      .limit(8),
  ]);
  return {
    ...row,
    categories: cats.map((c) => catalog.byId.get(c.id)?.name).filter((n): n is string => Boolean(n)),
    skills: sk.map((s) => s.name),
  };
}

export type PublicCard = NonNullable<Awaited<ReturnType<typeof getPublicCard>>>;

export function cardPrice(c: PublicCard) {
  const p = c.profile;
  if (p.pricingModel === "hourly" && p.hourlyRate) return `${p.hourlyRate} lei / oră`;
  if (p.minProjectBudget) return `de la ${p.minProjectBudget.toLocaleString("ro-RO")} lei / proiect`;
  return "Ofertă personalizată";
}
