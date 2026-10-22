/**
 * Erorile afișate pe /autentificare: URL-ul (`?eroare=`) poartă doar un cod, iar textul vine din lista de mai jos.
 * Astfel un link creat de altcineva nu poate afișa mesaje arbitrare în alerta paginii de login.
 */
export const LOGIN_ERRORS = {
  google_cancelled: "Ai anulat autentificarea cu Google.",
  google_denied: "Google a refuzat autentificarea.",
  google_incomplete: "Răspuns incomplet de la Google. Încearcă din nou.",
  google_off: "Autentificarea cu Google nu este disponibilă momentan. Folosește emailul și parola.",
  google_state: "Sesiunea de autentificare a expirat. Încearcă din nou.",
  google_token: "Google nu a confirmat autentificarea. Încearcă din nou.",
  google_claims: "Google nu a confirmat autentificarea. Încearcă din nou.",
  google_email: "Adresa de email Google nu este verificată. Folosește înregistrarea cu email și parolă.",
  google_failed: "Autentificarea cu Google a eșuat. Încearcă din nou.",
  rate_limited: "Prea multe încercări. Așteaptă câteva minute.",
  banned: "Contul este suspendat. Contactează-ne dacă e o greșeală.",
  deleted: "Contul a fost șters.",
} as const;

export type LoginErrorCode = keyof typeof LOGIN_ERRORS;

export const GENERIC_LOGIN_ERROR = "Autentificarea nu a reușit. Încearcă din nou.";

export function isLoginErrorCode(code: string | null | undefined): code is LoginErrorCode {
  return typeof code === "string" && Object.hasOwn(LOGIN_ERRORS, code);
}

/** Mesajul pentru un cod din URL. Codurile necunoscute primesc mesajul generic; lipsa codului → nimic. */
export function loginErrorMessage(code: string | null | undefined): string | null {
  if (!code) return null;
  return isLoginErrorCode(code) ? LOGIN_ERRORS[code] : GENERIC_LOGIN_ERROR;
}

/** Codul pentru o eroare de business (DomainError.code); altfel `fallback`. */
export function loginErrorCode(code: string | null | undefined, fallback: LoginErrorCode = "google_failed"): LoginErrorCode {
  return isLoginErrorCode(code) ? code : fallback;
}
