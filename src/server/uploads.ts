import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { rules } from "@/config/site";
import { env } from "./env";
import { DomainError } from "./errors";

const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const DOC_TYPES: Record<string, string> = { ...IMAGE_TYPES, "application/pdf": "pdf" };

function root() {
  return path.resolve(env.UPLOAD_DIR);
}

/** Verifică semnătura fișierului (nu ne bazăm doar pe tipul declarat de browser). */
function sniff(buf: Buffer): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "image/webp";
  if (buf.subarray(0, 5).toString() === "%PDF-") return "application/pdf";
  return null;
}

/**
 * Salvează un fișier încărcat. `scope`:
 *  - "public/avatars", "public/portfolio": accesibile oricui;
 *  - "chat/<conversationId>": doar participanților conversației.
 */
export async function saveUpload(file: File, scope: string, allow: "image" | "document" = "image") {
  if (!file || file.size === 0) throw new DomainError("empty", "Fișierul este gol.");
  if (file.size > rules.maxUploadBytes) throw new DomainError("size", `Fișierul depășește ${Math.round(rules.maxUploadBytes / 1024 / 1024)} MB.`);
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  const allowed = allow === "image" ? IMAGE_TYPES : DOC_TYPES;
  if (!type || !allowed[type]) {
    throw new DomainError("type", allow === "image" ? "Acceptăm doar imagini JPG, PNG sau WebP." : "Acceptăm imagini (JPG, PNG, WebP) sau PDF.");
  }
  if (!/^[a-z0-9/_-]+$/i.test(scope)) throw new Error("scope invalid");
  const rel = `${scope}/${randomUUID()}.${allowed[type]}`;
  const abs = path.join(root(), rel);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, buf);
  return { path: rel, type, size: file.size, name: file.name.slice(0, 200) };
}

export async function readUpload(rel: string) {
  const abs = path.resolve(root(), rel);
  if (!abs.startsWith(root() + path.sep)) return null; // path traversal
  try {
    const s = await stat(abs);
    if (!s.isFile()) return null;
    const ext = path.extname(abs).slice(1);
    const type = Object.entries(DOC_TYPES).find(([, e]) => e === ext)?.[0] ?? "application/octet-stream";
    return { data: await readFile(abs), type };
  } catch {
    return null;
  }
}
