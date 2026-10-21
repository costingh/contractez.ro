import { buildLlmsTxt } from "@/content/llms";
import { memoText, textResponse } from "@/lib/text-response";
import { env } from "@/server/env";

// APP_URL vine din mediu la rulare, nu la build.
export const dynamic = "force-dynamic";

export function GET() {
  return textResponse(memoText(`llms:${env.APP_URL}`, () => buildLlmsTxt(env.APP_URL)), "text/plain; charset=utf-8");
}
