/**
 * Linkuri web introduse de utilizatori (site-ul prestatorului, lucrări din portofoliu). Acceptăm doar
 * http(s); `javascript:`, `data:` și alte scheme sunt refuzate, iar un link fără schemă primește „https://”.
 * Fără dependențe de server: folosit și la validare (zod), și la afișare.
 */

export type WebUrlResult = { ok: true; url: string | null } | { ok: false; error: string };

/** Șir gol → `null` (linkul se șterge). */
export function normalizeWebUrl(raw: string | null | undefined, maxLength = 300): WebUrlResult {
  const value = (raw ?? "").trim();
  if (value === "") return { ok: true, url: null };
  if (/\s/.test(value)) return { ok: false, error: "Linkul nu poate conține spații." };
  if (value.length > maxLength) return { ok: false, error: "Linkul este prea lung." };

  let input = value;
  // O schemă înseamnă „litere urmate de :” care nu arată ca „domeniu:port” (ex. „site.ro:8080”).
  const scheme = /^([a-z][a-z0-9+.-]*):(?!\d+(?:[/?#]|$))/i.exec(input)?.[1]?.toLowerCase();
  if (scheme && scheme !== "http" && scheme !== "https") return { ok: false, error: "Linkul trebuie să fie o adresă web (https://…)." };
  if (!scheme) input = `https://${input.replace(/^\/\//, "")}`;

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { ok: false, error: "Link invalid." };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return { ok: false, error: "Linkul trebuie să fie o adresă web (https://…)." };
  if (url.username || url.password) return { ok: false, error: "Link invalid." };
  // Un domeniu real are cel puțin un punct și o extensie din litere (fără „https://localhost” sau IP-uri goale).
  const host = url.hostname.replace(/\.$/, "");
  if (!/^(?:[a-z0-9-]+\.)+[a-z0-9-]{2,}$/i.test(host) || !/[a-z]/i.test(host.split(".").at(-1) ?? "")) {
    return { ok: false, error: "Link invalid." };
  }
  const out = url.toString();
  if (out.length > maxLength) return { ok: false, error: "Linkul este prea lung." };
  return { ok: true, url: out };
}

/** Pentru afișare: linkul salvat, re-verificat (datele vechi pot conține orice). */
export function safeWebUrl(raw: string | null | undefined): string | null {
  const r = normalizeWebUrl(raw, 2_000);
  return r.ok ? r.url : null;
}
