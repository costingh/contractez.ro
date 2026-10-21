"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { formBool, formNum, formStr, toActionError, type ActionState } from "@/lib/action";
import { SOCIAL_KEYS } from "@/lib/social-links";
import { requireUser } from "@/server/auth/guards";
import { getCatalog, skillsForCategory } from "@/server/catalog/taxonomy";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { finishOnboarding, saveBasics, saveProviderStep } from "@/server/onboarding";
import { addService } from "@/server/providers/service";

/**
 * Câmpurile `social.<rețea>` (doar în formularul din /profil). Dacă lipsesc cu totul, linkurile
 * existente rămân neschimbate. Valorile multiple pentru aceeași rețea sunt unite, ca validarea să
 * le respingă (un singur link per rețea).
 */
function parseSocialLinks(fd: FormData) {
  if (!SOCIAL_KEYS.some((k) => fd.has(`social.${k}`))) return undefined;
  return Object.fromEntries(
    SOCIAL_KEYS.map((k) => [
      k,
      fd
        .getAll(`social.${k}`)
        .map((v) => (typeof v === "string" ? v.trim() : ""))
        .filter(Boolean)
        .join(" "),
    ]),
  );
}

/** Transformă formularul de profil prestator în obiectul validat de `providerProfileSchema`. */
function parseProviderForm(fd: FormData) {
  const str = (k: string) => {
    const v = formStr(fd, k).trim();
    return v === "" ? null : v;
  };
  return {
    headline: formStr(fd, "headline"),
    bio: formStr(fd, "bio"),
    pricingModel: formStr(fd, "pricingModel") || "hourly",
    hourlyRate: formNum(fd, "hourlyRate"),
    minProjectBudget: formNum(fd, "minProjectBudget"),
    remote: formBool(fd, "remote"),
    onSite: formBool(fd, "onSite"),
    travelRadiusKm: formNum(fd, "travelRadiusKm") ?? 25,
    localityId: formNum(fd, "localityId"),
    yearsExperience: formNum(fd, "yearsExperience"),
    languages: fd.getAll("languages").map(String).filter(Boolean),
    availability: formStr(fd, "availability") || "available",
    hoursPerWeek: formNum(fd, "hoursPerWeek"),
    websiteUrl: str("websiteUrl"),
    socialLinks: parseSocialLinks(fd),
    certifications: str("certifications"),
    categoryIds: fd.getAll("categoryIds").map(Number).filter((n) => Number.isFinite(n) && n > 0),
    skills: fd.getAll("skills").map(String).filter(Boolean),
    issuesInvoice: formBool(fd, "issuesInvoice"),
    legalEntity: formStr(fd, "legalEntity") || "none",
    companyName: str("companyName"),
    companyCui: str("companyCui")?.replace(/\s/g, "") ?? null,
  };
}

export async function saveBasicsAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const user = await requireUser("/onboarding");
    const isProvider = formBool(fd, "isProvider");
    await saveBasics(user.id, {
      name: formStr(fd, "name"),
      isClient: formBool(fd, "isClient"),
      isProvider,
      localityId: formNum(fd, "localityId"),
    });
    // Ținem minte că vrea să fie prestator până își salvează profilul (rolul se activează abia atunci).
    const jar = await cookies();
    if (isProvider) jar.set("onb_rol", "prestator", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 30 * 86_400 });
    else jar.delete("onb_rol");
    revalidatePath("/onboarding");
    redirect(isProvider ? "/onboarding?pas=2" : "/onboarding?pas=3");
  } catch (err) {
    return toActionError(err);
  }
}

/** Folosit și de onboarding (pasul 2), și de pagina de profil. */
export async function saveProviderProfileAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const user = await requireUser("/onboarding");
    await saveProviderStep(user.id, parseProviderForm(fd));
    revalidatePath("/profil");
    revalidatePath("/panou");
    (await cookies()).delete("onb_rol");
    if (formStr(fd, "context") === "onboarding") redirect("/onboarding?pas=3");
    return { ok: true, message: "Profilul a fost salvat." };
  } catch (err) {
    return toActionError(err);
  }
}

/** Competențele sugerate pentru categoriile alese (din taxonomie, fără AI). */
export async function suggestSkillsAction(categoryIds: number[]): Promise<string[]> {
  await requireUser();
  const catalog = await getCatalog();
  const names = new Set<string>();
  for (const id of categoryIds.slice(0, 8)) {
    for (const s of skillsForCategory(catalog, id)) names.add(s.name);
  }
  return [...names].slice(0, 40);
}

export async function addFirstServiceAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const user = await requireUser("/onboarding");
    await addService(user.id, {
      categoryId: formNum(fd, "categoryId"),
      title: formStr(fd, "title"),
      description: formStr(fd, "description"),
      priceFrom: formNum(fd, "priceFrom"),
      priceUnit: formStr(fd, "priceUnit") || "hour",
    });
    revalidatePath("/onboarding");
    revalidatePath("/profil");
    return { ok: true, message: "Serviciul a fost adăugat. Poți adăuga altele din profil." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function finishOnboardingAction(): Promise<ActionState> {
  try {
    const user = await requireUser("/onboarding");
    await finishOnboarding(user.id);
    const [u] = await db.select({ isClient: users.isClient, isProvider: users.isProvider }).from(users).where(eq(users.id, user.id));
    revalidatePath("/", "layout");
    if (u?.isProvider && u?.isClient) redirect("/panou");
    if (u?.isProvider) redirect("/recomandari");
    redirect("/proiecte/nou?welcome=1");
  } catch (err) {
    return toActionError(err);
  }
}
