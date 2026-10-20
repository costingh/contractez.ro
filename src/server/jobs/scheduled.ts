import { and, eq, gte, inArray, isNull, lt, sql } from "drizzle-orm";
import { truncate } from "@/lib/text";
import { describeBudget, suggestProviderSkills } from "../ai/features";
import { refundUnseenApplications } from "../applications/service";
import { expireProposals } from "../autobid/engine";
import { getCatalog, skillsForCategory } from "../catalog/taxonomy";
import { db } from "../db";
import {
  notificationPreferences,
  projectMatches,
  projectSkills,
  projects,
  providerProfiles,
  providerServices,
  providerSkills,
  sessions,
  skills,
  users,
  verificationTokens,
} from "../db/schema";
import { renderEmail, type EmailBlock } from "../email/layout";
import { queueEmail } from "../email/send";
import { env } from "../env";
import { notify } from "../notifications";
import { expireProjects } from "../projects/service";
import { refreshProviderSearchText, refreshResponseTimes } from "../providers/service";
import { normalizeText } from "@/lib/text";
import { recheckVerifiedCompanies } from "../verification/anaf";

/** Digest cu proiectele compatibile pentru cei care au ales rezumat zilnic/săptămânal. */
export async function sendMatchDigests(frequency: "daily" | "weekly") {
  const since = new Date(Date.now() - (frequency === "daily" ? 1 : 7) * 86_400_000);
  const recipients = await db
    .select({ userId: notificationPreferences.userId, minScore: notificationPreferences.minMatchScore, email: users.email, name: users.name })
    .from(notificationPreferences)
    .innerJoin(users, eq(users.id, notificationPreferences.userId))
    .where(and(eq(notificationPreferences.matchFrequency, frequency), eq(users.isProvider, true), isNull(users.bannedAt), isNull(users.deletedAt)));
  let sent = 0;
  for (const r of recipients) {
    const matches = await db
      .select({ match: projectMatches, project: projects })
      .from(projectMatches)
      .innerJoin(projects, eq(projects.id, projectMatches.projectId))
      .where(
        and(
          eq(projectMatches.providerId, r.userId),
          isNull(projectMatches.digestedAt),
          isNull(projectMatches.notifiedAt),
          gte(projectMatches.createdAt, since),
          gte(projectMatches.score, r.minScore),
          eq(projects.status, "open"),
        ),
      )
      .orderBy(sql`${projectMatches.score} DESC`)
      .limit(10);
    if (matches.length === 0) continue;
    const blocks: EmailBlock[] = [
      { type: "p", text: `Am găsit ${matches.length} proiecte compatibile cu profilul tău.` },
      ...matches.map(
        (m): EmailBlock => ({
          type: "card",
          title: m.project.title,
          href: `${env.APP_URL}/proiecte/${m.project.id}`,
          meta: `Compatibilitate ${m.match.score}%`,
          lines: [describeBudget(m.project), truncate(m.project.aiSummary ?? m.project.description, 160)],
        }),
      ),
      { type: "button", text: "Vezi toate recomandările", href: `${env.APP_URL}/recomandari` },
    ];
    await queueEmail({
      to: r.email,
      userId: r.userId,
      template: `digest-${frequency}`,
      subject: `${matches.length} proiecte noi potrivite pentru tine`,
      html: renderEmail({ heading: frequency === "daily" ? "Recomandările zilei" : "Recomandările săptămânii", blocks }),
      dedupeKey: `digest:${frequency}:${r.userId}:${new Date().toISOString().slice(0, 10)}`,
    });
    await db
      .update(projectMatches)
      .set({ digestedAt: new Date() })
      .where(inArray(projectMatches.id, matches.map((m) => m.match.id)));
    sent++;
  }
  return sent;
}

