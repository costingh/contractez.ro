import { and, eq, gte, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { rules } from "@/config/site";
import { normalizeText } from "@/lib/text";
import { checkProjectQuality, generateShareText } from "../ai/features";
import { aiModerate } from "../ai/client";
import { detectContactInfo, stripContactInfo } from "../ai/rules";
import { track } from "../analytics";
import { refundAllForProject } from "../applications/service";
import { sha256 } from "../auth/crypto";
import { categoryPath, getCatalog } from "../catalog/taxonomy";
import { getLocality } from "../catalog/localities";
import { db } from "../db";
import { moderationActions, projectSkills, projectStatusHistory, projects, skills, users, type Project } from "../db/schema";
import { env } from "../env";
import { DomainError } from "../errors";
import { notify } from "../notifications";
import { enqueue } from "../queue";
import { slugify } from "@/lib/text";

export const projectInputSchema = z
  .object({
    title: z.string().trim().min(8, "Titlul este prea scurt").max(120),
    description: z.string().trim().min(40, "Descrie proiectul în cel puțin câteva propoziții").max(8_000),
    categoryId: z.coerce.number().int().positive("Alege o categorie"),
    budgetType: z.enum(["fixed", "hourly", "monthly", "unknown"]),
    budgetMin: z.coerce.number().int().min(0).max(10_000_000).nullable().optional(),
    budgetMax: z.coerce.number().int().min(0).max(10_000_000).nullable().optional(),
    estimatedHours: z.coerce.number().int().min(1).max(10_000).nullable().optional(),
    workMode: z.enum(["remote", "on_site", "hybrid"]),
    localityId: z.coerce.number().int().positive().nullable().optional(),
    radiusKm: z.coerce.number().int().min(1).max(500).default(50),
    invoice: z.enum(["required", "preferred", "not_needed"]),
    urgency: z.enum(["flexible", "this_month", "this_week", "urgent"]),
    startDate: z.coerce.date().nullable().optional(),
    durationText: z.string().trim().max(120).nullable().optional(),
    skills: z.array(z.string().trim().min(2).max(60)).max(10).default([]),
    attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
    allowAutoBids: z.boolean().default(true),
    source: z.enum(["web", "import"]).default("web"),
    sourceText: z.string().max(10_000).nullable().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.workMode !== "remote" && !v.localityId) {
      ctx.addIssue({ code: "custom", path: ["localityId"], message: "Alege localitatea pentru lucrările la fața locului" });
    }
    if (v.budgetMin && v.budgetMax && v.budgetMin > v.budgetMax) {
      ctx.addIssue({ code: "custom", path: ["budgetMax"], message: "Bugetul maxim trebuie să fie mai mare decât minimul" });
    }
  });

export type ProjectInput = z.infer<typeof projectInputSchema>;

async function resolveSkillIds(names: string[]): Promise<number[]> {
  const catalog = await getCatalog();
  const ids: number[] = [];
  for (const name of names) {
    const slug = slugify(name);
    const found = catalog.skillsBySlug.get(slug) ?? catalog.skills.find((s) => normalizeText(s.name) === normalizeText(name));
    if (found) ids.push(found.id);
    else {
      const [created] = await db.insert(skills).values({ slug, name: name.trim() }).onConflictDoNothing().returning({ id: skills.id });
      if (created) ids.push(created.id);
      else {
        const [existing] = await db.select({ id: skills.id }).from(skills).where(eq(skills.slug, slug));
        if (existing) ids.push(existing.id);
      }
    }
  }
  return [...new Set(ids)];
}

function contentHash(clientId: string, title: string, description: string) {
  return sha256(`${clientId}:${normalizeText(title)}:${normalizeText(description).slice(0, 400)}`);
}

/**
 * Creează sau actualizează un proiect. `publish=true` îl trimite la publicare, cu verificări:
 * email confirmat, duplicat, moderare, date de contact eliminate și scor de calitate.
 */
