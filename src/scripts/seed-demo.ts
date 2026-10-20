/**
 * Date demo pentru dezvoltare: `pnpm db:seed-demo`.
 * Creează (idempotent) un admin, clienți, prestatori din mai multe domenii și proiecte deschise.
 * Parola pentru toate conturile: `parola123`.
 */
import { eq, sql } from "drizzle-orm";
import { hashPassword } from "@/server/auth/crypto";
import { activeSubscription, grantCompPlan } from "@/server/billing/plans";
import { getCatalog } from "@/server/catalog/taxonomy";
import { findLocalityByName } from "@/server/catalog/localities";
import { db, pg } from "@/server/db";
import { notificationPreferences, projectSkills, projects, providerServices, users } from "@/server/db/schema";
import { saveProviderProfile } from "@/server/providers/service";
import { normalizeText } from "@/lib/text";

const PASSWORD = "parola123";

const demoPlans: Record<string, "pro" | "business"> = { "dev@demo.ro": "pro", "designer@demo.ro": "pro", "seo@demo.ro": "business" };

type DemoUser = { email: string; name: string; role?: "admin"; client?: boolean; provider?: boolean; phone?: boolean; city: string };

const people: DemoUser[] = [
  { email: "admin@demo.ro", name: "Admin Demo", role: "admin", client: true, city: "Municipiul Bucuresti" },
  { email: "client@demo.ro", name: "Ioana Popescu", client: true, phone: true, city: "Cluj-Napoca" },
  { email: "client2@demo.ro", name: "Mihai Ionescu", client: true, city: "Municipiul Bucuresti" },
  { email: "dev@demo.ro", name: "Andrei Dumitru", provider: true, phone: true, city: "Cluj-Napoca" },
  { email: "designer@demo.ro", name: "Elena Stan", provider: true, city: "Iasi" },
  { email: "seo@demo.ro", name: "Radu Marinescu", provider: true, phone: true, city: "Municipiul Bucuresti" },
  { email: "instalator@demo.ro", name: "Vasile Georgescu", provider: true, phone: true, city: "Cluj-Napoca" },
  { email: "electrician@demo.ro", name: "Cristian Moldovan", provider: true, city: "Floresti/CJ" },
  { email: "renovari@demo.ro", name: "Florin Pop", provider: true, client: true, city: "Municipiul Bucuresti" },
];

