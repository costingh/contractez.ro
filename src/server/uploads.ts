import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { rules } from "@/config/site";
import { env } from "./env";
import { DomainError } from "./errors";
import { rateLimit } from "./rate-limit";

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

export const MAX_UPLOAD_MESSAGE = `Fișierul depășește ${Math.round(rules.maxUploadBytes / 1024 / 1024)} MB.`;

/** Câte fișiere poate încărca un utilizator într-o oră (avatar, copertă, portofoliu, chat). */
const UPLOADS_PER_HOUR = 30;

/**
 * Limita de încărcări per utilizator. Se apelează după celelalte verificări (conversație închisă,
 * limita portofoliului etc.) și imediat înainte de `saveUpload`.
 */
export async function assertUploadAllowed(userId: string) {
  if (!(await rateLimit(`upload:${userId}`, UPLOADS_PER_HOUR, 3600))) {
    throw new DomainError("rate", "Ai încărcat prea multe fișiere într-o oră. Încearcă din nou mai târziu.");
  }
}

/**
 * Salvează un fișier încărcat. `scope`:
 *  - "public/avatars", "public/portfolio", "public/covers": accesibile oricui;
 *  - "chat/<conversationId>": doar participanților conversației.
 */
export async function saveUpload(file: File, scope: string, allow: "image" | "document" = "image") {
  if (!file || file.size === 0) throw new DomainError("empty", "Fișierul este gol.");
  if (file.size > rules.maxUploadBytes) throw new DomainError("size", MAX_UPLOAD_MESSAGE);
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

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
/** Singurele căi de fișiere servite: exact forma produsă de saveUpload (fără „..”, „%”, „\\” sau alte segmente). */
const UPLOAD_PATH = new RegExp(`^(?:public/(?:avatars|portfolio|covers)|chat/${UUID})/${UUID}\\.(?:jpg|png|webp|pdf)$`);

/** Validează o cale relativă de upload; întoarce scope-ul (public / chat + id conversație) sau null. */
export function parseUploadPath(rel: string): { kind: "public" } | { kind: "chat"; conversationId: string } | null {
  if (!UPLOAD_PATH.test(rel)) return null;
  const parts = rel.split("/");
  return parts[0] === "chat" ? { kind: "chat", conversationId: parts[1] } : { kind: "public" };
}

export async function readUpload(rel: string) {
  if (!parseUploadPath(rel)) return null;
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

/**
 * Șterge un fișier încărcat (avatar sau copertă înlocuite, lucrare ștearsă, cont șters). Acceptă doar căile
 * produse de `saveUpload` (validate cu `parseUploadPath`); orice altceva e ignorat. Nu aruncă: un fișier lipsă
 * sau o eroare de disc nu trebuie să blocheze operația principală. Întoarce `true` dacă fișierul a fost șters.
 */
export async function deleteUpload(rel: string | null | undefined): Promise<boolean> {
  if (!rel || !parseUploadPath(rel)) return false;
  const abs = path.resolve(root(), rel);
  if (!abs.startsWith(root() + path.sep)) return false;
  try {
    await unlink(abs);
    return true;
  } catch {
    return false;
  }
}
