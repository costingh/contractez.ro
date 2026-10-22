import { and, eq, inArray, isNull, lt, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { rules } from "@/config/site";
import { formatDate } from "@/lib/format";
import { truncate } from "@/lib/text";
import { track } from "../analytics";
import { getPlanUsage, lockUsage } from "../billing/plans";
import { db, type Tx } from "../db";
import {
  applicationEvents,
  applications,
  collaborations,
  conversations,
  messages,
  projects,
  providerProfiles,
  users,
  type Application,
} from "../db/schema";
import { DomainError } from "../errors";
import { notify } from "../notifications";
import {
  applicationHiredTemplate,
  applicationNewTemplate,
  applicationRefundedTemplate,
  applicationRejectedTemplate,
  applicationShortlistedTemplate,
} from "../email/templates";
import { systemMessage } from "../chat/service";

export type ApplyInput = {
  providerId: string;
  projectId: string;
  message: string;
  priceAmount?: number | null;
  priceType?: "fixed" | "hourly" | "monthly" | "to_discuss";
  estimatedDays?: number | null;
  isAuto?: boolean;
  autoRuleId?: string | null;
};

/** Statusurile în care o ofertă încă poate fi aleasă, respinsă, pusă pe lista scurtă sau retrasă. */
const ACTIVE_STATUSES = ["submitted", "viewed", "shortlisted"] as const;

export const applyInputSchema = z.object({
  message: z
    .string()
    .trim()
    .min(30, "Mesajul trebuie să aibă cel puțin 30 de caractere.")
    .max(5_000, "Mesajul este prea lung (cel mult 5.000 de caractere)."),
  priceAmount: z
    .number({ error: "Prețul trebuie să fie un număr." })
    .int("Prețul trebuie să fie un număr întreg de lei.")
    .min(1, "Prețul trebuie să fie de cel puțin 1 leu.")
    .max(10_000_000, "Prețul poate fi de cel mult 10.000.000 de lei.")
    .nullable()
    .optional(),
  priceType: z.enum(["fixed", "hourly", "monthly", "to_discuss"], { error: "Alege tipul prețului." }).default("to_discuss"),
  estimatedDays: z
    .number({ error: "Durata trebuie să fie un număr de zile." })
    .int("Durata trebuie să fie un număr întreg de zile.")
    .min(1, "Durata estimată trebuie să fie de cel puțin o zi.")
    .max(365, "Durata estimată poate fi de cel mult 365 de zile.")
    .nullable()
    .optional(),
});

/**
 * Aplicarea la un proiect. Într-o singură tranzacție:
 *  1. blocăm proiectul (locurile de aplicare sunt o resursă limitată),
 *  2. verificăm regulile (proiect deschis, client verificat, locuri, duplicat),
 *  3. verificăm limita lunară a planului (serializat per prestator) și creăm aplicarea,
 *  4. deschidem conversația cu propunerea ca prim mesaj.
 * Dacă orice pas eșuează, nimic nu se salvează și aplicarea nu se socotește în limită.
 */
export async function applyToProject(raw: ApplyInput): Promise<Application> {
  const parsed = applyInputSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const code = issue?.path[0] === "message" ? (issue.code === "too_small" ? "message_short" : "message_long") : "invalid";
    throw new DomainError(code, issue?.message ?? "Date invalide.");
  }
  const input = { ...raw, ...parsed.data };
  const message = parsed.data.message;

  const result = await db.transaction(async (tx) => {
    const [project] = await tx.select().from(projects).where(eq(projects.id, input.projectId)).for("update");
    if (!project) throw new DomainError("not_found", "Proiectul nu există.");
    if (project.status !== "open") throw new DomainError("closed", "Proiectul nu mai acceptă aplicări.");
    if (project.expiresAt && project.expiresAt < new Date()) throw new DomainError("expired", "Proiectul a expirat.");
    if (project.clientId === input.providerId) throw new DomainError("own_project", "Nu poți aplica la propriul proiect.");

    const [client] = await tx
      .select({ emailVerifiedAt: users.emailVerifiedAt, bannedAt: users.bannedAt })
      .from(users)
      .where(eq(users.id, project.clientId));
    if (!client?.emailVerifiedAt || client.bannedAt) {
      throw new DomainError("client_unverified", "Clientul nu și-a confirmat încă contul, așa că proiectul nu acceptă oferte. Aplicarea nu s-a socotit în limita planului tău.");
    }

    const [provider] = await tx
      .select({ isProvider: users.isProvider, emailVerifiedAt: users.emailVerifiedAt, bannedAt: users.bannedAt, issuesInvoice: users.issuesInvoice })
      .from(users)
      .where(eq(users.id, input.providerId));
    if (!provider?.isProvider) throw new DomainError("not_provider", "Doar prestatorii pot aplica.");
    if (!provider.emailVerifiedAt) throw new DomainError("provider_unverified", "Confirmă-ți emailul înainte de a aplica.");
    if (provider.bannedAt) throw new DomainError("banned", "Contul tău este suspendat.");
    if (project.invoice === "required" && !provider.issuesInvoice) {
      throw new DomainError("invoice_required", "Clientul cere factură, iar profilul tău nu indică emiterea de facturi.");
    }

    if (project.applicationsCount >= project.maxApplications) {
      throw new DomainError("full", "Toate locurile de aplicare sunt ocupate.");
    }
    if (input.isAuto) {
      if (!project.allowAutoBids) throw new DomainError("no_auto", "Clientul nu acceptă aplicări automate.");
      if (project.autoBidOpensAt && project.autoBidOpensAt > new Date()) throw new DomainError("auto_window", "Fereastra aplicărilor automate nu s-a deschis.");
      if (project.autoApplicationsCount >= project.maxAutoApplications) throw new DomainError("auto_full", "Locurile pentru aplicări automate sunt ocupate.");
    }

    const [existing] = await tx
      .select({ id: applications.id })
      .from(applications)
      .where(and(eq(applications.projectId, project.id), eq(applications.providerId, input.providerId)));
    if (existing) throw new DomainError("duplicate", "Ai aplicat deja la acest proiect.");

    await lockUsage(tx, input.providerId);
    const usage = await getPlanUsage(input.providerId, tx);
    if (input.isAuto && !usage.plan.autoBid) {
      throw new DomainError("plan_autobid", "Auto Bid este inclus în planurile Pro și Business.");
    }
    if (usage.remaining <= 0) {
      const upgrade = usage.plan.id === "business" ? "" : " Treci la un plan superior pentru mai multe aplicări.";
      throw new DomainError(
        "quota",
        `Ai folosit toate cele ${usage.limit} aplicări incluse în planul ${usage.plan.name}. Limita se reînnoiește pe ${formatDate(usage.periodEnd)}.${upgrade}`,
      );
    }

    const [app] = await tx
      .insert(applications)
      .values({
        projectId: project.id,
        providerId: input.providerId,
        message,
        priceAmount: input.priceAmount ?? null,
        priceType: input.priceType ?? "to_discuss",
        estimatedDays: input.estimatedDays ?? null,
        isAuto: Boolean(input.isAuto),
        autoRuleId: input.autoRuleId ?? null,
        boostedAt: usage.plan.highlightApplications ? new Date() : null,
      })
      .returning();

    await tx
      .update(projects)
      .set({
        applicationsCount: sql`${projects.applicationsCount} + 1`,
        autoApplicationsCount: input.isAuto ? sql`${projects.autoApplicationsCount} + 1` : projects.autoApplicationsCount,
      })
      .where(eq(projects.id, project.id));
    await tx
      .update(providerProfiles)
      .set({ applicationsCount: sql`${providerProfiles.applicationsCount} + 1` })
      .where(eq(providerProfiles.userId, input.providerId));

    const [conv] = await tx
      .insert(conversations)
      .values({
        projectId: project.id,
        applicationId: app.id,
        clientId: project.clientId,
        providerId: input.providerId,
        lastMessageAt: new Date(),
        lastMessagePreview: truncate(message, 140),
        providerLastReadAt: new Date(),
      })
      .returning();
    await tx.insert(messages).values({ conversationId: conv.id, senderId: input.providerId, body: message });
    await tx.insert(applicationEvents).values({
      applicationId: app.id,
      type: "submitted",
      actorId: input.providerId,
      data: { isAuto: Boolean(input.isAuto) },
    });
    return { app, project, conversationId: conv.id };
  });

  const [prov] = await db.select({ name: users.name }).from(users).where(eq(users.id, input.providerId));
  await notify({
    userId: result.project.clientId,
    type: "application.new",
    title: `Ofertă nouă${result.app.isAuto ? " (automată)" : ""} pentru „${truncate(result.project.title, 60)}”`,
    body: `${prov?.name ?? "Un prestator"} a trimis o ofertă.`,
    link: `/proiectele-mele/${result.project.id}`,
    dedupeKey: `application:${result.app.id}`,
    email: applicationNewTemplate({
      providerName: prov?.name ?? "Un prestator",
      projectTitle: truncate(result.project.title, 60),
      message: truncate(result.app.message, 300),
      isAuto: Boolean(result.app.isAuto),
      used: result.project.applicationsCount + 1,
      max: result.project.maxApplications,
    }),
  });
  await track("application.submitted", input.providerId, { projectId: input.projectId, isAuto: Boolean(input.isAuto) });
  return result.app;
}

