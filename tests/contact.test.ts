import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { formatPhone, normalizePhone } from "@/lib/phone";
import { applyToProject, hireApplication } from "@/server/applications/service";
import { counterpartContacts, setContactPhone } from "@/server/contact";
import { db } from "@/server/db";
import { categories, projects, providerProfiles, users } from "@/server/db/schema";
import { features } from "@/server/features";
import { getPublicCard } from "@/server/providers/public-card";
import { parseProjectFilters, projectFiltersSchema, searchProjects } from "@/server/search/projects";
import { cancelCollaboration, completeCollaboration, confirmCollaboration } from "@/server/trust/service";
import { createTestUser } from "./helpers";

const initialFlag = features.phoneVerification;
afterEach(() => {
  features.phoneVerification = initialFlag;
});

const msg = "Bună ziua! Am realizat multe lucrări asemănătoare și vă pot ajuta rapid și corect.";
let seq = 0;
/** Numere unice per test (mobil RO valid), ca verificările „nu apare” să nu se bazeze pe coincidențe. */
const nextPhone = () => `+4072${String(1_000_000 + Math.floor(Math.random() * 8_000_000) + seq++).padStart(7, "0")}`;

async function openProject(clientId: string, overrides: Partial<typeof projects.$inferInsert> = {}) {
  const [cat] = await db.select().from(categories).where(eq(categories.slug, "dezvoltare-web"));
  const [p] = await db
    .insert(projects)
    .values({
      clientId,
      title: "Magazin online pentru o florărie",
      description: "Avem nevoie de un magazin online cu plăți, livrare și administrare simplă a produselor.",
      categoryId: cat.id,
      status: "open",
      budgetType: "fixed",
      budgetMin: 3000,
      budgetMax: 5000,
      workMode: "remote",
      // În viitorul apropiat: proiectul e primul la sortarea „cele mai noi”.
      publishedAt: new Date(Date.now() + 60_000),
      expiresAt: new Date(Date.now() + 86_400_000),
      ...overrides,
    })
    .returning();
  return p;
}

async function setup() {
  const client = await createTestUser({ isClient: true, name: "Client Contact", phone: nextPhone() });
  const provider = await createTestUser({ isProvider: true, name: "Prestator Contact", phone: nextPhone() });
  await db.insert(providerProfiles).values({ userId: provider.id, slug: `contact-${provider.id}` });
  const project = await openProject(client.id);
  const app = await applyToProject({ providerId: provider.id, projectId: project.id, message: msg });
  return { client, provider, project, app };
}

describe("normalizePhone", () => {
  it("normalizează formatele românești în E.164", () => {
    expect(normalizePhone("0712 345 678")).toBe("+40712345678");
    expect(normalizePhone("0712.345.678")).toBe("+40712345678");
    expect(normalizePhone("+40 712-345-678")).toBe("+40712345678");
    expect(normalizePhone("0040712345678")).toBe("+40712345678");
    expect(normalizePhone("40712345678")).toBe("+40712345678");
    expect(normalizePhone("021 123 4567")).toBe("+40211234567");
    expect(normalizePhone("(0264) 123 456")).toBe("+40264123456");
  });

  it("acceptă numere internaționale și respinge formatele greșite", () => {
    expect(normalizePhone("+44 20 7946 0958")).toBe("+442079460958");
    expect(normalizePhone("0049 30 1234567")).toBe("+49301234567");
    expect(normalizePhone("0712 345")).toBeNull();
    expect(normalizePhone("+40 812 345 678")).toBeNull();
    expect(normalizePhone("telefon")).toBeNull();
    expect(normalizePhone("+0712345678")).toBeNull();
    expect(normalizePhone("")).toBeNull();
  });

  it("afișează numerele românești grupat", () => {
    expect(formatPhone("+40712345678")).toBe("+40 712 345 678");
    expect(formatPhone("+442079460958")).toBe("+442079460958");
  });
});

describe("telefon de contact fără SMS", () => {
  it("salvează numărul normalizat, fără să-l marcheze verificat", async () => {
    features.phoneVerification = false;
    const u = await createTestUser();
    expect(await setContactPhone(u.id, "0722 111 222")).toBe("+40722111222");
    const [after] = await db.select().from(users).where(eq(users.id, u.id));
    expect(after.phone).toBe("+40722111222");
    expect(after.phoneVerifiedAt).toBeNull();
  });

  it("un număr nou anulează o verificare veche; câmpul gol șterge numărul", async () => {
    features.phoneVerification = false;
    const u = await createTestUser({ phone: "+40722000111", phoneVerifiedAt: new Date() });
    await setContactPhone(u.id, "0722 000 111"); // același număr: verificarea rămâne
    let [after] = await db.select().from(users).where(eq(users.id, u.id));
    expect(after.phoneVerifiedAt).not.toBeNull();
    await setContactPhone(u.id, "0722 000 222");
    [after] = await db.select().from(users).where(eq(users.id, u.id));
    expect(after.phoneVerifiedAt).toBeNull();
    await setContactPhone(u.id, "  ");
    [after] = await db.select().from(users).where(eq(users.id, u.id));
    expect(after.phone).toBeNull();
  });

  it("respinge numerele invalide", async () => {
    features.phoneVerification = false;
    const u = await createTestUser();
    await expect(setContactPhone(u.id, "12345")).rejects.toMatchObject({ code: "invalid_phone" });
  });

  it("cu SMS activ, numărul se setează doar prin cod OTP", async () => {
    features.phoneVerification = true;
    const u = await createTestUser();
    await expect(setContactPhone(u.id, "0722 111 222")).rejects.toMatchObject({ code: "phone_verification" });
  });
});

