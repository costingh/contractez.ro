/**
 * Validează un parametru `next` (unde trimitem utilizatorul după login): doar căi interne.
 * Respinge URL-uri absolute, „//host”, „/\host”, backslash-uri și caractere de control (open redirect).
 */
export function safeNext(next: string | null | undefined): string | null {
  if (!next || next.length > 500 || !next.startsWith("/")) return null;
  if (/[\\\u0000-\u001f\u007f]/.test(next) || next.startsWith("//")) return null;
  try {
    const base = "https://contractez.internal";
    const url = new URL(next, base);
    if (url.origin !== base) return null;
    return url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}
