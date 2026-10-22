import "server-only";
import { rateLimit } from "../rate-limit";
import { clientIp } from "../request";

/** Câte căutări AI poate face un vizitator neautentificat (per IP) într-o fereastră de 10 minute. */
const ANON_AI_SEARCHES = 10;
const ANON_WINDOW_SECONDS = 600;

/**
 * Căutarea în limbaj natural (/prestatori?ai=, /proiecte?ai=) apelează AI-ul. Utilizatorii autentificați au
 * bugetul zilnic per cont (src/server/ai/client.ts); vizitatorii anonimi sunt limitați per IP, ca să nu
 * consume singuri bugetul comun. Peste limită, pagina folosește interpretarea simplă, fără AI.
 */
export async function canUseAiSearch(userId: string | null): Promise<boolean> {
  if (userId) return true;
  return rateLimit(`ai-search:ip:${await clientIp()}`, ANON_AI_SEARCHES, ANON_WINDOW_SECONDS);
}
