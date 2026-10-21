import { postToMarkdown } from "@/content/blog/markdown";
import { postsBySlug } from "@/content/blog/posts";
import { memoText, textResponse } from "@/lib/text-response";
import { env } from "@/server/env";

// APP_URL vine din mediu la rulare, nu la build. Fișierele .mdx sunt incluse în build prin outputFileTracingIncludes.
export const dynamic = "force-dynamic";

/** Articolul ca markdown curat, pentru asistenții AI. Pagina HTML rămâne cea canonică. */
export async function GET(_req: Request, ctx: RouteContext<"/blog/[slug]/md">) {
  const { slug } = await ctx.params;
  const post = postsBySlug.get(slug);
  if (!post) return new Response("Articolul nu există.\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const body = memoText(`post-md:${env.APP_URL}:${slug}`, () => postToMarkdown(post, env.APP_URL));
  return textResponse(body, "text/markdown; charset=utf-8", { Link: `<${env.APP_URL}/blog/${slug}>; rel="canonical"` });
}