export async function saveProject(clientId: string, raw: unknown, opts: { projectId?: string; publish: boolean }) {
  const input = projectInputSchema.parse(raw);
  const [client] = await db.select().from(users).where(eq(users.id, clientId));
  if (!client) throw new DomainError("not_found", "Utilizator inexistent");

  const catalog = await getCatalog();
  const category = catalog.byId.get(input.categoryId);
  if (!category) throw new DomainError("category", "Categoria nu există.");
  const loc = input.localityId ? await getLocality(input.localityId) : null;

  const contacts = detectContactInfo(`${input.title}\n${input.description}`);
  const description = stripContactInfo(input.description);
  const title = stripContactInfo(input.title);
  const hash = contentHash(clientId, title, description);
  const skillIds = await resolveSkillIds(input.skills);

  let existing: Project | undefined;
  if (opts.projectId) {
    [existing] = await db.select().from(projects).where(eq(projects.id, opts.projectId));
    if (!existing || existing.clientId !== clientId) throw new DomainError("not_found", "Proiectul nu există.");
    if (!["draft", "pending_review", "open"].includes(existing.status)) throw new DomainError("state", "Proiectul nu mai poate fi editat.");
  }

  const values = {
    clientId,
    title,
    description,
    categoryId: input.categoryId,
    budgetType: input.budgetType,
    budgetMin: input.budgetType === "unknown" ? null : (input.budgetMin ?? null),
    budgetMax: input.budgetType === "unknown" ? null : (input.budgetMax ?? null),
    estimatedHours: input.estimatedHours ?? null,
    workMode: input.workMode,
    localityId: loc?.id ?? null,
    lat: loc?.lat ?? null,
    lng: loc?.lng ?? null,
    radiusKm: input.radiusKm,
    invoice: input.invoice,
    urgency: input.urgency,
    startDate: input.startDate ?? null,
    durationText: input.durationText ?? null,
    attributes: input.attributes,
    allowAutoBids: input.allowAutoBids,
    source: input.source,
    sourceText: input.sourceText ?? null,
    contentHash: hash,
    searchText: normalizeText(`${title} ${description} ${category.name} ${loc?.name ?? ""}`),
  };

  const project = await db.transaction(async (tx) => {
    let p: Project;
    if (existing) {
      [p] = await tx.update(projects).set(values).where(eq(projects.id, existing.id)).returning();
    } else {
      [p] = await tx.insert(projects).values({ ...values, status: "draft" }).returning();
      await tx.insert(projectStatusHistory).values({ projectId: p.id, toStatus: "draft", actorId: clientId });
    }
    await tx.delete(projectSkills).where(eq(projectSkills.projectId, p.id));
    if (skillIds.length) await tx.insert(projectSkills).values(skillIds.map((skillId) => ({ projectId: p.id, skillId })));
    return p;
  });

  const quality = await checkProjectQuality(
    {
      title,
      description,
      budgetMin: values.budgetMin,
      budgetMax: values.budgetMax,
      budgetType: values.budgetType,
      workMode: values.workMode,
      localityId: values.localityId,
      urgency: values.urgency,
      skillsCount: skillIds.length,
      categoryName: categoryPath(catalog, input.categoryId),
      localityName: loc?.name ?? null,
      invoice: input.invoice,
    },
    clientId,
  );
  await db
    .update(projects)
    .set({
      quality: { ...quality, checkedAt: new Date().toISOString() },
      aiSummary: quality.summary,
    })
    .where(eq(projects.id, project.id));

  // Proiect deja deschis, modificat în câmpurile care contează pentru potrivire → refacem matching-ul.
  // Prestatorii deja anunțați nu primesc din nou notificare (notifiedAt).
  if (existing?.status === "open") {
    const changed =
      existing.categoryId !== values.categoryId ||
      existing.workMode !== values.workMode ||
      existing.localityId !== values.localityId ||
      existing.radiusKm !== values.radiusKm ||
      existing.invoice !== values.invoice ||
      existing.budgetMax !== values.budgetMax ||
      existing.budgetMin !== values.budgetMin ||
      existing.title !== values.title;
    if (changed) await enqueue("matching", { projectId: existing.id }, { jobId: `match-${existing.id}-${Date.now()}` });
  }

  const warnings: string[] = [];
  if (contacts.phones.length || contacts.emails.length) {
    warnings.push("Am ascuns datele de contact din descriere. Prestatorii vă vor contacta prin chat-ul platformei.");
  }

  if (!opts.publish) return { project: { ...project, quality }, status: project.status, warnings };
  const status = await publishProject(project.id, clientId);
  return { project: { ...project, quality }, status, warnings };
}

