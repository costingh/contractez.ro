import { eq } from "drizzle-orm";
import { z } from "zod";
import { track } from "./analytics";
import { maybeActivateProvider } from "./auth/service";
import { getLocality } from "./catalog/localities";
import { db } from "./db";
import { notificationPreferences, providerProfiles, users, type User } from "./db/schema";
import { DomainError } from "./errors";
import { saveProviderProfile } from "./providers/service";

export const basicsSchema = z.object({
  name: z.string().trim().min(2).max(80),
  isClient: z.boolean(),
  isProvider: z.boolean(),
  localityId: z.coerce.number().int().positive().nullable().optional(),
});

/** Pasul 1: roluri + localitate. Un cont poate avea ambele roluri. */
export async function saveBasics(userId: string, raw: unknown) {
  const input = basicsSchema.parse(raw);
  if (!input.isClient && !input.isProvider) throw new DomainError("role", "Alege cel puțin un rol.");
  const loc = input.localityId ? await getLocality(input.localityId) : null;
  await db
    .update(users)
    .set({
      name: input.name,
      isClient: input.isClient,
      // Rolul de prestator devine activ după completarea profilului (pasul 2); până atunci ținem minte intenția.
      wantsProvider: input.isProvider,
      localityId: loc?.id ?? null,
      lat: loc?.lat ?? null,
      lng: loc?.lng ?? null,
    })
    .where(eq(users.id, userId));
  await db.insert(notificationPreferences).values({ userId }).onConflictDoNothing();
}

export type OnboardingStep = 1 | 2 | 3;

/**
 * Ce pași are și ce a salvat deja utilizatorul (fiecare pas se salvează la „Continuă”):
 * pasul 1 (roluri) e gata dacă a ales un rol; pasul 2 (profil prestator) există doar pentru prestatori și e gata
 * când profilul a fost salvat (`isProvider`). `pendingProviderCookie`: cookie-ul vechi `onb_rol`, înainte de `wantsProvider`.
 */
export function onboardingProgress(u: Pick<User, "isClient" | "isProvider" | "wantsProvider">, pendingProviderCookie = false) {
  const wantsProvider = u.isProvider || u.wantsProvider || pendingProviderCookie;
  const basicsDone = u.isClient || wantsProvider;
  const providerDone = u.isProvider;
  const firstIncomplete: OnboardingStep = !basicsDone ? 1 : wantsProvider && !providerDone ? 2 : 3;
  return { wantsProvider, basicsDone, providerDone, firstIncomplete };
}

/** Pasul 2 (doar prestatori): profil, servicii, tarif, zonă, facturare. */
export async function saveProviderStep(userId: string, raw: unknown) {
  await saveProviderProfile(userId, raw);
}

export async function finishOnboarding(userId: string) {
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  if (!u) throw new DomainError("not_found", "Utilizator inexistent");
  if (u.isProvider) {
    const [p] = await db.select({ id: providerProfiles.userId }).from(providerProfiles).where(eq(providerProfiles.userId, userId));
    if (!p) throw new DomainError("profile", "Completează profilul de prestator.");
  }
  if (!u.isProvider && !u.isClient) throw new DomainError("role", "Alege cel puțin un rol.");
  await db.update(users).set({ onboardedAt: u.onboardedAt ?? new Date() }).where(eq(users.id, userId));
  await maybeActivateProvider(userId);
  await track("user.onboarded", userId, { client: u.isClient, provider: u.isProvider });
}