async function loadForClient(applicationId: string, clientId: string, tx: Tx | typeof db = db) {
  const [row] = await tx
    .select({ app: applications, project: projects })
    .from(applications)
    .innerJoin(projects, eq(projects.id, applications.projectId))
    .where(eq(applications.id, applicationId));
  if (!row || row.project.clientId !== clientId) throw new DomainError("not_found", "Oferta nu există.");
  return row;
}

async function logEvent(tx: Tx | typeof db, applicationId: string, type: string, actorId: string, data?: Record<string, unknown>) {
  await tx.insert(applicationEvents).values({ applicationId, type, actorId, data });
}

/** Clientul deschide oferta: prestatorul vede că a fost citită. */
export async function markApplicationViewed(applicationId: string, clientId: string) {
  const { app, project } = await loadForClient(applicationId, clientId);
  if (app.viewedAt) return;
  const [updated] = await db
    .update(applications)
    .set({ viewedAt: new Date(), status: app.status === "submitted" ? "viewed" : app.status })
    .where(and(eq(applications.id, applicationId), isNull(applications.viewedAt)))
    .returning({ id: applications.id });
  if (!updated) return;
  await logEvent(db, applicationId, "viewed", clientId);
  await notify({
    userId: app.providerId,
    type: "application.viewed",
    title: `Clientul ți-a citit oferta pentru „${truncate(project.title, 60)}”`,
    link: `/aplicarile-mele`,
    dedupeKey: `application-viewed:${applicationId}`,
  });
}

