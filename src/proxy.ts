import { NextResponse, type NextRequest } from "next/server";

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

export function proxy(req: NextRequest) {
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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
