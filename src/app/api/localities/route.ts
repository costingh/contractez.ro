import { NextResponse, type NextRequest } from "next/server";
import { getLocality, searchLocalities } from "@/server/catalog/localities";

export async function GET(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (id) {
    const loc = await getLocality(id);
    return NextResponse.json(loc ? [loc] : []);
  }
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const rows = await searchLocalities(q.slice(0, 60), 12);
  return NextResponse.json(rows, { headers: { "cache-control": "public, max-age=3600" } });
}
