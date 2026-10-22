/**
 * Validarea identificatorilor din URL-uri și din argumentele acțiunilor, înainte să ajungă în baza de date
 * (Postgres aruncă eroare pentru un UUID invalid, iar pagina ar răspunde cu 500 în loc de 404).
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/** Forma produsă de `slugify` (litere mici, cifre, cratime), cu o marjă pentru sufixele de unicitate. */
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,118}[a-z0-9])?$/i;

export function isSlug(value: unknown): value is string {
  return typeof value === "string" && SLUG_RE.test(value);
}
