/** Textul de sub câmpul de telefon: cine îl poate vedea. */
export const CONTACT_PHONE_HINT = "Vizibil doar celeilalte părți dintr-o colaborare, după ce prestatorul o confirmă.";

/**
 * Numărul de telefon de contact (fără verificare SMS): acceptăm formatele românești uzuale
 * (0712 345 678, +40 712 345 678, 0040…, fix 021/02x/03x) și numere internaționale E.164 (+44…).
 * Rezultatul normalizat este E.164: „+40712345678”.
 */
export function normalizePhone(raw: string): string | null {
  let v = raw.trim().replace(/[\s.\-/()]/g, "");
  if (!v) return null;
  if (v.startsWith("00")) v = "+" + v.slice(2);
  // Național românesc: 0 + 9 cifre (mobil 07…, fix 02…/03…).
  if (/^0[237]\d{8}$/.test(v)) return "+40" + v.slice(1);
  // „40712345678” fără „+”.
  if (/^40[237]\d{8}$/.test(v)) return "+" + v;
  if (v.startsWith("+40")) return /^\+40[237]\d{8}$/.test(v) ? v : null;
  // Internațional: prefix de țară + număr, maximum 15 cifre (E.164).
  if (/^\+[1-9]\d{7,14}$/.test(v)) return v;
  return null;
}

/** Afișare lizibilă: „+40 712 345 678”; numerele străine rămân în format E.164. */
export function formatPhone(phone: string): string {
  const ro = /^\+40(\d{3})(\d{3})(\d{3})$/.exec(phone);
  return ro ? `+40 ${ro[1]} ${ro[2]} ${ro[3]}` : phone;
}
