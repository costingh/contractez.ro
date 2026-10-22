import { getCategoryGuide } from "@/content/category-guides";
import { guideToMarkdown } from "@/content/category-guides/markdown";
import { memoText, textResponse } from "@/lib/text-response";
import { getCatalog } from "@/server/catalog/taxonomy";
import { env } from "@/server/env";

// APP_URL vine din mediu la rulare, nu la build.
export const dynamic = "force-dynamic";

/** Ghidul categoriei (prețuri, factori, checklist, FAQ) ca markdown, pentru asistenții AI. Pagina HTML rămâne cea canonică. */
export async function GET(_req: Request, ctx: RouteContext<"/categorii/[slug]/md">) {
  const { slug } = await ctx.params;
  const catalog = await getCatalog();
  const category = catalog.bySlug.get(slug);
  const guide = getCategoryGuide(slug);
  if (!category || !guide) return new Response("Categoria nu există.\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const parentName = category.parentId ? catalog.byId.get(category.parentId)?.name : undefined;
  const body = memoText(`category-md:${env.APP_URL}:${slug}`, () => guideToMarkdown({ name: category.name, slug, parentName, guide, baseUrl: env.APP_URL }));
  return textResponse(body, "text/markdown; charset=utf-8", { Link: `<${env.APP_URL}/categorii/${slug}>; rel="canonical"` });
}