export async function shortlistApplication(applicationId: string, clientId: string, on: boolean) {
  const { app, project } = await loadForClient(applicationId, clientId);
  // Condiționat: o ofertă retrasă/aleasă/respinsă între timp nu este readusă pe lista scurtă.
  const [updated] = await db
    .update(applications)
    .set({ status: on ? "shortlisted" : "viewed", viewedAt: sql`coalesce(${applications.viewedAt}, now())` })
    .where(and(eq(applications.id, applicationId), inArray(applications.status, [...ACTIVE_STATUSES])))
    .returning({ id: applications.id });
  if (!updated) throw new DomainError("state", "Oferta nu mai poate fi modificată.");
  await logEvent(db, applicationId, on ? "shortlisted" : "unshortlisted", clientId);
  if (on) {
    await notify({
      userId: app.providerId,
      type: "application.shortlisted",
      title: `Ești pe lista scurtă pentru „${truncate(project.title, 60)}”`,
      body: "Clientul ți-a selectat oferta pentru discuții.",
      link: `/aplicarile-mele`,
      dedupeKey: `application-shortlisted:${applicationId}`,
      email: applicationShortlistedTemplate({ projectTitle: truncate(project.title, 60) }),
    });
  }
}

export async function rejectApplication(applicationId: string, clientId: string, reason?: string) {
  const { app, project } = await loadForClient(applicationId, clientId);
  const [updated] = await db
    .update(applications)
    .set({ status: "rejected", decidedAt: new Date(), rejectionReason: reason?.slice(0, 500) ?? null, viewedAt: sql`coalesce(${applications.viewedAt}, now())` })
    .where(and(eq(applications.id, applicationId), inArray(applications.status, [...ACTIVE_STATUSES])))
    .returning({ id: applications.id });
  if (!updated) throw new DomainError("state", "Oferta nu mai poate fi respinsă.");
  await logEvent(db, applicationId, "rejected", clientId, { reason });
  await notify({
    userId: app.providerId,
    type: "application.rejected",
    title: `Oferta pentru „${truncate(project.title, 60)}” nu a fost selectată`,
    body: reason ? `Motiv: ${truncate(reason, 160)}` : undefined,
    link: `/aplicarile-mele`,
    dedupeKey: `application-rejected:${applicationId}`,
    email: applicationRejectedTemplate({ projectTitle: truncate(project.title, 60), reason }),
  });
}

