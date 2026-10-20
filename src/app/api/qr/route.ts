import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db";
import { providerProfiles } from "@/server/db/schema";
import { profileShortUrl, qrPng, qrSvg } from "@/server/share";

/** QR doar pentru profiluri existente (nu generăm coduri pentru texte arbitrare). */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") ?? "";
  const format = req.nextUrl.searchParams.get("format") === "png" ? "png" : "svg";
  const download = req.nextUrl.searchParams.has("download");
  const [p] = await db.select({ slug: providerProfiles.slug }).from(providerProfiles).where(eq(providerProfiles.slug, slug)).limit(1);
  if (!p) return new NextResponse("Not found", { status: 404 });
  const url = profileShortUrl(p.slug);
  const headers: Record<string, string> = { "cache-control": "public, max-age=86400" };
  if (download) headers["content-disposition"] = `attachment; filename="qr-${p.slug}.${format}"`;
  if (format === "png") {
    return new NextResponse(new Uint8Array(await qrPng(url, 1000)), { headers: { ...headers, "content-type": "image/png" } });
  }
  return new NextResponse(await qrSvg(url), { headers: { ...headers, "content-type": "image/svg+xml" } });
}
