import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { getConversationFor } from "@/server/chat/service";
import { parseUploadPath, readUpload } from "@/server/uploads";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  // Segmentele vin deja decodate („..%2F” devine „../”), așa că autorizăm DOAR pe calea întreagă, validată strict.
  const rel = path.join("/");
  const scope = parseUploadPath(rel);
  if (!scope) return new NextResponse("Not found", { status: 404 });
  if (scope.kind === "chat") {
    const user = await getCurrentUser();
    if (!user) return new NextResponse("Neautorizat", { status: 401 });
    try {
      await getConversationFor(scope.conversationId, user.id);
    } catch {
      return new NextResponse("Interzis", { status: 403 });
    }
  }
  const file = await readUpload(rel);
  if (!file) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "content-type": file.type,
      "cache-control": scope.kind === "public" ? "public, max-age=31536000, immutable" : "private, no-store",
      "x-content-type-options": "nosniff",
      ...(file.type === "application/pdf" ? { "content-disposition": "inline" } : {}),
    },
  });
}
