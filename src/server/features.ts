import { sql, type SQL } from "drizzle-orm";
import { smsConfigured } from "./auth/sms";
import { users } from "./db/schema";
import { env } from "./env";

/**
 * Funcționalități care depind de servicii externe.
 *
 * `phoneVerification`: verificarea telefonului prin cod SMS. Activă doar cu un gateway configurat
 * (SMS_WEBHOOK_URL); în dezvoltare rămâne activă, iar codurile apar în consola serverului.
 * Când e oprită, ascundem insignele, filtrele și textele despre „telefon verificat”, iar telefonul
 * devine doar un număr de contact, vizibil celeilalte părți dintr-o colaborare acceptată.
 * Datele (`users.phoneVerifiedAt`) rămân neatinse, deci totul revine la activarea SMS.
 */
export const features = {
  phoneVerification: smsConfigured || env.NODE_ENV !== "production",
};

/** „Telefon verificat” ca expresie SQL; mereu fals când verificarea telefonului este oprită. */
export function phoneVerifiedSql(): SQL<boolean> {
  return features.phoneVerification ? sql<boolean>`${users.phoneVerifiedAt} IS NOT NULL` : sql<boolean>`false`;
}

/** Varianta pentru date deja încărcate. */
export function isPhoneVerified(phoneVerifiedAt: Date | null | undefined) {
  return features.phoneVerification && Boolean(phoneVerifiedAt);
}
