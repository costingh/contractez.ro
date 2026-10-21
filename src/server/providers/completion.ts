import { eq, sql } from "drizzle-orm";
import { profileCompletion } from "@/lib/profile-completion";
import { db } from "../db";
import { portfolioItems, providerProfiles, providerServices } from "../db/schema";

/**
 * Completitudinea profilului de prestator, dintr-o singură interogare.
 * `null` când prestatorul nu are încă profil (banner-ul din panou trimite la onboarding).
 */
export async function getProfileCompletion(userId: string, avatarPath: string | null) {
  const [row] = await db
    .select({
      coverPath: providerProfiles.coverPath,
      websiteUrl: providerProfiles.websiteUrl,
      socialLinks: providerProfiles.socialLinks,
      hasPortfolio: sql<boolean>`EXISTS (SELECT 1 FROM ${portfolioItems} WHERE ${portfolioItems.providerId} = ${providerProfiles.userId})`,
      hasServices: sql<boolean>`EXISTS (SELECT 1 FROM ${providerServices} WHERE ${providerServices.providerId} = ${providerProfiles.userId})`,
    })
    .from(providerProfiles)
    .where(eq(providerProfiles.userId, userId))
    .limit(1);
  if (!row) return null;
  return profileCompletion({ ...row, avatarPath });
}
