import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { normalizeText, truncate } from "@/lib/text";
import { personalizeTemplate } from "../ai/features";
import { applyToProject } from "../applications/service";
import { getPlanUsage } from "../billing/plans";
import { getCatalog, rootOf } from "../catalog/taxonomy";
import { getLocality } from "../catalog/localities";
import { db } from "../db";
import {
  applications,
  autoBidExecutions,
  autoBidRules,
  projects,
  providerProfiles,
  providerServices,
  users,
  type AutoBidRule,
  type Project,
} from "../db/schema";
import { DomainError, isDomainError } from "../errors";
import { features } from "../features";
import { scoreProvidersForProject } from "../matching/run";
import { notify } from "../notifications";

/*
 * Auto Bid = prestatorul autorizează platforma să aplice în numele lui, strict în limitele setate.
 *  - nu inventăm prețuri/termene: mesajul pornește din șablonul aprobat de prestator;
 *  - maximum `maxAutoApplications` locuri automate per proiect (implicit 2 din 5);
 *  - fereastră inițială rezervată aplicărilor manuale (job-ul rulează cu întârziere);
 *  - ordinea prestatorilor este după compatibilitate, cu departajare aleatorie, nu după viteză;
 *  - clientul poate dezactiva aplicările automate; aplicările sunt marcate vizibil;
 *  - disponibil doar în planurile cu Auto Bid; aplicările automate se socotesc în aceeași limită lunară.
 */

async function autoActionsToday(providerId: string) {
  const since = new Date(Date.now() - 86_400_000);
  const [r] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(autoBidExecutions)
    .where(
      and(
        eq(autoBidExecutions.providerId, providerId),
        inArray(autoBidExecutions.status, ["applied", "proposed"]),
        gte(autoBidExecutions.createdAt, since),
      ),
    );
  return r?.n ?? 0;
}

function ruleAccepts(rule: AutoBidRule, project: Project, rootId: number, score: number, distanceKm: number | null): string | null {
  if (rule.categoryIds.length > 0 && !rule.categoryIds.includes(project.categoryId) && !rule.categoryIds.includes(rootId)) {
    return "Categorie neinclusă în regulă";
  }
  if (score < rule.minScore) return `Compatibilitate ${score}% sub pragul de ${rule.minScore}%`;
  if (!rule.workModes.includes(project.workMode)) return "Mod de lucru exclus";
  const budget = project.budgetMax ?? project.budgetMin;
  if (rule.minBudget && budget && budget < rule.minBudget) return "Buget sub minimul regulii";
  if (rule.minBudget && !budget) return "Proiect fără buget declarat";
  if (rule.maxBudget && project.budgetMin && project.budgetMin > rule.maxBudget) return "Buget peste maximul regulii";
  if (rule.maxDistanceKm && project.workMode !== "remote" && (distanceKm === null || distanceKm > rule.maxDistanceKm)) {
    return "Prea departe";
  }
  const text = normalizeText(`${project.title} ${project.description}`);
  if (rule.keywords.length > 0 && !rule.keywords.some((k) => text.includes(normalizeText(k)))) return "Niciun cuvânt cheie găsit";
  if (rule.excludeKeywords.some((k) => text.includes(normalizeText(k)))) return "Conține un cuvânt exclus";
  return null;
}

async function recordExecution(values: typeof autoBidExecutions.$inferInsert) {
  const [row] = await db.insert(autoBidExecutions).values(values).onConflictDoNothing().returning();
  return row ?? null;
}

async function buildMessage(rule: AutoBidRule, project: Project, providerId: string) {
  const catalog = await getCatalog();
  const [client] = await db.select({ name: users.name }).from(users).where(eq(users.id, project.clientId));
  const [profile] = await db.select().from(providerProfiles).where(eq(providerProfiles.userId, providerId));
  const [prov] = await db.select({ name: users.name }).from(users).where(eq(users.id, providerId));
  const services = await db.select({ title: providerServices.title }).from(providerServices).where(eq(providerServices.providerId, providerId));
  const loc = project.localityId ? await getLocality(project.localityId) : null;
  return personalizeTemplate(
    rule.template,
    {
      clientFirstName: client?.name.split(" ")[0] ?? "",
      categoryName: catalog.byId.get(project.categoryId)?.name ?? "",
      project: {
        title: project.title,
        description: project.description,
        budgetMin: project.budgetMin,
        budgetMax: project.budgetMax,
        budgetType: project.budgetType,
        workMode: project.workMode,
        localityName: loc?.name ?? null,
      },
      provider: {
        name: prov?.name ?? "",
        headline: profile?.headline ?? "",
        bio: profile?.bio ?? "",
        hourlyRate: profile?.hourlyRate ?? null,
        yearsExperience: profile?.yearsExperience ?? null,
        services: services.map((s) => s.title),
      },
    },
    rule.personalizeWithAi,
    providerId,
  );
}

