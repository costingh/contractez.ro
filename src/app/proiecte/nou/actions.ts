"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ProjectFormState, ProjectFormValues, QualityView } from "@/components/project-form/types";
import { toActionError } from "@/lib/action";
import { buildProjectDraft, checkProjectQuality } from "@/server/ai/features";
import { requireOnboardedUser } from "@/server/auth/guards";
import { findLocalityByName, getLocality } from "@/server/catalog/localities";
import { categoryPath, getCatalog, getCategoryAttributes, skillsForCategory } from "@/server/catalog/taxonomy";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { DomainError } from "@/server/errors";
import { saveProject } from "@/server/projects/service";

function toNum(v: string): number | null {
  const s = v.replace(/\s/g, "").replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : null;
}

/** Convertește starea formularului în inputul acceptat de `projectInputSchema`. */
function toInput(v: ProjectFormValues) {
  const remote = v.workMode === "remote";
  return {
    title: v.title,
    description: v.description,
    categoryId: v.categoryId ?? 0,
    budgetType: v.budgetType,
    budgetMin: v.budgetType === "unknown" ? null : toNum(v.budgetMin),
    budgetMax: v.budgetType === "unknown" ? null : toNum(v.budgetMax),
    estimatedHours: toNum(v.estimatedHours),
    workMode: v.workMode,
    localityId: remote ? null : (v.locality?.id ?? null),
    radiusKm: v.radiusKm || 50,
    invoice: v.invoice,
    urgency: v.urgency,
    startDate: v.startDate ? v.startDate : null,
    durationText: v.durationText.trim() || null,
    skills: v.skills,
    attributes: v.attributes,
    allowAutoBids: v.allowAutoBids,
    source: v.source,
    sourceText: v.sourceText,
  };
}

/** Prima publicare activează automat rolul de client. */
async function ensureClientRole(userId: string, isClient: boolean) {
  if (!isClient) await db.update(users).set({ isClient: true }).where(eq(users.id, userId));
}

export async function saveProjectAction(_: ProjectFormState, fd: FormData): Promise<ProjectFormState> {
  try {
    const user = await requireOnboardedUser("/proiecte/nou");
    const values = JSON.parse(String(fd.get("payload") ?? "{}")) as ProjectFormValues;
    const projectId = String(fd.get("projectId") ?? "") || undefined;
    const wantsPublish = fd.get("intent") === "publish";
    // Fără email confirmat salvăm ciorna, ca să nu se piardă și să nu se dubleze la retrimitere.
    const publish = wantsPublish && Boolean(user.emailVerifiedAt);

    await ensureClientRole(user.id, user.isClient);
    const res = await saveProject(user.id, toInput(values), { projectId, publish });
    revalidatePath("/proiectele-mele");
    const contact = res.warnings.length > 0 ? "&contact=1" : "";

    if (wantsPublish && !user.emailVerifiedAt) {
      return {
        ok: false,
        code: "email_unverified",
        projectId: res.project.id,
        status: "draft",
        warnings: res.warnings,
        error: "Am salvat proiectul ca ciornă. Confirmă adresa de email ca să-l poți publica — ți-am trimis un link de confirmare.",
      };
    }
    if (res.status === "open") redirect(`/proiectele-mele/${res.project.id}?publicat=1${contact}`);
    if (res.status === "pending_review") redirect(`/proiectele-mele/${res.project.id}?verificare=1${contact}`);
    redirect(`/proiectele-mele/${res.project.id}?ciorna=1${contact}`);
  } catch (err) {
    return toActionError(err);
  }
}

export type DraftResult =
  | { ok: true; values: Partial<ProjectFormValues>; quality: QualityView }
  | { ok: false; error: string };

/** „Descrie liber / importă o postare” → proiect structurat (AI sau reguli). */
export async function draftFromTextAction(text: string): Promise<DraftResult> {
  try {
    const user = await requireOnboardedUser("/proiecte/nou");
    const clean = text.trim();
    if (clean.length < 20) throw new DomainError("short", "Scrie cel puțin o propoziție sau două despre ce ai nevoie.");
    const draft = await buildProjectDraft(clean, user.id);
    const catalog = await getCatalog();
    const cat = catalog.bySlug.get(draft.categorySlug);
    // Acceptăm doar subcategorii; dacă AI-ul a ales o categorie principală, luăm prima subcategorie.
    const categoryId = cat ? (cat.parentId ? cat.id : (catalog.tree.find((t) => t.id === cat.id)?.children[0]?.id ?? null)) : null;
    const loc = draft.localityName ? await findLocalityByName(draft.localityName, draft.countyCode ?? undefined) : null;
    return {
      ok: true,
      values: {
        title: draft.title,
        description: draft.description,
        categoryId,
        skills: draft.skills.slice(0, 8),
        budgetType: draft.budgetType,
        budgetMin: draft.budgetMin ? String(Math.round(draft.budgetMin)) : "",
        budgetMax: draft.budgetMax ? String(Math.round(draft.budgetMax)) : "",
        estimatedHours: draft.estimatedHours ? String(Math.round(draft.estimatedHours)) : "",
        workMode: draft.workMode,
        locality: loc ? { id: loc.id, name: loc.name, county: loc.county, countyCode: loc.countyCode } : null,
        invoice: draft.invoice,
        urgency: draft.urgency,
        durationText: draft.durationText ?? "",
        source: "import",
        sourceText: clean.slice(0, 10_000),
      },
      quality: {
        score: Math.max(0, 100 - draft.missing.length * 15),
        missing: draft.missing,
        questions: draft.questions,
        budgetInsight: draft.budgetInsight,
        source: draft.source,
      },
    };
  } catch (err) {
    const e = toActionError(err);
    return { ok: false, error: e.error };
  }
}

export type CategoryMeta = {
  skills: string[];
  attributes: { key: string; label: string; kind: string; options: string[] | null; unit: string | null }[];
  typicalWorkMode: "remote" | "on_site" | "hybrid";
};

export async function categoryMetaAction(categoryId: number): Promise<CategoryMeta> {
  const catalog = await getCatalog();
  const cat = catalog.byId.get(categoryId);
  if (!cat) return { skills: [], attributes: [], typicalWorkMode: "remote" };
  const attrs = await getCategoryAttributes(categoryId);
  return {
    skills: skillsForCategory(catalog, categoryId).map((s) => s.name),
    attributes: attrs.map((a) => ({ key: a.key, label: a.label, kind: a.kind, options: a.options ?? null, unit: a.unit })),
    typicalWorkMode: cat.typicalWorkMode,
  };
}

export async function checkQualityAction(values: ProjectFormValues): Promise<{ ok: true; quality: QualityView } | { ok: false; error: string }> {
  try {
    const user = await requireOnboardedUser("/proiecte/nou");
    if (!values.categoryId) throw new DomainError("category", "Alege mai întâi categoria.");
    const catalog = await getCatalog();
    const input = toInput(values);
    const loc = input.localityId ? await getLocality(input.localityId) : null;
    const q = await checkProjectQuality(
      {
        title: input.title,
        description: input.description,
        budgetMin: input.budgetMin,
        budgetMax: input.budgetMax,
        budgetType: input.budgetType,
        workMode: input.workMode,
        localityId: input.localityId,
        urgency: input.urgency,
        skillsCount: input.skills.length,
        categoryName: categoryPath(catalog, values.categoryId),
        localityName: loc?.name ?? null,
        invoice: input.invoice,
      },
      user.id,
    );
    return { ok: true, quality: q };
  } catch (err) {
    return { ok: false, error: toActionError(err).error };
  }
}