/** Proiecte fără aplicări după 48h: sugestii pentru client. */
export async function nudgeProjectsWithoutApplications() {
  const rows = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.status, "open"),
        eq(projects.applicationsCount, 0),
        lt(projects.publishedAt, new Date(Date.now() - 48 * 3_600_000)),
        gte(projects.publishedAt, new Date(Date.now() - 72 * 3_600_000)),
      ),
    )
    .limit(200);
  for (const p of rows) {
    const tips = [...(p.quality?.missing ?? [])].slice(0, 3);
    if (p.budgetType === "unknown") tips.push("Adaugă un buget orientativ — proiectele cu buget primesc mai multe oferte.");
    if (p.invoice === "required") tips.push("Dacă factura nu este obligatorie, schimb-o în „preferabil” ca să ajungi la mai mulți prestatori.");
    if (p.workMode === "on_site" && p.radiusKm < 50) tips.push("Mărește raza acceptată pentru prestatori.");
    await notify({
      userId: p.clientId,
      type: "project.no_applications",
      title: `Încă nicio ofertă pentru „${truncate(p.title, 50)}”`,
      body: "Câteva ajustări pot crește numărul de oferte.",
      link: `/proiectele-mele/${p.id}`,
      dedupeKey: `nudge:${p.id}`,
      email: {
        kind: "applications",
        subject: "Cum poți primi mai multe oferte",
        cta: "Editează proiectul",
        blocks: [
          { type: "p", text: "Proiectul tău nu a primit încă oferte. Recomandările noastre:" },
          ...(tips.length ? tips : ["Distribuie linkul proiectului în grupurile în care ești activ."]).map((t): EmailBlock => ({ type: "p", text: `• ${t}` })),
        ],
      },
    });
  }
  return rows.length;
}

/** Completează competențele unui proiect publicat fără competențe (AI sau reguli). */
export async function enrichProject(projectId: string) {
  const [p] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!p) return;
  const existing = await db.select().from(projectSkills).where(eq(projectSkills.projectId, projectId));
  if (existing.length > 0) return;
  const catalog = await getCatalog();
  const candidates = skillsForCategory(catalog, p.categoryId);
  const text = normalizeText(`${p.title} ${p.description}`);
  let names = candidates.filter((s) => text.includes(normalizeText(s.name))).map((s) => s.name);
  if (names.length === 0) {
    names = await suggestProviderSkills({ headline: p.title, bio: p.description, services: [], categoryIds: [p.categoryId] }, p.clientId);
  }
  const ids = candidates.filter((s) => names.includes(s.name)).map((s) => s.id).slice(0, 6);
  if (ids.length) await db.insert(projectSkills).values(ids.map((skillId) => ({ projectId, skillId }))).onConflictDoNothing();
}

export async function enrichProviderSkills(providerId: string) {
  const existing = await db.select().from(providerSkills).where(eq(providerSkills.providerId, providerId));
  if (existing.length > 0) return;
  const [p] = await db.select().from(providerProfiles).where(eq(providerProfiles.userId, providerId));
  if (!p) return;
  const cats = await db.execute<{ category_id: number }>(sql`SELECT category_id FROM provider_categories WHERE provider_id = ${providerId}`);
  const services = await db.select({ title: providerServices.title }).from(providerServices).where(eq(providerServices.providerId, providerId));
  const names = await suggestProviderSkills(
    { headline: p.headline, bio: p.bio, services: services.map((s) => s.title), categoryIds: (cats as unknown as { category_id: number }[]).map((c) => c.category_id) },
    providerId,
  );
  if (names.length === 0) return;
  const rows = await db.select({ id: skills.id }).from(skills).where(inArray(skills.name, names));
  if (rows.length) {
    await db.insert(providerSkills).values(rows.map((r) => ({ providerId, skillId: r.id }))).onConflictDoNothing();
    await refreshProviderSearchText(providerId);
  }
}

export async function maintenance() {
  const expired = await expireProjects();
  await expireProposals();
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  await db.delete(verificationTokens).where(lt(verificationTokens.expiresAt, new Date(Date.now() - 7 * 86_400_000)));
  await refreshResponseTimes();
  const nudged = await nudgeProjectsWithoutApplications();
  const anaf = await recheckVerifiedCompanies().catch((e) => ({ error: (e as Error).message }));
  return { expired, nudged, anaf };
}

export { refundUnseenApplications };
