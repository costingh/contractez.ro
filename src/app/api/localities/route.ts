import { NextResponse, type NextRequest } from "next/server";
import { stripControlChars } from "@/lib/text";
import { getLocality, searchLocalities } from "@/server/catalog/localities";

export async function GET(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (id) {
    if (!Number.isInteger(id) || id < 1 || id > 2_147_483_647) return NextResponse.json([]);
    const loc = await getLocality(id);
    return NextResponse.json(loc ? [loc] : []);
  }
  const q = stripControlChars(req.nextUrl.searchParams.get("q") ?? "");
  const rows = await searchLocalities(q.slice(0, 60), 12);
  return NextResponse.json(rows, { headers: { "cache-control": "public, max-age=3600" } });
}
