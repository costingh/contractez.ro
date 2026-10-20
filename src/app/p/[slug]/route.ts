import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { track } from "@/server/analytics";
import { db } from "@/server/db";
import { providerProfiles } from "@/server/db/schema";

/** Link scurt pentru profil (folosit în codul QR și pe cardul distribuibil). */
export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const [p] = await db.select({ slug: providerProfiles.slug, userId: providerProfiles.userId }).from(providerProfiles).where(eq(providerProfiles.slug, slug)).limit(1);
  if (!p) return NextResponse.redirect(new URL("/prestatori", req.url));
  const source = req.nextUrl.searchParams.get("s") === "share" ? "share" : "qr";
  await track("profile.short_link", null, { providerId: p.userId, source });
  return NextResponse.redirect(new URL(`/prestatori/${p.slug}?utm_source=${source}`, req.url));
}
