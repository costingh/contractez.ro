import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { parseServiceForm } from "@/lib/service-form";
import { typicalPriceUnit, unitFromPriceRange } from "@/server/catalog/options";
import { db } from "@/server/db";
import { categories, providerServices, users } from "@/server/db/schema";
import { isDomainError } from "@/server/errors";
import { onboardingProgress, saveBasics } from "@/server/onboarding";
import { addService, updateService } from "@/server/providers/service";
import { createTestUser } from "./helpers";

const user = (p: Partial<{ isClient: boolean; isProvider: boolean; wantsProvider: boolean }>) => ({ isClient: false, isProvider: false, wantsProvider: false, ...p });

describe("reluarea onboarding-ului", () => {
  it("pornește de la primul pas nesalvat", () => {
    expect(onboardingProgress(user({})).firstIncomplete).toBe(1);
    // Prestator care a salvat pasul 1, dar nu și profilul: continuă cu profilul.
    expect(onboardingProgress(user({ wantsProvider: true })).firstIncomplete).toBe(2);
    // Profilul de prestator salvat (cazul testerului): direct la pasul 3.
    expect(onboardingProgress(user({ isProvider: true })).firstIncomplete).toBe(3);
    expect(onboardingProgress(user({ isClient: true })).firstIncomplete).toBe(3);
    expect(onboardingProgress(user({ isClient: true, wantsProvider: true })).firstIncomplete).toBe(2);
    // Compatibilitate cu cookie-ul vechi `onb_rol`.
    expect(onboardingProgress(user({}), true).firstIncomplete).toBe(2);
  });

  it("salvează intenția de prestator în cont, ca reluarea să meargă și pe alt dispozitiv", async () => {
    const u = await createTestUser({ onboardedAt: null });
    await saveBasics(u.id, { name: "Ana Pop", isClient: false, isProvider: true, localityId: null });
    const [row] = await db.select().from(users).where(eq(users.id, u.id));
    expect(row.wantsProvider).toBe(true);
    expect(row.isProvider).toBe(false);
    expect(onboardingProgress(row)).toMatchObject({ basicsDone: true, providerDone: false, firstIncomplete: 2 });
  });
});

describe("editarea serviciilor", () => {
  async function setup() {
    const [cat] = await db.select().from(categories).where(eq(categories.slug, "site-prezentare"));
    const owner = await createTestUser({ isProvider: true });
    await addService(owner.id, { categoryId: cat.id, title: "Landing page", description: "", priceFrom: 1500, priceUnit: "hour" });
    const [svc] = await db.select().from(providerServices).where(eq(providerServices.providerId, owner.id));
    return { cat, owner, svc };
  }

  it("proprietarul își poate modifica serviciul", async () => {
    const { cat, owner, svc } = await setup();
    await updateService(owner.id, svc.id, { categoryId: cat.id, title: "Landing page de vânzare", description: "Design + texte", priceFrom: 1800, priceUnit: "project" });
    const [after] = await db.select().from(providerServices).where(eq(providerServices.id, svc.id));
    expect(after).toMatchObject({ title: "Landing page de vânzare", description: "Design + texte", priceFrom: 1800, priceUnit: "project" });
  });

  it("nu poate modifica serviciul altcuiva", async () => {
    const { cat, svc } = await setup();
    const intruder = await createTestUser({ isProvider: true });
    const err = await updateService(intruder.id, svc.id, { categoryId: cat.id, title: "Preluat", priceFrom: 1, priceUnit: "project" }).catch((e) => e);
    expect(isDomainError(err)).toBe(true);
    const [after] = await db.select().from(providerServices).where(eq(providerServices.id, svc.id));
    expect(after.title).toBe("Landing page");
  });

  it("folosește aceeași validare ca la adăugare", async () => {
    const { cat, owner, svc } = await setup();
    const err = await updateService(owner.id, svc.id, { categoryId: cat.id, title: "x", priceUnit: "project" }).catch((e) => e);
    expect(err).toBeInstanceOf(ZodError);
  });

  it("fără unitate aleasă nu presupune „oră”", () => {
    const fd = new FormData();
    fd.set("categoryId", "1");
    fd.set("title", "Landing page");
    expect(parseServiceForm(fd).priceUnit).toBe("project");
  });
});

describe("unitatea de preț sugerată", () => {
  it("se deduce din prețurile orientative ale categoriei", () => {
    expect(unitFromPriceRange("1.500–4.000 lei")).toBe("project");
    expect(unitFromPriceRange("80–150 lei/oră")).toBe("hour");
    expect(unitFromPriceRange("60–120 lei/mp")).toBe("sqm");
    expect(unitFromPriceRange("500–1.500 lei/lună")).toBe("month");
    expect(unitFromPriceRange("40–80 lei/persoană")).toBeNull();

    expect(typicalPriceUnit(["site-prezentare"])).toBe("project");
    expect(typicalPriceUnit(["meditatii"])).toBe("hour");
    expect(typicalPriceUnit(["gresie-faianta"])).toBe("sqm");
    expect(typicalPriceUnit(["categorie-necunoscuta"])).toBe("project");
  });
});
