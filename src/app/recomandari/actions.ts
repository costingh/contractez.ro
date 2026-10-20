"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { toActionError, type ActionState } from "@/lib/action";
import { requireProvider } from "@/server/auth/guards";
import { db } from "@/server/db";
import { projectMatches, projects } from "@/server/db/schema";
import { DomainError } from "@/server/errors";

/** Ascunde o recomandare (creează rândul de potrivire dacă nu există). */
export async function dismissRecommendationAction(projectId: string, score: number): Promise<ActionState> {
  try {
    const user = await requireProvider();
    const [p] = await db.select({ id: projects.id }).from(projects).where(eq(projects.id, projectId));
    if (!p) throw new DomainError("not_found", "Proiectul nu există.");
    const now = new Date();
    const updated = await db
      .update(projectMatches)
      .set({ dismissedAt: now })
      .where(and(eq(projectMatches.projectId, projectId), eq(projectMatches.providerId, user.id)))
      .returning({ id: projectMatches.id });
    if (updated.length === 0) {
      await db
        .insert(projectMatches)
        .values({ projectId, providerId: user.id, score: Math.max(0, Math.min(100, Math.round(score))), dismissedAt: now })
        .onConflictDoNothing();
    }
    revalidatePath("/recomandari");
    return { ok: true, message: "Am ascuns recomandarea." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function restoreDismissedAction(): Promise<ActionState> {
  try {
    const user = await requireProvider();
    await db.update(projectMatches).set({ dismissedAt: null }).where(eq(projectMatches.providerId, user.id));
    revalidatePath("/recomandari");
    return { ok: true, message: "Recomandările ascunse au fost readuse." };
  } catch (err) {
    return toActionError(err);
  }
}
