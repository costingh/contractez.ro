"use server";

import { revalidatePath } from "next/cache";
import { toActionError, type ActionState } from "@/lib/action";
import { isUuid } from "@/lib/ids";
import { withdrawApplication } from "@/server/applications/service";
import { requireProvider } from "@/server/auth/guards";

export async function withdrawApplicationAction(applicationId: string): Promise<ActionState> {
  if (!isUuid(applicationId)) return { ok: false, error: "Aplicarea nu există." };
  try {
    const user = await requireProvider();
    await withdrawApplication(applicationId, user.id);
    revalidatePath("/aplicarile-mele");
    return { ok: true, message: "Aplicarea a fost retrasă." };
  } catch (err) {
    return toActionError(err);
  }
}
