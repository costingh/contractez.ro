/** Cookie-ul cu alegerea vizitatorului: „all” (inclusiv analiză) sau „necessary”. */
export const CONSENT_COOKIE = "cz_consent";
export type Consent = "all" | "necessary";
export const OPEN_CONSENT_EVENT = "cz:open-consent";

export function parseConsent(value: string | undefined): Consent | null {
  return value === "all" || value === "necessary" ? value : null;
}
