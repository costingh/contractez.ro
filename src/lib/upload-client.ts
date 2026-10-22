/**
 * Verificări de fișiere în browser, înainte de trimiterea către server. Serverul refuză oricum fișierele
 * de peste 5 MB, dar o cerere mai mare decât limita acțiunilor (6 MB) nu mai ajunge la cod: Next răspunde
 * cu eroare și pagina ar fi înlocuită de ecranul de eroare. De aceea oprim fișierele mari aici.
 */
import { rules } from "@/config/site";

export const MAX_UPLOAD_BYTES = rules.maxUploadBytes;
export const FILE_TOO_LARGE = `Fișierul depășește ${Math.round(rules.maxUploadBytes / 1024 / 1024)} MB.`;
/** Când acțiunea eșuează înainte să răspundă (rețea, limită de dimensiune). */
export const UPLOAD_FAILED = "Nu am putut trimite fișierul. Verifică dimensiunea (max 5 MB) și conexiunea, apoi încearcă din nou.";

export function isTooLarge(file: File | null | undefined) {
  return Boolean(file && file.size > MAX_UPLOAD_BYTES);
}

const RESIZABLE = new Set(["image/jpeg", "image/png", "image/webp"]);

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("imagine ilizibilă"));
    };
    img.src = url;
  });
}

/**
 * Micșorează o fotografie (ex. de pe telefon) la cel mult `maxSide` pixeli pe latura lungă, ca JPEG.
 * Imaginile deja mici și ușoare rămân neschimbate (PNG-urile își păstrează calitatea). Browserele moderne
 * aplică orientarea EXIF la desenare, deci fotografiile verticale rămân verticale. La orice eroare
 * întoarce fișierul original (serverul îl validează oricum).
 */
export async function downscaleImage(file: File, maxSide = 2000, quality = 0.85): Promise<File> {
  if (!RESIZABLE.has(file.type) || typeof document === "undefined") return file;
  try {
    const img = await loadImage(file);
    const longest = Math.max(img.naturalWidth, img.naturalHeight);
    // Sub ~1,5 MB și în limita de pixeli: nu are rost să re-codăm.
    if (longest <= maxSide && file.size <= 1.5 * 1024 * 1024) return file;
    const scale = Math.min(1, maxSide / longest);
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    // JPEG nu are transparență: fundal alb în loc de negru pentru PNG-uri.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;
    const name = `${file.name.replace(/\.[^.]+$/, "") || "imagine"}.jpg`;
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}

/** Pregătește o imagine pentru încărcare: o micșorează și verifică limita de 5 MB. */
export async function prepareImage(file: File, maxSide = 2000): Promise<{ ok: true; file: File } | { ok: false; error: string }> {
  const out = await downscaleImage(file, maxSide);
  if (isTooLarge(out)) return { ok: false, error: FILE_TOO_LARGE };
  return { ok: true, file: out };
}