/**
 * Blochează proiectul (SELECT … FOR UPDATE) al unei oferte. Toate operațiile care schimbă locurile sau
 * alegerea pe un proiect (aplicare, alegere, retragere, anularea colaborării) iau întâi acest blocaj, în aceeași
 * ordine, ca cererile simultane să se serializeze în loc să intre în deadlock.
 */
async function lockProjectOf(tx: Tx, applicationId: string) {
  const [ref] = await tx.select({ projectId: applications.projectId }).from(applications).where(eq(applications.id, applicationId));
  if (!ref) return null;
  const [project] = await tx.select().from(projects).where(eq(projects.id, ref.projectId)).for("update");
  return project ?? null;
}

/** Clientul alege prestatorul. Proiectul trece „în desfășurare”, iar prestatorul confirmă colaborarea. */
export async function hireApplication(applicationId: string, clientId: string) {
  const res = await db.transaction(async (tx) => {
    const project = await lockProjectOf(tx, applicationId);
    if (!project || project.clientId !== clientId) throw new DomainError("not_found", "Oferta nu există.");
    if (project.status !== "open") throw new DomainError("state", "Proiectul nu mai este deschis; ai ales deja un prestator sau proiectul s-a închis.");
    // Actualizare condiționată: doar o ofertă încă activă poate fi aleasă (o singură dată).
    const [app] = await tx
      .update(applications)
      .set({ status: "hired", decidedAt: new Date(), viewedAt: sql`coalesce(${applications.viewedAt}, now())` })
      .where(and(eq(applications.id, applicationId), inArray(applications.status, [...ACTIVE_STATUSES])))
      .returning();
    if (!app) throw new DomainError("state", "Oferta nu mai poate fi aleasă.");
    await tx.update(projects).set({ status: "in_progress" }).where(eq(projects.id, project.id));
    const [collab] = await tx
      .insert(collaborations)
      .values({ projectId: project.id, applicationId: app.id, clientId, providerId: app.providerId })
      .onConflictDoNothing()
      .returning();
    if (!collab) throw new DomainError("state", "Există deja o colaborare pentru acest proiect.");
    await logEvent(tx, app.id, "hired", clientId);
    const others = await tx
      .update(applications)
      .set({ status: "rejected", decidedAt: new Date(), rejectionReason: "Clientul a ales alt prestator." })
      .where(and(eq(applications.projectId, project.id), ne(applications.id, app.id), inArray(applications.status, [...ACTIVE_STATUSES])))
      .returning({ id: applications.id, providerId: applications.providerId });
    return { app, project, collab, others };
  });
  const [conv] = await db.select({ id: conversations.id }).from(conversations).where(eq(conversations.applicationId, res.app.id));
  if (conv) await systemMessage(conv.id, "✅ Clientul a ales această ofertă. Confirmați colaborarea din pagina Colaborări.");
  await notify({
    userId: res.app.providerId,
    type: "application.hired",
    title: `🎉 Ai fost ales pentru „${truncate(res.project.title, 60)}”`,
    body: "Confirmă colaborarea ca să puteți lăsa recenzii la final.",
    link: `/colaborari`,
    dedupeKey: `application-hired:${res.app.id}`,
    email: applicationHiredTemplate({ projectTitle: truncate(res.project.title, 60) }),
  });
  for (const o of res.others) {
    await notify({
      userId: o.providerId,
      type: "application.rejected",
      title: `Clientul a ales alt prestator pentru „${truncate(res.project.title, 60)}”`,
      link: `/aplicarile-mele`,
      dedupeKey: `application-rejected:${o.id}`,
    });
  }
  await track("application.hired", clientId, { applicationId });
  return res.collab;
}

/**
 * Prestatorul își retrage oferta: clientul nu o mai vede, iar locul de pe proiect se eliberează
 * (`applications_count` scade în aceeași tranzacție). Aplicarea rămâne socotită în limita lunară a planului.
 */