const providerProfilesData: Record<string, { cats: string[]; headline: string; bio: string; rate: number | null; min?: number; remote: boolean; onSite: boolean; radius?: number; invoice: boolean; le: "none" | "pfa" | "srl"; skills: string[]; years: number; services: { cat: string; title: string; price: number; unit: "hour" | "project" | "sqm" | "day" }[] }> = {
  "dev@demo.ro": {
    cats: ["dezvoltare-web", "site-prezentare", "magazin-online"],
    headline: "Full-stack developer · React, Next.js, WordPress",
    bio: "Construiesc site-uri de prezentare, magazine online și aplicații web de 8 ani. Am lucrat cu restaurante, clinici și firme de construcții. Livrez rapid, cu SEO tehnic inclus și suport după lansare.",
    rate: 120,
    min: 1500,
    remote: true,
    onSite: false,
    invoice: true,
    le: "pfa",
    skills: ["React", "Next.js", "WordPress", "WooCommerce", "TypeScript"],
    years: 8,
    services: [
      { cat: "site-prezentare", title: "Site de prezentare WordPress", price: 2000, unit: "project" },
      { cat: "magazin-online", title: "Magazin online WooCommerce", price: 4500, unit: "project" },
      { cat: "dezvoltare-web", title: "Aplicații web Next.js", price: 120, unit: "hour" },
    ],
  },
  "designer@demo.ro": {
    cats: ["logo-identitate", "ui-ux"],
    headline: "Designer UI/UX și identitate vizuală",
    bio: "Creez logo-uri, identități vizuale și interfețe în Figma pentru startup-uri și afaceri locale. Lucrez remote, cu 3 runde de revizii incluse.",
    rate: 90,
    remote: true,
    onSite: false,
    invoice: false,
    le: "none",
    skills: ["Logo", "Figma", "Brand book", "Design site"],
    years: 5,
    services: [{ cat: "logo-identitate", title: "Logo + manual de brand", price: 900, unit: "project" }],
  },
  "seo@demo.ro": {
    cats: ["seo", "reclame-online", "social-media"],
    headline: "Specialist SEO & Google Ads",
    bio: "Ajut afacerile locale să apară pe Google: SEO on-page, SEO local, campanii Google Ads și Facebook Ads. Rapoarte lunare clare, fără contracte pe termen lung.",
    rate: 150,
    min: 800,
    remote: true,
    onSite: false,
    invoice: true,
    le: "srl",
    skills: ["SEO on-page", "SEO local", "Google Ads", "Facebook Ads", "Google Analytics"],
    years: 7,
    services: [{ cat: "seo", title: "Pachet SEO lunar", price: 1500, unit: "project" }],
  },
  "instalator@demo.ro": {
    cats: ["instalatii-sanitare", "instalatii-termice"],
    headline: "Instalator autorizat · sanitare și termice",
    bio: "Montaj și reparații instalații sanitare, centrale termice, calorifere. Intervenții rapide în Cluj și împrejurimi, inclusiv în weekend.",
    rate: 100,
    remote: false,
    onSite: true,
    radius: 40,
    invoice: true,
    le: "pfa",
    skills: ["Instalator", "Centrale termice", "Calorifere", "Desfundare canalizare"],
    years: 15,
    services: [{ cat: "instalatii-sanitare", title: "Montaj obiecte sanitare", price: 150, unit: "project" }],
  },
  "electrician@demo.ro": {
    cats: ["instalatii-electrice", "smart-home"],
    headline: "Electrician autorizat ANRE",
    bio: "Instalații electrice complete pentru apartamente și case, tablouri electrice, prize și iluminat, camere de supraveghere.",
    rate: 110,
    remote: false,
    onSite: true,
    radius: 30,
    invoice: true,
    le: "srl",
    skills: ["Electrician", "Tablouri electrice", "Autorizat ANRE", "Camere supraveghere"],
    years: 10,
    services: [{ cat: "instalatii-electrice", title: "Instalație electrică apartament", price: 45, unit: "sqm" }],
  },
  "renovari@demo.ro": {
    cats: ["renovari-complete", "finisaje", "gresie-faianta"],
    headline: "Echipă renovări apartamente · București și Ilfov",
    bio: "Renovări complete la cheie: demolări, instalații, rigips, glet, zugrăveli, gresie și faianță. Echipă de 4 oameni, devize transparente.",
    rate: null,
    min: 5000,
    remote: false,
    onSite: true,
    radius: 50,
    invoice: true,
    le: "srl",
    skills: ["Renovare apartament", "Rigips", "Glet", "Montaj gresie", "Zugrăveli"],
    years: 12,
    services: [{ cat: "renovari-complete", title: "Renovare completă apartament", price: 450, unit: "sqm" }],
  },
};