/** Rulat de worker după fereastra manuală. Idempotent prin indexul unic (prestator, proiect). */
export async function runAutoBidForProject(projectId: string) {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!project || project.status !== "open" || !project.allowAutoBids) return { applied: 0, proposed: 0 };
  if (project.autoApplicationsCount >= project.maxAutoApplications) return { applied: 0, proposed: 0 };
  const catalog = await getCatalog();
  const rootId = rootOf(catalog, project.categoryId)?.id ?? project.categoryId;

  const [client] = await db.select().from(users).where(eq(users.id, project.clientId));
  const clientVerified = Boolean(client?.emailVerifiedAt && client?.phoneVerifiedAt);

  const rules = await db
    .select()
    .from(autoBidRules)
    .where(and(eq(autoBidRules.enabled, true), sql`${autoBidRules.providerId} <> ${project.clientId}`));
  if (rules.length === 0) return { applied: 0, proposed: 0 };

  const already = await db
    .select({ providerId: applications.providerId })
    .from(applications)
    .where(eq(applications.projectId, projectId));
  const appliedSet = new Set(already.map((a) => a.providerId));
  const providerIds = [...new Set(rules.map((r) => r.providerId))].filter((id) => !appliedSet.has(id));
  const scores = await scoreProvidersForProject(project, providerIds);

  // O singură regulă (cea mai permisivă care acceptă) per prestator; ordonăm după scor + departajare aleatorie.
  const candidates: { rule: AutoBidRule; score: number; distanceKm: number | null; tiebreak: number }[] = [];
  for (const providerId of providerIds) {
    const s = scores.get(providerId);
    const providerRules = rules.filter((r) => r.providerId === providerId);
    if (!s) continue;
    let chosen: AutoBidRule | null = null;
    let lastReason = "";
    for (const rule of providerRules) {
      // Fără verificare SMS, opțiunea „doar clienți cu telefon verificat” este ignorată (altfel ar bloca toate proiectele).
      if (rule.requireVerifiedClient && features.phoneVerification && !clientVerified) {
        lastReason = "Client fără telefon verificat";
        continue;
      }
      const reason = ruleAccepts(rule, project, rootId, s.score, s.distanceKm);
      if (!reason) {
        chosen = rule;
        break;
      }
      lastReason = reason;
    }
    if (chosen) candidates.push({ rule: chosen, score: s.score, distanceKm: s.distanceKm, tiebreak: Math.random() });
    else if (providerRules[0] && s.score >= 50) {
      await recordExecution({ ruleId: providerRules[0].id, providerId, projectId, status: "skipped", reason: lastReason, score: s.score });
    }
  }
  candidates.sort((a, b) => b.score - a.score || a.tiebreak - b.tiebreak);

  let applied = 0;
  let proposed = 0;
  for (const c of candidates) {
    const providerId = c.rule.providerId;
    if ((await autoActionsToday(providerId)) >= c.rule.dailyCap) {
      await recordExecution({ ruleId: c.rule.id, providerId, projectId, status: "skipped", reason: "Limita zilnică atinsă", score: c.score });
      continue;
    }
    const usage = await getPlanUsage(providerId);
    if (!usage.plan.autoBid || usage.remaining <= 0) {
      const reason = usage.plan.autoBid ? "Limita lunară a planului este atinsă" : "Planul curent nu include Auto Bid";
      await recordExecution({ ruleId: c.rule.id, providerId, projectId, status: "skipped", reason, score: c.score });
      continue;
    }

    const message = await buildMessage(c.rule, project, providerId);
    if (c.rule.mode === "review") {
      const row = await recordExecution({ ruleId: c.rule.id, providerId, projectId, status: "proposed", draftMessage: message, score: c.score });
      if (row) {
        proposed++;
        await notify({
          userId: providerId,
          type: "autobid.proposed",
          title: `Auto Bid: confirmă aplicarea la „${truncate(project.title, 60)}” (${c.score}%)`,
          body: "Mesajul este pregătit. Îl poți edita înainte de trimitere.",
          link: "/auto-bid?tab=propuneri",
          dedupeKey: `autobid-proposed:${row.id}`,
          email: {
            kind: "autobid",
            subject: `Auto Bid: proiect compatibil ${c.score}% — confirmi aplicarea?`,
            cta: "Revizuiește și trimite",
            blocks: [{ type: "card", title: project.title, lines: [`Compatibilitate ${c.score}%`] }, { type: "muted", text: truncate(message, 400) }],
          },
        });
      }
      continue;
    }

    // Mod automat: rezervăm execuția (idempotență), apoi aplicăm.
    const row = await recordExecution({ ruleId: c.rule.id, providerId, projectId, status: "applied", draftMessage: message, score: c.score });
    if (!row) continue;
    try {
      const app = await applyToProject({
        providerId,
        projectId,
        message,
        priceAmount: c.rule.priceAmount,
        priceType: c.rule.priceType,
        estimatedDays: c.rule.estimatedDays,
        isAuto: true,
        autoRuleId: c.rule.id,
      });
      await db.update(autoBidExecutions).set({ applicationId: app.id }).where(eq(autoBidExecutions.id, row.id));
      applied++;
      await notify({
        userId: providerId,
        type: "autobid.applied",
        title: `Auto Bid a aplicat la „${truncate(project.title, 60)}”`,
        body: `Compatibilitate ${c.score}%. Îți mai rămân ${usage.remaining - 1} aplicări în perioada curentă.`,
        link: "/aplicarile-mele",
        dedupeKey: `autobid-applied:${row.id}`,
        email: { kind: "autobid", subject: `Auto Bid: aplicare trimisă — ${truncate(project.title, 60)}`, blocks: [{ type: "muted", text: truncate(message, 400) }] },
      });
    } catch (err) {
      const reason = isDomainError(err) ? err.message : "Eroare la aplicare";
      await db.update(autoBidExecutions).set({ status: "failed", reason }).where(eq(autoBidExecutions.id, row.id));
      if (isDomainError(err) && ["auto_full", "full", "closed", "no_auto"].includes(err.code)) break;
      if (!isDomainError(err)) console.error("[autobid]", err);
    }
  }
  return { applied, proposed };
}

