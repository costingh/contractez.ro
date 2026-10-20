import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { getConversationFor } from "@/server/chat/service";
import { readUpload } from "@/server/uploads";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const rel = path.join("/");
  if (path[0] === "chat") {
    const user = await getCurrentUser();
    if (!user) return new NextResponse("Neautorizat", { status: 401 });
    try {
      await getConversationFor(path[1] ?? "", user.id);
    } catch {
      return new NextResponse("Interzis", { status: 403 });
    }
  } else if (path[0] !== "public") {
    return new NextResponse("Not found", { status: 404 });
  }
  const file = await readUpload(rel);
  if (!file) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "content-type": file.type,
      "cache-control": path[0] === "public" ? "public, max-age=31536000, immutable" : "private, max-age=3600",
      "x-content-type-options": "nosniff",
      ...(file.type === "application/pdf" ? { "content-disposition": "inline" } : {}),
    },
  });
}