const demoProjects: { client: string; cat: string; title: string; description: string; budgetType: "fixed" | "hourly" | "monthly" | "unknown"; min?: number; max?: number; mode: "remote" | "on_site" | "hybrid"; city?: string; invoice: "required" | "preferred" | "not_needed"; urgency: "flexible" | "this_month" | "this_week" | "urgent"; skills: string[] }[] = [
  {
    client: "client@demo.ro",
    cat: "site-prezentare",
    title: "Site de prezentare pentru restaurant, cu meniu și rezervări",
    description:
      "Avem un restaurant în centrul Clujului și vrem un site nou: pagină de prezentare, meniu actualizabil de noi, galerie foto, formular de rezervare și integrare cu Google Maps. Avem logo și poze. Ne-ar plăcea să fie gata în 3-4 săptămâni.",
    budgetType: "fixed",
    min: 2000,
    max: 3500,
    mode: "remote",
    invoice: "required",
    urgency: "this_month",
    skills: ["WordPress", "Landing page"],
  },
  {
    client: "client@demo.ro",
    cat: "instalatii-sanitare",
    title: "Înlocuire baterii și sifoane în baie și bucătărie",
    description:
      "Am nevoie de un instalator pentru înlocuirea a două baterii (baie și bucătărie), un sifon de chiuvetă și verificarea unei scurgeri mici la vasul WC. Apartament în Mănăștur, etaj 3 cu lift. Piesele le pot cumpăra eu sau le aduce instalatorul.",
    budgetType: "fixed",
    max: 600,
    mode: "on_site",
    city: "Cluj-Napoca",
    invoice: "preferred",
    urgency: "this_week",
    skills: ["Instalator", "Montaj obiecte sanitare"],
  },
  {
    client: "client2@demo.ro",
    cat: "seo",
    title: "Promovare online pentru pensiune în Buzău",
    description:
      "Avem o pensiune cu 8 camere și vrem mai multe rezervări directe. Avem site, dar nu apare pe Google. Ne interesează SEO local, Google Business Profile și poate reclame pe Facebook/Instagram. Buget de până la 200 EUR pe lună.",
    budgetType: "monthly",
    max: 1000,
    mode: "remote",
    invoice: "required",
    urgency: "flexible",
    skills: ["SEO local", "Facebook Ads"],
  },
  {
    client: "client2@demo.ro",
    cat: "renovari-complete",
    title: "Renovare completă apartament 2 camere, Sector 3",
    description:
      "Apartament de 52 mp, bloc din 1980. Vrem renovare completă: refacere instalație electrică, sanitare, rigips pe holul principal, glet și zugrăveli, gresie și faianță în baie și bucătărie, parchet. Materialele le alegem împreună. Am vrea să începem luna viitoare.",
    budgetType: "fixed",
    min: 25000,
    max: 40000,
    mode: "on_site",
    city: "Municipiul Bucuresti",
    invoice: "required",
    urgency: "this_month",
    skills: ["Renovare apartament", "Rigips", "Montaj gresie"],
  },
  {
    client: "admin@demo.ro",
    cat: "logo-identitate",
    title: "Logo și identitate vizuală pentru o cafenea nouă",
    description:
      "Deschidem o cafenea de specialitate și avem nevoie de logo, paletă de culori, fonturi și câteva aplicații: pahare, meniu, cont de Instagram. Stil minimalist, cald. Ne putem vedea online.",
    budgetType: "fixed",
    min: 800,
    max: 1500,
    mode: "remote",
    invoice: "not_needed",
    urgency: "flexible",
    skills: ["Logo", "Brand book"],
  },
];