describe("datele de contact în colaborări", () => {
  it("telefonul nu apare înainte ca clientul să aleagă oferta", async () => {
    const { client, provider, app } = await setup();
    expect(await counterpartContacts(client.id)).toEqual([]);
    expect(await counterpartContacts(provider.id)).toEqual([]);
    expect(await counterpartContacts(client.id, { applicationIds: [app.id] })).toEqual([]);
  });

  it("după alegere, dar înainte de confirmarea prestatorului, datele de contact nu apar", async () => {
    const { client, provider, app } = await setup();
    const collab = await hireApplication(app.id, client.id);
    expect(collab?.status).toBe("pending_confirmation");
    expect(await counterpartContacts(client.id, { applicationIds: [app.id] })).toEqual([]);
    expect(await counterpartContacts(client.id)).toEqual([]);
    expect(await counterpartContacts(provider.id)).toEqual([]);
  });

  it("după confirmarea prestatorului, fiecare parte vede telefonul și emailul celeilalte", async () => {
    const { client, provider, app } = await setup();
    const collab = await hireApplication(app.id, client.id);
    expect(collab).toBeTruthy();
    await confirmCollaboration(collab!.id, provider.id);

    const forClient = await counterpartContacts(client.id, { applicationIds: [app.id] });
    expect(forClient).toHaveLength(1);
    expect(forClient[0]).toMatchObject({ userId: provider.id, phone: provider.phone, email: provider.email, collaborationId: collab!.id });

    const forProvider = await counterpartContacts(provider.id);
    expect(forProvider).toHaveLength(1);
    expect(forProvider[0]).toMatchObject({ userId: client.id, phone: client.phone, email: client.email });

    expect(await counterpartContacts(client.id, { collaborationIds: [collab!.id] })).toHaveLength(1);
  });

  it("colaborarea finalizată păstrează accesul la datele de contact", async () => {
    const { client, provider, app } = await setup();
    const collab = await hireApplication(app.id, client.id);
    await confirmCollaboration(collab!.id, provider.id);
    await completeCollaboration(collab!.id, client.id);
    expect(await counterpartContacts(client.id, { collaborationIds: [collab!.id] })).toHaveLength(1);
    expect(await counterpartContacts(provider.id, { collaborationIds: [collab!.id] })).toHaveLength(1);
  });

  it("alți utilizatori și colaborările anulate nu primesc datele de contact", async () => {
    const { client, provider, app } = await setup();
    const outsider = await createTestUser({ isProvider: true });
    const collab = await hireApplication(app.id, client.id);
    await confirmCollaboration(collab!.id, provider.id);
    expect(await counterpartContacts(client.id)).toHaveLength(1);
    expect(await counterpartContacts(outsider.id)).toEqual([]);
    expect(await counterpartContacts(outsider.id, { collaborationIds: [collab!.id] })).toEqual([]);

    await cancelCollaboration(collab!.id, client.id);
    expect(await counterpartContacts(client.id)).toEqual([]);
    expect(await counterpartContacts(provider.id)).toEqual([]);
  });

  it("căutarea publică și cardul public nu conțin numărul de telefon", async () => {
    const { client, provider, app } = await setup();
    await hireApplication(app.id, client.id);
    // Un alt proiect deschis al aceluiași client apare în căutare.
    await openProject(client.id, { title: "Al doilea proiect al clientului" });
    const results = await searchProjects(projectFiltersSchema.parse({}));
    expect(results.rows.some((r) => r.project.clientId === client.id)).toBe(true);
    expect(JSON.stringify(results)).not.toContain(client.phone!.slice(3));
    const card = await getPublicCard(`contact-${provider.id}`);
    expect(card).not.toBeNull();
    expect(JSON.stringify(card)).not.toContain(provider.phone!.slice(3));
  });
});

describe("filtrul „telefon verificat” fără SMS", () => {
  it("parametrul verified=1 este ignorat și nu ascunde proiectele", async () => {
    features.phoneVerification = false;
    expect(parseProjectFilters({ verified: "1" }).verified).toBeUndefined();

    const client = await createTestUser({ isClient: true, phone: "+40733000111", phoneVerifiedAt: null });
    const p = await openProject(client.id);
    const results = await searchProjects(projectFiltersSchema.parse({ verified: "1" }));
    expect(results.rows.some((r) => r.project.id === p.id)).toBe(true);
  });

  it("insigna „telefon verificat” nu apare, chiar dacă există date vechi", async () => {
    const client = await createTestUser({ isClient: true, phoneVerifiedAt: new Date() });
    const p = await openProject(client.id);

    features.phoneVerification = true;
    let row = (await searchProjects(projectFiltersSchema.parse({}))).rows.find((r) => r.project.id === p.id);
    expect(row?.clientPhoneVerified).toBe(true);

    features.phoneVerification = false;
    row = (await searchProjects(projectFiltersSchema.parse({}))).rows.find((r) => r.project.id === p.id);
    expect(row?.clientPhoneVerified).toBe(false);
  });
});
