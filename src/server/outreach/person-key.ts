// Identitatea unei persoane de pe Facebook (docs/OUTREACH.md → `personKey`). Funcții pure, fără DB.

const FB_HOST = /(^|\.)facebook\.com$|(^|\.)fb\.com$/i;
/** Primul segment de cale care nu este un profil (pagini/rute Facebook). */
const RESERVED = new Set([
  "groups",
  "profile.php",
  "people",
  "pages",
  "messages",
  "watch",
  "events",
  "marketplace",
  "photo",
  "photo.php",
  "photos",
  "permalink.php",
  "story.php",
  "share",
  "sharer",
  "login",
  "hashtag",
  "search",
  "notifications",
  "friends",
  "reel",
  "stories",
  "gaming",
  "home.php",
]);

const FB_ID = /^\d{3,25}$/;
const USERNAME = /^[a-z0-9.\-_]{2,80}$/i;

function parseUrl(raw: string): URL | null {
  const s = raw.trim();
  if (!s) return null;
  try {
    return new URL(/^https?:\/\//i.test(s) ? s : `https://${s.replace(/^\/+/, "")}`);
  } catch {
    return null;
  }
}

/**
 * Normalizează identitatea autorului:
 * - `authorFbId` are prioritate → `id:<authorFbId>`;
 * - `facebook.com/profile.php?id=123` → `id:123`;
 * - `facebook.com/groups/<gid>/user/123/` → `id:123`;
 * - `facebook.com/<username>` → `u:<username>` (lowercase, fără query).
 * Returnează null dacă nu se poate deduce o persoană.
 */
export function personKey(authorProfileUrl: string | null | undefined, authorFbId?: string | null): string | null {
  const fbId = authorFbId?.trim();
  if (fbId && FB_ID.test(fbId)) return `id:${fbId}`;
  if (!authorProfileUrl) return null;
  const url = parseUrl(authorProfileUrl);
  if (!url || !FB_HOST.test(url.hostname)) return null;
  const parts = url.pathname.split("/").filter(Boolean).map((p) => decodeURIComponent(p));
  if (parts.length === 0) return null;

  if (parts[0].toLowerCase() === "profile.php") {
    const id = url.searchParams.get("id")?.trim();
    return id && FB_ID.test(id) ? `id:${id}` : null;
  }
  if (parts[0].toLowerCase() === "groups") {
    const i = parts.findIndex((p) => p.toLowerCase() === "user");
    const id = i >= 0 ? parts[i + 1] : undefined;
    return id && FB_ID.test(id) ? `id:${id}` : null;
  }
  // facebook.com/people/<Nume>/<id>/
  if (parts[0].toLowerCase() === "people") {
    const id = parts.find((p) => FB_ID.test(p));
    return id ? `id:${id}` : null;
  }
  const first = parts[0];
  if (RESERVED.has(first.toLowerCase())) return null;
  if (FB_ID.test(first)) return `id:${first}`;
  return USERNAME.test(first) ? `u:${first.toLowerCase()}` : null;
}

/** Linkul Messenger pentru o persoană (null dacă nu știm cui să scriem). */
export function messengerUrl(key: string | null | undefined, authorFbId?: string | null): string | null {
  const fbId = authorFbId?.trim();
  if (fbId && FB_ID.test(fbId)) return `https://www.facebook.com/messages/t/${fbId}`;
  if (!key) return null;
  const [kind, value] = [key.slice(0, key.indexOf(":")), key.slice(key.indexOf(":") + 1)];
  if (!value || (kind !== "id" && kind !== "u")) return null;
  return `https://www.facebook.com/messages/t/${encodeURIComponent(value)}`;
}

/** Persoana dintr-o conversație Messenger: `/messages/t/<id|username>`. */
export function personKeyFromThread(threadUrl: string | null | undefined): string | null {
  if (!threadUrl) return null;
  const url = parseUrl(threadUrl);
  if (!url || !(FB_HOST.test(url.hostname) || /(^|\.)messenger\.com$/i.test(url.hostname))) return null;
  const m = url.pathname.match(/\/(?:messages\/)?t\/([^/?#]+)/);
  if (!m || url.pathname.includes("/e2ee/")) return null;
  const seg = decodeURIComponent(m[1]);
  if (FB_ID.test(seg)) return `id:${seg}`;
  return USERNAME.test(seg) ? `u:${seg.toLowerCase()}` : null;
}

const ANON = /^\s*(anonim|anonymous|participant anonim|membru anonim)/i;

/** Autor anonim (postare anonimă în grup) — nu îl putem contacta. */
export function isAnonymousAuthor(name: string | null | undefined): boolean {
  return Boolean(name && ANON.test(name));
}
