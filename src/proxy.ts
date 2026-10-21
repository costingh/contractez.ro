import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

// Verificare optimistă: rutele private redirecționează la login dacă nu există cookie de sesiune.
// Autorizarea reală se face pe server, în fiecare pagină/acțiune.
const PRIVATE = [
  "/panou",
  "/onboarding",
  "/proiectele-mele",
  "/proiecte/nou",
  "/aplicarile-mele",
  "/recomandari",
  "/mesaje",
  "/notificari",
  "/abonament",
  "/portofel",
  "/auto-bid",
  "/promovare",
  "/profil",
  "/setari",
  "/colaborari",
  "/admin",
];

/**
 * Crawlerele AI și de căutare nu rulează JavaScript, așa că scriptul VisitTrack nu le vede. Trimitem fiecare cerere
 * (cale, user-agent, IP) la VisitTrack, care decide ce e crawler. Fire-and-forget: nu întârzie niciodată răspunsul.
 */
function reportCrawl(req: NextRequest, event: NextFetchEvent) {
  const siteId = process.env.VISITRACK_SITE_ID;
  if (!siteId) return;
  // nginx de pe host suprascrie X-Forwarded-For cu IP-ul real al clientului.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || undefined;
  event.waitUntil(
    fetch("https://visitrack.app/api/collect-bot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId, path: req.nextUrl.pathname, userAgent: req.headers.get("user-agent") ?? "", ip }),
      signal: AbortSignal.timeout(3000),
    }).then(
      () => undefined,
      () => undefined,
    ),
  );
}

export function proxy(req: NextRequest, event: NextFetchEvent) {
  reportCrawl(req, event);
  const { pathname, search } = req.nextUrl;
  if (PRIVATE.some((p) => pathname === p || pathname.startsWith(p + "/")) && !req.cookies.has("sid")) {
    const url = new URL("/autentificare", req.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  const res = NextResponse.next();
  // Sesiune glisantă: reînnoim cookie-ul (30 zile) cel mult o dată pe zi, pentru utilizatorii activi.
  // Valabilitatea reală e verificată în DB (getCurrentUser), care prelungește și sesiunea de acolo.
  const sid = req.cookies.get("sid")?.value;
  if (sid && !req.cookies.has("sid_fresh")) {
    const secure = (process.env.APP_URL ?? "").startsWith("https://");
    res.cookies.set("sid", sid, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 30 * 86_400 });
    res.cookies.set("sid_fresh", "1", { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 86_400 });
  }
  return res;
}

export const config = {
  // Rulează și pe /robots.txt, /sitemap.xml, /llms.txt, /llms-full.txt și markdown (crawlerele le cer primele);
  // sare doar peste API, resursele de build și imagini/fonturi.
  matcher: ["/((?!api/|_next/static|_next/image|.*\\.(?:png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf|css|js|map)$).*)"],
};
