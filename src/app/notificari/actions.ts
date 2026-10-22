"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { toActionError, type ActionState } from "@/lib/action";
import { isUuid } from "@/lib/ids";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { notifications } from "@/server/db/schema";
import { markAllRead } from "@/server/notifications";

export async function markAllReadAction(): Promise<ActionState> {
  try {
    const user = await requireUser();
    await markAllRead(user.id);
    revalidatePath("/", "layout");
    return { ok: true, message: "Toate notificările sunt marcate ca citite." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function markReadAction(notificationId: string): Promise<void> {
  const user = await requireUser();
  if (!isUuid(notificationId)) return;
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, user.id), isNull(notifications.readAt)));
  revalidatePath("/", "layout");
}
