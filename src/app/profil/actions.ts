"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { formBool, formNum, formStr, toActionError, type ActionState } from "@/lib/action";
import { isUuid } from "@/lib/ids";
import { parseServiceForm } from "@/lib/service-form";
import { setProfilePublic, updateBasicInfo } from "@/server/account";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { portfolioItems, providerServices } from "@/server/db/schema";
import { DomainError } from "@/server/errors";
import { addPortfolioItem, assertProviderProfile, deletePortfolioItem, deleteService, setProviderCover, updateService } from "@/server/providers/service";
import { replyToReview } from "@/server/trust/service";
import { assertUploadAllowed, saveUpload } from "@/server/uploads";
import { rateLimit } from "@/server/rate-limit";
import { removeCompanyVerification, verifyCompany } from "@/server/verification/anaf";

function refresh() {
  revalidatePath("/profil");
  revalidatePath("/panou");
}

/** Serviciile apar și în onboarding (pasul 3). */
function refreshServices() {
  refresh();
  revalidatePath("/onboarding");
}

export async function saveBasicInfoAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const user = await requireUser("/profil");
    const file = fd.get("avatar");
    // Fotografia se salvează abia după validarea formularului (vezi `updateBasicInfo`).
    let avatar: null | (() => Promise<string>) | undefined = undefined;
    if (formBool(fd, "removeAvatar")) avatar = null;
    else if (file instanceof File && file.size > 0) {
      avatar = async () => {
        await assertUploadAllowed(user.id);
        return (await saveUpload(file, "public/avatars", "image")).path;
      };
    }
    await updateBasicInfo(user.id, { name: formStr(fd, "name"), localityId: formNum(fd, "localityId") }, avatar);
    revalidatePath("/", "layout");
    return { ok: true, message: "Datele au fost salvate." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function deleteServiceAction(serviceId: string): Promise<ActionState> {
  try {
    const user = await requireUser("/profil");
    // Ștergerea afectează doar rândurile proprii: fără rând propriu, nu raportăm un succes fals.
    const [own] = isUuid(serviceId)
      ? await db
          .select({ id: providerServices.id })
          .from(providerServices)
          .where(and(eq(providerServices.id, serviceId), eq(providerServices.providerId, user.id)))
      : [];
    if (!own) return { ok: false, error: "Serviciul nu există sau nu îți aparține." };
    await deleteService(user.id, serviceId);
    refreshServices();
    return { ok: true, message: "Serviciul a fost șters." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function updateServiceAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const user = await requireUser("/profil");
    await updateService(user.id, formStr(fd, "serviceId"), parseServiceForm(fd));
    refreshServices();
    return { ok: true, message: "Serviciul a fost actualizat." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function addPortfolioAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const user = await requireUser("/profil");
    if (!user.isProvider) throw new DomainError("provider", "Completează mai întâi profilul de prestator.");
    const file = fd.get("image");
    // Imaginea se salvează după validare și după verificarea limitei de 30 de lucrări.
    const image =
      file instanceof File && file.size > 0
        ? async () => {
            await assertUploadAllowed(user.id);
            return (await saveUpload(file, "public/portfolio", "image")).path;
          }
        : null;
    await addPortfolioItem(user.id, { title: formStr(fd, "title"), description: formStr(fd, "description"), url: formStr(fd, "url") }, image);
    refresh();
    return { ok: true, message: "Lucrarea a fost adăugată în portofoliu." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function deletePortfolioAction(itemId: string): Promise<ActionState> {
  try {
    const user = await requireUser("/profil");
    const [own] = isUuid(itemId)
      ? await db
          .select({ id: portfolioItems.id })
          .from(portfolioItems)
          .where(and(eq(portfolioItems.id, itemId), eq(portfolioItems.providerId, user.id)))
      : [];
    if (!own) return { ok: false, error: "Lucrarea nu există sau nu îți aparține." };
    await deletePortfolioItem(user.id, itemId);
    refresh();
    return { ok: true, message: "Lucrarea a fost ștearsă." };
  } catch (err) {
    return toActionError(err);
  }
}

/** Încarcă sau înlocuiește imaginea de copertă a profilului public. */
export async function saveCoverAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const user = await requireUser("/profil");
    if (!user.isProvider) throw new DomainError("provider", "Completează mai întâi profilul de prestator.");
    const file = fd.get("cover");
    if (!(file instanceof File) || file.size === 0) throw new DomainError("empty", "Alege o imagine pentru copertă.");
    await assertProviderProfile(user.id);
    await assertUploadAllowed(user.id);
    const { path } = await saveUpload(file, "public/covers", "image");
    const slug = await setProviderCover(user.id, path);
    refresh();
    revalidatePath(`/prestatori/${slug}`);
    return { ok: true, message: "Coperta a fost salvată." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function removeCoverAction(): Promise<ActionState> {
  try {
    const user = await requireUser("/profil");
    const slug = await setProviderCover(user.id, null);
    refresh();
    revalidatePath(`/prestatori/${slug}`);
    return { ok: true, message: "Coperta a fost eliminată." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function replyReviewAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const user = await requireUser("/profil");
    const reply = formStr(fd, "reply").trim();
    if (reply.length < 2) throw new DomainError("short", "Scrie un răspuns.");
    const reviewId = formStr(fd, "reviewId");
    if (!isUuid(reviewId)) throw new DomainError("not_found", "Recenzia nu există.");
    await replyToReview(reviewId, user.id, reply);
    refresh();
    return { ok: true, message: "Răspunsul a fost publicat." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function setPublicAction(isPublic: boolean): Promise<ActionState> {
  try {
    const user = await requireUser("/profil");
    await setProfilePublic(user.id, isPublic);
    refresh();
    return { ok: true, message: isPublic ? "Profilul este public." : "Profilul este ascuns din căutări." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function verifyCompanyAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const user = await requireUser("/profil");
    if (!(await rateLimit(`anaf:${user.id}`, 10, 3600))) throw new DomainError("rate", "Prea multe verificări într-o oră. Încearcă mai târziu.");
    const info = await verifyCompany(user.id, formStr(fd, "cui"));
    refresh();
    revalidatePath("/prestatori", "layout");
    return { ok: true, message: `Firmă verificată: ${info.name}.` };
  } catch (err) {
    refresh();
    return toActionError(err);
  }
}

export async function removeCompanyVerificationAction(): Promise<ActionState> {
  try {
    const user = await requireUser("/profil");
    await removeCompanyVerification(user.id);
    refresh();
    return { ok: true, message: "Verificarea a fost eliminată." };
  } catch (err) {
    return toActionError(err);
  }
}