/** Prestatorul confirmă (eventual editează) o propunere din modul „review”. */
export async function confirmProposal(executionId: string, providerId: string, editedMessage?: string) {
  const [ex] = await db.select().from(autoBidExecutions).where(eq(autoBidExecutions.id, executionId));
  if (!ex || ex.providerId !== providerId) throw new DomainError("not_found", "Propunerea nu există.");
  if (ex.status !== "proposed") throw new DomainError("state", "Propunerea a fost deja procesată.");
  const [rule] = await db.select().from(autoBidRules).where(eq(autoBidRules.id, ex.ruleId));
  const [claimed] = await db
    .update(autoBidExecutions)
    .set({ status: "applied" })
    .where(and(eq(autoBidExecutions.id, executionId), eq(autoBidExecutions.status, "proposed")))
    .returning();
  if (!claimed) throw new DomainError("state", "Propunerea a fost deja procesată.");
  try {
    const app = await applyToProject({
      providerId,
      projectId: ex.projectId,
      message: (editedMessage ?? ex.draftMessage ?? "").trim(),
      priceAmount: rule?.priceAmount ?? null,
      priceType: rule?.priceType ?? "to_discuss",
      estimatedDays: rule?.estimatedDays ?? null,
      isAuto: true,
      autoRuleId: ex.ruleId,
    });
    await db.update(autoBidExecutions).set({ applicationId: app.id }).where(eq(autoBidExecutions.id, executionId));
    return app;
  } catch (err) {
    await db
      .update(autoBidExecutions)
      .set({ status: "proposed" })
      .where(eq(autoBidExecutions.id, executionId));
    throw err;
  }
}

export async function declineProposal(executionId: string, providerId: string) {
  await db
    .update(autoBidExecutions)
    .set({ status: "declined" })
    .where(and(eq(autoBidExecutions.id, executionId), eq(autoBidExecutions.providerId, providerId), eq(autoBidExecutions.status, "proposed")));
}

/** Propunerile vechi (proiect închis sau > 3 zile) expiră. */
export async function expireProposals() {
  await db.execute(sql`
    UPDATE auto_bid_executions e SET status = 'expired', updated_at = now()
    FROM projects p
    WHERE e.project_id = p.id AND e.status = 'proposed'
      AND (p.status <> 'open' OR e.created_at < now() - interval '3 days')`);
}
