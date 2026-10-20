"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { formBool, formNum, formStr, toActionError, type ActionState } from "@/lib/action";
import { requireProvider } from "@/server/auth/guards";
import { confirmProposal, declineProposal } from "@/server/autobid/engine";
import { db } from "@/server/db";
import { autoBidRules, providerCategories } from "@/server/db/schema";
import { DomainError } from "@/server/errors";

const MAX_RULES = 10;

const ruleSchema = z
  .object({
    name: z.string().trim().min(2, "Dă un nume regulii").max(80),
    enabled: z.boolean(),
    mode: z.enum(["review", "automatic"]),
    categoryIds: z.array(z.number().int().positive()).max(20),
    keywords: z.array(z.string().trim().min(2).max(40)).max(20),
    excludeKeywords: z.array(z.string().trim().min(2).max(40)).max(20),
    minScore: z.number().int().min(50, "Pragul minim este 50%").max(100),
    minBudget: z.number().int().min(0).max(10_000_000).nullable(),
    maxBudget: z.number().int().min(0).max(10_000_000).nullable(),
    workModes: z.array(z.enum(["remote", "on_site", "hybrid"])).min(1, "Alege cel puțin un mod de lucru"),
    maxDistanceKm: z.number().int().min(1).max(500).nullable(),
    requireVerifiedClient: z.boolean(),
    dailyCap: z.number().int().min(1).max(10),
    template: z
      .string()
      .trim()
      .min(60, "Mesajul trebuie să aibă cel puțin 60 de caractere")
      .max(3_000, "Mesajul este prea lung"),
    priceAmount: z.number().int().min(1).max(10_000_000).nullable(),
    priceType: z.enum(["fixed", "hourly", "monthly", "to_discuss"]),
    estimatedDays: z.number().int().min(1).max(365).nullable(),
    personalizeWithAi: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.minBudget && v.maxBudget && v.minBudget > v.maxBudget) {
      ctx.addIssue({ code: "custom", path: ["maxBudget"], message: "Bugetul maxim trebuie să fie peste minim" });
    }
    if (v.priceType !== "to_discuss" && !v.priceAmount) {
      ctx.addIssue({ code: "custom", path: ["priceAmount"], message: "Completează prețul sau alege „De discutat”" });
    }
  });

const list = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export async function saveRuleAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const user = await requireProvider();
    const priceType = formStr(fd, "priceType") || "to_discuss";
    const input = ruleSchema.parse({
      name: formStr(fd, "name"),
      enabled: formBool(fd, "enabled"),
      mode: formStr(fd, "mode") || "review",
      categoryIds: fd.getAll("categoryIds").map(Number).filter(Boolean),
      keywords: list(formStr(fd, "keywords")),
      excludeKeywords: list(formStr(fd, "excludeKeywords")),
      minScore: formNum(fd, "minScore") ?? 80,
      minBudget: formNum(fd, "minBudget"),
      maxBudget: formNum(fd, "maxBudget"),
      workModes: fd.getAll("workModes").map(String),
      maxDistanceKm: formNum(fd, "maxDistanceKm"),
      requireVerifiedClient: formBool(fd, "requireVerifiedClient"),
      dailyCap: formNum(fd, "dailyCap") ?? 3,
      template: formStr(fd, "template"),
      priceAmount: priceType === "to_discuss" ? null : formNum(fd, "priceAmount"),
      priceType,
      estimatedDays: formNum(fd, "estimatedDays"),
      personalizeWithAi: formBool(fd, "personalizeWithAi"),
    });

    // Doar categoriile din profilul prestatorului.
    const mine = await db.select({ id: providerCategories.categoryId }).from(providerCategories).where(eq(providerCategories.providerId, user.id));
    const allowed = new Set(mine.map((m) => m.id));
    input.categoryIds = input.categoryIds.filter((id) => allowed.has(id));

    const id = formStr(fd, "id");
    if (id) {
      const res = await db
        .update(autoBidRules)
        .set(input)
        .where(and(eq(autoBidRules.id, id), eq(autoBidRules.providerId, user.id)))
        .returning({ id: autoBidRules.id });
      if (res.length === 0) throw new DomainError("not_found", "Regula nu există.");
    } else {
      const existing = await db.select({ id: autoBidRules.id }).from(autoBidRules).where(eq(autoBidRules.providerId, user.id));
      if (existing.length >= MAX_RULES) throw new DomainError("limit", `Poți avea maximum ${MAX_RULES} reguli.`);
      await db.insert(autoBidRules).values({ ...input, providerId: user.id });
    }
    revalidatePath("/auto-bid");
    return { ok: true, message: id ? "Regula a fost actualizată." : "Regula a fost creată." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function toggleRuleAction(ruleId: string, enabled: boolean): Promise<ActionState> {
  try {
    const user = await requireProvider();
    await db.update(autoBidRules).set({ enabled }).where(and(eq(autoBidRules.id, ruleId), eq(autoBidRules.providerId, user.id)));
    revalidatePath("/auto-bid");
    return { ok: true, message: enabled ? "Regula este activă." : "Regula este oprită." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function deleteRuleAction(ruleId: string): Promise<ActionState> {
  try {
    const user = await requireProvider();
    await db.delete(autoBidRules).where(and(eq(autoBidRules.id, ruleId), eq(autoBidRules.providerId, user.id)));
    revalidatePath("/auto-bid");
    return { ok: true, message: "Regula a fost ștearsă." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function stopAllRulesAction(): Promise<ActionState> {
  try {
    const user = await requireProvider();
    await db.update(autoBidRules).set({ enabled: false }).where(eq(autoBidRules.providerId, user.id));
    revalidatePath("/auto-bid");
    return { ok: true, message: "Toate regulile Auto Bid au fost oprite." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function confirmProposalAction(executionId: string, message: string): Promise<ActionState> {
  try {
    const user = await requireProvider();
    await confirmProposal(executionId, user.id, message);
    revalidatePath("/auto-bid");
    revalidatePath("/aplicarile-mele");
    return { ok: true, message: "Aplicarea a fost trimisă." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function declineProposalAction(executionId: string): Promise<ActionState> {
  try {
    const user = await requireProvider();
    await declineProposal(executionId, user.id);
    revalidatePath("/auto-bid");
    return { ok: true, message: "Propunerea a fost refuzată." };
  } catch (err) {
    return toActionError(err);
  }
}
