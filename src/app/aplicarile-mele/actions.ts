"use server";

import { revalidatePath } from "next/cache";
import { toActionError, type ActionState } from "@/lib/action";
import { withdrawApplication } from "@/server/applications/service";
import { requireProvider } from "@/server/auth/guards";

export async function withdrawApplicationAction(applicationId: string): Promise<ActionState> {
  try {
    const user = await requireProvider();
    await withdrawApplication(applicationId, user.id);
    revalidatePath("/aplicarile-mele");
    return { ok: true, message: "Aplicarea a fost retrasă." };
  } catch (err) {
    return toActionError(err);
  }
}
