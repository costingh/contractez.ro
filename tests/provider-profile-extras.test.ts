import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { toActionError } from "@/lib/action";
import { db } from "@/server/db";
import { categories, providerProfiles } from "@/server/db/schema";
import { saveProviderProfile, setProviderCover, socialLinksSchema } from "@/server/providers/service";
import { createTestUser } from "./helpers";

async function baseInput() {
  const [cat] = await db.select().from(categories).where(eq(categories.slug, "logo-identitate"));
  return {
    headline: "Designer de logo-uri",
    bio: "Creez identități vizuale pentru afaceri locale de peste cinci ani, remote.",
    pricingModel: "fixed",
    minProjectBudget: 500,
    remote: true,
    onSite: false,
    categoryIds: [cat.id],
    skills: ["Logo"],
    issuesInvoice: false,
    legalEntity: "none",
  };
}

async function profile(userId: string) {
  const [p] = await db.select().from(providerProfiles).where(eq(providerProfiles.userId, userId));
  return p;
}

describe("linkuri sociale pe profilul de prestator", () => {
  it("salvează linkurile normalizate, fără câmpurile goale", async () => {
    const u = await createTestUser({ isProvider: true });
    await saveProviderProfile(u.id, {
      ...(await baseInput()),
      socialLinks: { linkedin: "linkedin.com/in/ana-pop/", instagram: "@ana.pop", github: "", youtube: null },
    });
    expect((await profile(u.id)).socialLinks).toEqual({
      linkedin: "https://linkedin.com/in/ana-pop",
      instagram: "https://www.instagram.com/ana.pop",
    });
  });

  it("păstrează linkurile când formularul nu le trimite și le șterge când câmpul e gol", async () => {
    const u = await createTestUser({ isProvider: true });
    const input = await baseInput();
    await saveProviderProfile(u.id, { ...input, socialLinks: { github: "ana-pop", behance: "anapop" } });
    await saveProviderProfile(u.id, input); // ex. formularul din onboarding
    expect((await profile(u.id)).socialLinks).toEqual({ github: "https://github.com/ana-pop", behance: "https://www.behance.net/anapop" });
    await saveProviderProfile(u.id, { ...input, socialLinks: { github: "", behance: "https://www.behance.net/anapop" } });
    expect((await profile(u.id)).socialLinks).toEqual({ behance: "https://www.behance.net/anapop" });
  });

  it("respinge linkurile invalide cu eroare pe câmpul rețelei și nu salvează nimic", async () => {
    const u = await createTestUser({ isProvider: true });
    const input = await baseInput();
    await saveProviderProfile(u.id, { ...input, socialLinks: { github: "ana-pop" } });
    const attempt = saveProviderProfile(u.id, {
      ...input,
      headline: "Titlu care nu trebuie salvat",
      socialLinks: { linkedin: "https://www.facebook.com/ana", github: "http://github.com/ana" },
    });
    const error = await attempt.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ZodError);
    const state = toActionError(error);
    expect(state.fieldErrors?.["socialLinks.linkedin"]).toMatch(/linkedin\.com/);
    expect(state.fieldErrors?.["socialLinks.github"]).toMatch(/https/);
    const p = await profile(u.id);
    expect(p.headline).toBe("Designer de logo-uri");
    expect(p.socialLinks).toEqual({ github: "https://github.com/ana-pop" });
  });

  it("acceptă doar rețelele cunoscute", () => {
    expect(socialLinksSchema.safeParse({ myspace: "https://myspace.com/ana" }).success).toBe(false);
    expect(socialLinksSchema.safeParse({ dribbble: "anapop" })).toMatchObject({ success: true, data: { dribbble: "https://dribbble.com/anapop" } });
  });
});

describe("coperta profilului", () => {
  it("setează, înlocuiește și elimină coperta", async () => {
    const u = await createTestUser({ isProvider: true });
    await saveProviderProfile(u.id, await baseInput());
    const p0 = await profile(u.id);
    expect(p0.coverPath).toBeNull();
    expect(await setProviderCover(u.id, "public/covers/a.jpg")).toBe(p0.slug);
    expect((await profile(u.id)).coverPath).toBe("public/covers/a.jpg");
    await setProviderCover(u.id, "public/covers/b.webp");
    expect((await profile(u.id)).coverPath).toBe("public/covers/b.webp");
    await setProviderCover(u.id, null);
    expect((await profile(u.id)).coverPath).toBeNull();
  });

  it("cere un profil de prestator", async () => {
    const u = await createTestUser();
    await expect(setProviderCover(u.id, "public/covers/a.jpg")).rejects.toThrow(/profilul de prestator/);
  });
});
