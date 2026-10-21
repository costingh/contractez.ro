/**
 * Rețele sociale și profesionale afișate pe profilul public al prestatorului.
 * Fără dependențe de server: definițiile sunt folosite și de formularul din /profil.
 */

export const SOCIAL_KEYS = ["linkedin", "facebook", "instagram", "tiktok", "youtube", "github", "behance", "dribbble"] as const;

export type SocialKey = (typeof SOCIAL_KEYS)[number];
export type SocialLinks = Partial<Record<SocialKey, string>>;

type Network = {
  label: string;
  /** Domeniile acceptate (plus orice subdomeniu al lor). */
  hosts: string[];
  placeholder: string;
  /** Numele de utilizator acceptat fără link (după ce scoatem „@”). */
  handle: RegExp;
  /** Linkul canonic construit dintr-un nume de utilizator. */
  fromHandle: (h: string) => string;
};

export const SOCIAL_NETWORKS: Record<SocialKey, Network> = {
  linkedin: {
    label: "LinkedIn",
    hosts: ["linkedin.com"],
    placeholder: "linkedin.com/in/nume",
    handle: /^[a-z0-9][a-z0-9_-]{2,99}$/i,
    fromHandle: (h) => `https://www.linkedin.com/in/${h}`,
  },
  facebook: {
    label: "Facebook",
    hosts: ["facebook.com", "fb.com"],
    placeholder: "facebook.com/pagina-ta",
    handle: /^[a-z0-9.]{5,50}$/i,
    fromHandle: (h) => `https://www.facebook.com/${h}`,
  },
  instagram: {
    label: "Instagram",
    hosts: ["instagram.com"],
    placeholder: "@nume sau instagram.com/nume",
    handle: /^[a-z0-9._]{1,30}$/i,
    fromHandle: (h) => `https://www.instagram.com/${h}`,
  },
  tiktok: {
    label: "TikTok",
    hosts: ["tiktok.com"],
    placeholder: "@nume sau tiktok.com/@nume",
    handle: /^[a-z0-9._]{2,24}$/i,
    fromHandle: (h) => `https://www.tiktok.com/@${h}`,
  },
  youtube: {
    label: "YouTube",
    hosts: ["youtube.com"],
    placeholder: "@canal sau youtube.com/@canal",
    handle: /^[a-z0-9._-]{3,30}$/i,
    fromHandle: (h) => `https://www.youtube.com/@${h}`,
  },
  github: {
    label: "GitHub",
    hosts: ["github.com"],
    placeholder: "nume sau github.com/nume",
    handle: /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/i,
    fromHandle: (h) => `https://github.com/${h}`,
  },
  behance: {
    label: "Behance",
    hosts: ["behance.net"],
    placeholder: "nume sau behance.net/nume",
    handle: /^[a-z0-9_-]{3,40}$/i,
    fromHandle: (h) => `https://www.behance.net/${h}`,
  },
  dribbble: {
    label: "Dribbble",
    hosts: ["dribbble.com"],
    placeholder: "nume sau dribbble.com/nume",
    handle: /^[a-z0-9_-]{2,40}$/i,
    fromHandle: (h) => `https://dribbble.com/${h}`,
  },
};

export const SOCIAL_URL_MAX = 300;

/** Parametri de urmărire eliminați la normalizare. */
const TRACKING = /^(utm_.+|fbclid|gclid|igsh|igshid|si|_t|_r|ref|ref_src|mibextid)$/i;

export type SocialResult = { ok: true; url: string | null } | { ok: false; error: string };

export function hostMatches(key: SocialKey, hostname: string) {
  const h = hostname.toLowerCase().replace(/\.$/, "");
  return SOCIAL_NETWORKS[key].hosts.some((d) => h === d || h.endsWith(`.${d}`));
}

/**
 * Validează și normalizează linkul pentru o rețea. Șir gol → `null` (linkul se șterge).
 * Acceptă: link https complet, link fără „https://” sau numele de utilizator („@nume”).
 */
export function normalizeSocialUrl(key: SocialKey, raw: string): SocialResult {
  const net = SOCIAL_NETWORKS[key];
  const value = raw.trim();
  if (value === "") return { ok: true, url: null };
  if (/\s/.test(value)) return { ok: false, error: `Adaugă un singur link pentru ${net.label}.` };
  if (value.length > SOCIAL_URL_MAX) return { ok: false, error: "Linkul este prea lung." };

  // Nume de utilizator simplu: „@nume” sau „nume” (Instagram/TikTok permit și „.”: „ana.pop”).
  const handle = value.replace(/^@/, "");
  if (!/[/:]/.test(handle) && !hostMatches(key, handle.replace(/^www\./i, ""))) {
    if (net.handle.test(handle)) return { ok: true, url: net.fromHandle(handle) };
    if (value.startsWith("@") || !handle.includes(".")) return { ok: false, error: `Numele de utilizator ${net.label} nu este valid.` };
  }

  let input = value;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(input)?.[1]?.toLowerCase();
  if (scheme && scheme !== "https") {
    return { ok: false, error: scheme === "http" ? "Folosește un link securizat (https://)." : `Link ${net.label} invalid.` };
  }
  if (!scheme) {
    if (input.startsWith("//")) input = input.slice(2);
    // „in/nume” sau „company/firma” pentru LinkedIn, fără domeniu.
    if (key === "linkedin" && /^(in|company|school)\//i.test(input)) input = `linkedin.com/${input}`;
    input = `https://${input}`;
  }

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { ok: false, error: `Link ${net.label} invalid.` };
  }
  if (url.protocol !== "https:") return { ok: false, error: "Folosește un link securizat (https://)." };
  if (url.username || url.password || url.port) return { ok: false, error: `Link ${net.label} invalid.` };
  if (!hostMatches(key, url.hostname)) {
    return { ok: false, error: `Linkul trebuie să fie de pe ${net.hosts.join(" sau ")}.` };
  }

  url.hash = "";
  for (const k of [...url.searchParams.keys()]) if (TRACKING.test(k)) url.searchParams.delete(k);
  url.hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  url.pathname = url.pathname.replace(/\/{2,}/g, "/").replace(/\/+$/, "");
  if ((url.pathname === "" || url.pathname === "/") && url.search === "") {
    return { ok: false, error: `Linkul trebuie să ducă la profilul tău ${net.label}, nu la prima pagină.` };
  }
  const out = url.toString();
  if (out.length > SOCIAL_URL_MAX) return { ok: false, error: "Linkul este prea lung." };
  return { ok: true, url: out };
}

/** Linkurile salvate, în ordinea fixă a rețelelor, re-verificate înainte de afișare. */
export function socialLinkList(links: SocialLinks | null | undefined) {
  if (!links) return [];
  return SOCIAL_KEYS.flatMap((key) => {
    const v = links[key];
    if (typeof v !== "string") return [];
    const r = normalizeSocialUrl(key, v);
    return r.ok && r.url ? [{ key, label: SOCIAL_NETWORKS[key].label, url: r.url }] : [];
  });
}