/** Publică un proiect sau îl trimite la moderare. Returnează statusul rezultat. */
export async function publishProject(projectId: string, clientId: string): Promise<Project["status"]> {
  const [p] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!p || p.clientId !== clientId) throw new DomainError("not_found", "Proiectul nu există.");
  if (p.status === "open") return "open";
  const [client] = await db.select().from(users).where(eq(users.id, clientId));
  if (!client?.emailVerifiedAt) {
    throw new DomainError("email_unverified", "Confirmă adresa de email ca să poți publica proiectul. Ți-am trimis un link de confirmare.");
  }

  // Duplicat: același text publicat de același client în ultimele 30 de zile.
  const [dup] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        eq(projects.contentHash, p.contentHash ?? ""),
        ne(projects.id, p.id),
        sql`${projects.status} IN ('open','pending_review','in_progress')`,
        gte(projects.createdAt, new Date(Date.now() - 30 * 86_400_000)),
      ),
    )
    .limit(1);

  const moderation = await aiModerate(`${p.title}\n${p.description}`);
  const accountAgeHours = (Date.now() - client.createdAt.getTime()) / 3_600_000;
  const [{ recent }] = await db
    .select({ recent: sql<number>`count(*)::int` })
    .from(projects)
    .where(and(eq(projects.clientId, clientId), gte(projects.publishedAt, new Date(Date.now() - 86_400_000))));

  let review: string | null = null;
  if (dup) review = "Posibil duplicat al unui proiect existent";
  else if (moderation.flagged) review = `Conținut semnalat automat: ${moderation.categories.join(", ")}`;
  else if (recent >= 5) review = "Multe proiecte publicate în ultimele 24 de ore";
  else if (accountAgeHours < 1 && recent >= 2) review = "Cont nou cu publicări multiple";

  const now = new Date();
  if (review) {
    await setStatus(p, "pending_review", clientId, review, { moderationNote: review });
    return "pending_review";
  }
  await setStatus(p, "open", clientId, null, {
    publishedAt: now,
    autoBidOpensAt: new Date(now.getTime() + rules.autoBidDelayMinutes * 60_000),
    expiresAt: new Date(now.getTime() + rules.projectLifetimeDays * 86_400_000),
    maxApplications: p.maxApplications || rules.defaultMaxApplications,
  });
  await afterOpened(p.id);
  await track("project.published", clientId, { projectId: p.id, categoryId: p.categoryId });
  return "open";
}

async function setStatus(p: Project, to: Project["status"], actorId: string | null, reason: string | null, extra: Partial<typeof projects.$inferInsert> = {}) {
  await db.transaction(async (tx) => {
    await tx.update(projects).set({ status: to, ...extra }).where(eq(projects.id, p.id));
    await tx.insert(projectStatusHistory).values({ projectId: p.id, fromStatus: p.status, toStatus: to, actorId, reason });
  });
}

/** Declanșează matching-ul (imediat) și Auto Bid-ul (după fereastra rezervată oamenilor). */
async function afterOpened(projectId: string) {
  await enqueue("matching", { projectId }, { jobId: `match-${projectId}` });
  await enqueue("autobid", { projectId }, { jobId: `autobid-${projectId}`, delay: rules.autoBidDelayMinutes * 60_000 });
  await enqueue("ai", { kind: "project-enrich", projectId }, { jobId: `enrich-${projectId}` });
}

export async function closeProject(projectId: string, clientId: string, outcome: "closed" | "cancelled", reason?: string) {
  const [p] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!p || p.clientId !== clientId) throw new DomainError("not_found", "Proiectul nu există.");
  if (["closed", "cancelled", "removed"].includes(p.status)) return;
  await setStatus(p, outcome, clientId, reason ?? null, { closedAt: new Date() });
}

