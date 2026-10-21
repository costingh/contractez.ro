import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { normalizePhone } from "@/lib/phone";
import { db } from "./db";
import { collaborations, users } from "./db/schema";
import { DomainError } from "./errors";
import { features } from "./features";

/**
 * Colaborare „acceptată”: clientul a ales oferta (aplicarea devine „hired” și colaborarea pornește
 * în `pending_confirmation`), apoi prestatorul o confirmă (`active`) și, la final, `completed`.
 * Doar o colaborare anulată nu mai dă acces la datele de contact.
 */
export const ACCEPTED_COLLABORATION_STATUSES = ["pending_confirmation", "active", "completed"] as const;

/**
 * Telefonul de contact, setat fără verificare SMS (când gateway-ul nu e configurat).
 * Un șir gol șterge numărul. Nu marcăm niciodată numărul ca verificat.
 */
export async function setContactPhone(userId: string, raw: string) {
  if (features.phoneVerification) {
    throw new DomainError("phone_verification", "Numărul de telefon se confirmă cu un cod primit prin SMS.");
  }
  const phone = raw.trim() ? normalizePhone(raw) : null;
  if (raw.trim() && !phone) {
    throw new DomainError("invalid_phone", "Număr de telefon invalid. Exemple: 0712 345 678 sau +44 20 7946 0958.");
  }
  const [u] = await db.select({ phone: users.phone, phoneVerifiedAt: users.phoneVerifiedAt }).from(users).where(eq(users.id, userId));
  if (!u) throw new DomainError("not_found", "Utilizator inexistent.");
  // Păstrăm o verificare anterioară doar dacă numărul rămâne același.
  const phoneVerifiedAt = phone && phone === u.phone ? u.phoneVerifiedAt : null;
  await db.update(users).set({ phone, phoneVerifiedAt }).where(eq(users.id, userId));
  return phone;
}

export type CounterpartContact = {
  collaborationId: string;
  applicationId: string;
  userId: string;
  name: string;
  phone: string | null;
  email: string;
};

/**
 * Datele de contact ale celeilalte părți, DOAR din colaborările acceptate ale utilizatorului.
 * Singurul loc din aplicație care citește `users.phone` pentru alt utilizator.
 */
export async function counterpartContacts(
  viewerId: string,
  filter: { applicationIds?: string[]; collaborationIds?: string[] } = {},
): Promise<CounterpartContact[]> {
  if (filter.applicationIds?.length === 0 || filter.collaborationIds?.length === 0) return [];
  const counterpartId = sql`CASE WHEN ${collaborations.clientId} = ${viewerId} THEN ${collaborations.providerId} ELSE ${collaborations.clientId} END`;
  return db
    .select({
      collaborationId: collaborations.id,
      applicationId: collaborations.applicationId,
      userId: users.id,
      name: users.name,
      phone: users.phone,
      email: users.email,
    })
    .from(collaborations)
    .innerJoin(users, sql`${users.id} = ${counterpartId}`)
    .where(
      and(
        or(eq(collaborations.clientId, viewerId), eq(collaborations.providerId, viewerId)),
        inArray(collaborations.status, [...ACCEPTED_COLLABORATION_STATUSES]),
        isNull(users.deletedAt),
        filter.applicationIds ? inArray(collaborations.applicationId, filter.applicationIds) : undefined,
        filter.collaborationIds ? inArray(collaborations.id, filter.collaborationIds) : undefined,
      ),
    );
}
