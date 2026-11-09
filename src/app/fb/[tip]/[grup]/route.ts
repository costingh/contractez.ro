import { NextResponse } from "next/server";
import { env } from "@/server/env";

const TARGET: Record<string, string> = { p: "/inregistrare?rol=prestator", c: "/inregistrare?rol=client" };

/** Linkul scurt din mesajele de outreach: /fb/p/<grup> → înregistrare prestator, /fb/c/<grup> → înregistrare client, cu UTM. */
export async function GET(_req: Request, ctx: RouteContext<"/fb/[tip]/[grup]">) {
  const { tip, grup } = await ctx.params;
  const url = new URL(TARGET[tip] ?? "/", env.APP_URL);
  url.searchParams.set("utm_source", "facebook");
  url.searchParams.set("utm_medium", "dm");
  url.searchParams.set("utm_campaign", grup.slice(0, 64));
  return NextResponse.redirect(url, 302);
}
