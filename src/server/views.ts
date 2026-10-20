import "server-only";
import { headers } from "next/headers";
import { sha256 } from "./auth/crypto";
import { getRedis } from "./redis";

const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|preview|curl|wget|headless/i;

/**
 * Returnează `true` doar la prima vizualizare a unui vizitator în ultimele 24h
 * (utilizator autentificat sau IP + browser). Roboții și previzualizările de linkuri nu se numără.
 */
export async function isFirstViewToday(kind: "project" | "profile", id: string, userId: string | null): Promise<boolean> {
  const h = await headers();
  const ua = h.get("user-agent") ?? "";
  if (!ua || BOT_RE.test(ua)) return false;
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim();
  const viewer = userId ?? sha256(`${ip}|${ua}`).slice(0, 24);
  try {
    const res = await getRedis().set(`view:${kind}:${id}:${viewer}`, "1", "EX", 86_400, "NX");
    return res === "OK";
  } catch {
    return false;
  }
}
