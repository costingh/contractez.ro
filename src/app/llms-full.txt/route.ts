import { buildLlmsFullTxt } from "@/content/llms";
import { memoText, textResponse } from "@/lib/text-response";
import { env } from "@/server/env";

// APP_URL vine din mediu la rulare, nu la build. Fișierele .mdx sunt incluse în build prin outputFileTracingIncludes.
export const dynamic = "force-dynamic";

export function GET() {
  return textResponse(memoText(`llms-full:${env.APP_URL}`, () => buildLlmsFullTxt(env.APP_URL)), "text/plain; charset=utf-8");
}
