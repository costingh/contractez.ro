/**
 * Răspunsuri text pentru asistenții AI (/llms.txt, /llms-full.txt, /blog/[slug]/md).
 * Conținutul e static, dar URL-urile absolute depind de APP_URL, citit la rulare (nu la build),
 * așa că rutele sunt dinamice: rezultatul se păstrează în memorie per proces și se cache-uiește în CDN/browser.
 */
const memo = new Map<string, string>();

export function memoText(key: string, build: () => string): string {
  if (process.env.NODE_ENV !== "production") return build();
  let v = memo.get(key);
  if (v === undefined) {
    v = build();
    memo.set(key, v);
  }
  return v;
}

export function textResponse(body: string, contentType: string, headers: Record<string, string> = {}) {
  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      ...headers,
    },
  });
}