/* ------------------------------- Moderare ------------------------------- */

export async function approveProject(projectId: string, adminId: string) {
  const [p] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!p) throw new DomainError("not_found", "Proiectul nu există.");
  if (p.status !== "pending_review" && p.status !== "draft") return;
  const now = new Date();
  await setStatus(p, "open", adminId, "Aprobat de moderator", {
    publishedAt: now,
    autoBidOpensAt: new Date(now.getTime() + rules.autoBidDelayMinutes * 60_000),
    expiresAt: new Date(now.getTime() + rules.projectLifetimeDays * 86_400_000),
    moderationNote: null,
  });
  await db.insert(moderationActions).values({ adminId, action: "approve_project", targetType: "project", targetId: projectId });
  await notify({
    userId: p.clientId,
    type: "project.approved",
    title: `Proiectul „${p.title}” a fost publicat`,
    link: `/proiectele-mele/${p.id}`,
    dedupeKey: `project-approved:${p.id}`,
    email: { kind: "system", subject: "Proiectul tău a fost publicat", blocks: [{ type: "p", text: "Am verificat proiectul și l-am publicat. Prestatorii compatibili primesc acum notificări." }] },
  });
  await afterOpened(p.id);
}

/** Elimină un proiect (fraudă, duplicat, spam). Aplicările prestatorilor sunt restituite (nu se socotesc în limita planului). */
export async function removeProject(projectId: string, adminId: string, reason: string) {
  const [p] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!p) throw new DomainError("not_found", "Proiectul nu există.");
  await setStatus(p, "removed", adminId, reason, { closedAt: new Date(), moderationNote: reason });
  await db.insert(moderationActions).values({ adminId, action: "remove_project", targetType: "project", targetId: projectId, note: reason });
  const refunded = await refundAllForProject(projectId, `Proiectul a fost eliminat de moderatori: ${reason}`, adminId);
  await notify({
    userId: p.clientId,
    type: "project.removed",
    title: `Proiectul „${p.title}” a fost eliminat`,
    body: reason,
    dedupeKey: `project-removed:${p.id}`,
  });
  return refunded;
}

/* ---------------------------- Distribuire ---------------------------- */

export async function getOrCreateShareText(projectId: string, userId: string) {
  const [p] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!p || p.clientId !== userId) throw new DomainError("not_found", "Proiectul nu există.");
  if (p.shareText) return p.shareText;
  const catalog = await getCatalog();
  const loc = p.localityId ? await getLocality(p.localityId) : null;
  const text = await generateShareText(
    {
      title: p.title,
      summary: p.description,
      categoryName: catalog.byId.get(p.categoryId)?.name ?? "prestator",
      workMode: p.workMode,
      localityName: loc?.name ?? null,
      budgetMax: p.budgetMax,
      url: `${env.APP_URL}/proiecte/${p.id}?utm_source=share`,
    },
    userId,
  );
  await db.update(projects).set({ shareText: text }).where(eq(projects.id, p.id));
  return text;
}

/** Expiră proiectele vechi (rulat periodic de worker). */
export async function expireProjects() {
  const rows = await db
    .update(projects)
    .set({ status: "closed", closedAt: new Date() })
    .where(and(eq(projects.status, "open"), sql`${projects.expiresAt} < now()`))
    .returning({ id: projects.id, clientId: projects.clientId, title: projects.title });
  for (const r of rows) {
    await db.insert(projectStatusHistory).values({ projectId: r.id, fromStatus: "open", toStatus: "closed", reason: "Expirat" });
    await notify({
      userId: r.clientId,
      type: "project.expired",
      title: `Proiectul „${r.title}” a expirat`,
      body: "Îl poți republica oricând din „Proiectele mele”.",
      link: `/proiectele-mele/${r.id}`,
      dedupeKey: `project-expired:${r.id}`,
    });
  }
  return rows.length;
}