async function main() {
  const catalog = await getCatalog();
  const hash = await hashPassword(PASSWORD);
  const ids: Record<string, string> = {};

  for (const p of people) {
    const [cityName, county] = p.city.split("/");
    const loc = await findLocalityByName(cityName, county);
    const [existing] = await db.select().from(users).where(sql`lower(${users.email}) = ${p.email}`);
    const values = {
      email: p.email,
      name: p.name,
      passwordHash: hash,
      role: p.role ?? ("user" as const),
      isClient: Boolean(p.client),
      emailVerifiedAt: new Date(),
      phone: p.phone ? `+4072${Math.floor(1000000 + Math.random() * 8999999)}` : null,
      phoneVerifiedAt: p.phone ? new Date() : null,
      localityId: loc?.id ?? null,
      lat: loc?.lat ?? null,
      lng: loc?.lng ?? null,
      onboardedAt: new Date(),
    };
    const [u] = existing
      ? await db.update(users).set(values).where(eq(users.id, existing.id)).returning()
      : await db.insert(users).values(values).returning();
    ids[p.email] = u.id;
    await db.insert(notificationPreferences).values({ userId: u.id }).onConflictDoNothing();

    const prof = providerProfilesData[p.email];
    if (p.provider && prof) {
      await saveProviderProfile(u.id, {
        headline: prof.headline,
        bio: prof.bio,
        pricingModel: prof.rate ? "hourly" : "fixed",
        hourlyRate: prof.rate,
        minProjectBudget: prof.min ?? null,
        remote: prof.remote,
        onSite: prof.onSite,
        travelRadiusKm: prof.radius ?? 25,
        localityId: loc?.id ?? null,
        yearsExperience: prof.years,
        languages: ["ro", "en"],
        availability: "available",
        categoryIds: prof.cats.map((s) => catalog.bySlug.get(s)!.id),
        skills: prof.skills,
        issuesInvoice: prof.invoice,
        legalEntity: prof.le,
        companyName: prof.le === "none" ? null : `${p.name.split(" ")[1]} ${prof.le.toUpperCase()}`,
        companyCui: prof.le === "none" ? null : "RO12345678",
      });
      await db.delete(providerServices).where(eq(providerServices.providerId, u.id));
      for (const [i, s] of prof.services.entries()) {
        await db.insert(providerServices).values({ providerId: u.id, categoryId: catalog.bySlug.get(s.cat)!.id, title: s.title, priceFrom: s.price, priceUnit: s.unit, sortOrder: i });
      }
      await db.update(users).set({ welcomeCreditsGrantedAt: new Date() }).where(eq(users.id, u.id));
      // Planuri demo (oferite, fără plată): Pro pentru Auto Bid, Business pentru profil promovat; restul pe Gratuit.
      const demoPlan = demoPlans[p.email];
      if (demoPlan && !(await activeSubscription(u.id))) await grantCompPlan(u.id, demoPlan, 365);
    }
  }

  for (const dp of demoProjects) {
    const clientId = ids[dp.client];
    const [exists] = await db.select({ id: projects.id }).from(projects).where(sql`${projects.clientId} = ${clientId} AND ${projects.title} = ${dp.title}`);
    if (exists) continue;
    const loc = dp.city ? await findLocalityByName(dp.city) : null;
    const cat = catalog.bySlug.get(dp.cat)!;
    const now = new Date();
    const [p] = await db
      .insert(projects)
      .values({
        clientId,
        title: dp.title,
        description: dp.description,
        categoryId: cat.id,
        status: "open",
        budgetType: dp.budgetType,
        budgetMin: dp.min ?? null,
        budgetMax: dp.max ?? null,
        workMode: dp.mode,
        localityId: loc?.id ?? null,
        lat: loc?.lat ?? null,
        lng: loc?.lng ?? null,
        radiusKm: 50,
        invoice: dp.invoice,
        urgency: dp.urgency,
        publishedAt: now,
        autoBidOpensAt: new Date(now.getTime() + 30 * 60_000),
        expiresAt: new Date(now.getTime() + 30 * 86_400_000),
        aiSummary: dp.description.slice(0, 200),
        quality: { score: 85, missing: [], questions: [], budgetInsight: null, summary: dp.description.slice(0, 200), checkedAt: now.toISOString(), source: "rules" },
        searchText: normalizeText(`${dp.title} ${dp.description} ${cat.name} ${loc?.name ?? ""}`),
      })
      .returning();
    const skillIds = dp.skills.map((n) => catalog.skills.find((s) => s.name === n)?.id).filter((x): x is number => Boolean(x));
    if (skillIds.length) await db.insert(projectSkills).values(skillIds.map((skillId) => ({ projectId: p.id, skillId }))).onConflictDoNothing();
    // Matching inline (fără worker), ca recomandările să apară imediat.
    const { runMatchingForProject } = await import("@/server/matching/run");
    const r = await runMatchingForProject(p.id);
    console.log(`Proiect: ${dp.title} → ${r.matched} potriviri`);
  }

  console.log(`\nConturi demo (parola: ${PASSWORD}):`);
  for (const p of people) console.log(`  ${p.email.padEnd(24)} ${p.role === "admin" ? "admin" : p.provider ? "prestator" : "client"}`);
  await pg.end();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