export async function withdrawApplication(applicationId: string, providerId: string) {
  await db.transaction(async (tx) => {
    const project = await lockProjectOf(tx, applicationId);
    if (!project) throw new DomainError("not_found", "Aplicarea nu există.");
    const [app] = await tx
      .update(applications)
      .set({ status: "withdrawn", decidedAt: new Date() })
      .where(and(eq(applications.id, applicationId), eq(applications.providerId, providerId), inArray(applications.status, [...ACTIVE_STATUSES])))
      .returning({ id: applications.id, isAuto: applications.isAuto });
    if (!app) {
      const [own] = await tx.select({ id: applications.id }).from(applications).where(and(eq(applications.id, applicationId), eq(applications.providerId, providerId)));
      if (!own) throw new DomainError("not_found", "Aplicarea nu există.");
      throw new DomainError("state", "Aplicarea nu mai poate fi retrasă.");
    }
    await tx
      .update(projects)
      .set({
        applicationsCount: sql`greatest(${projects.applicationsCount} - 1, 0)`,
        autoApplicationsCount: app.isAuto ? sql`greatest(${projects.autoApplicationsCount} - 1, 0)` : projects.autoApplicationsCount,
      })
      .where(eq(projects.id, project.id));
    await logEvent(tx, applicationId, "withdrawn", providerId);
  });
}

/**
 * Restituie o aplicare (proiect fraudulos, duplicat, politică „nevăzut”): nu se mai socotește în limita
 * lunară a planului. Idempotent: întoarce 1 doar la prima restituire.
 */
export async function refundApplication(applicationId: string, opts: { reason: string; actorId?: string }) {
  return db.transaction(async (tx) => {
    const [app] = await tx
      .update(applications)
      .set({ status: "refunded" })
      .where(and(eq(applications.id, applicationId), ne(applications.status, "refunded")))
      .returning({ id: applications.id, providerId: applications.providerId });
    if (!app) return 0;
    await logEvent(tx, app.id, "refunded", opts.actorId ?? app.providerId, { reason: opts.reason });
    return 1;
  });
}

export async function refundAllForProject(projectId: string, reason: string, actorId?: string) {
  const apps = await db.select().from(applications).where(eq(applications.projectId, projectId));
  let total = 0;
  for (const a of apps) {
    const n = await refundApplication(a.id, { reason, actorId });
    if (n > 0) {
      total += n;
      await notify({
        userId: a.providerId,
        type: "application.refunded",
        title: "Ți-am restituit o aplicare",
        body: `${reason} Aplicarea nu se mai socotește în limita planului.`,
        link: "/abonament",
        dedupeKey: `refund:${a.id}`,
        email: applicationRefundedTemplate({ reason }),
      });
    }
  }
  return total;
}

/** Politică de test: dacă clientul nu deschide oferta în N zile, restituim aplicarea. */
export async function refundUnseenApplications() {
  const cutoff = new Date(Date.now() - rules.unseenRefundDays * 86_400_000);
  const stale = await db
    .select({ id: applications.id, providerId: applications.providerId })
    .from(applications)
    .where(and(eq(applications.status, "submitted"), isNull(applications.viewedAt), lt(applications.createdAt, cutoff)))
    .limit(500);
  for (const a of stale) {
    const n = await refundApplication(a.id, { reason: `Clientul nu a deschis oferta în ${rules.unseenRefundDays} zile.` });
    if (n > 0) {
      await notify({
        userId: a.providerId,
        type: "application.refunded",
        title: "Aplicare restituită: oferta nu a fost deschisă",
        body: `Clientul nu a văzut oferta în ${rules.unseenRefundDays} zile, așa că aplicarea nu se mai socotește în limita planului.`,
        link: "/abonament",
        dedupeKey: `refund-unseen:${a.id}`,
      });
    }
  }
  return stale.length;
}

/** Clientul poate redeschide selecția cu încă N locuri. */
export async function reopenSelection(projectId: string, clientId: string) {
  const [p] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!p || p.clientId !== clientId) throw new DomainError("not_found", "Proiectul nu există.");
  if (p.status !== "open") throw new DomainError("state", "Proiectul nu este deschis.");
  if (p.maxApplications >= rules.maxApplicationsCap) throw new DomainError("cap", "Ai atins numărul maxim de locuri.");
  await db
    .update(projects)
    .set({ maxApplications: Math.min(p.maxApplications + rules.reopenIncrement, rules.maxApplicationsCap) })
    .where(eq(projects.id, projectId));
}
