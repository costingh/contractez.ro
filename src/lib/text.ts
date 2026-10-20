/** Elimină diacriticele și normalizează textul pentru căutare. */
export function normalizeText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[șş]/gi, "s")
    .replace(/[țţ]/gi, "t")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(input: string): string {
  return normalizeText(input)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function truncate(input: string, max: number): string {
  if (input.length <= max) return input;
  return input.slice(0, max - 1).trimEnd() + "…";
}

export function pluralRo(n: number, one: string, many: string, manyDe = true): string {
  if (n === 1) return `1 ${one}`;
  // În română: 20+ (cu excepția celor care se termină în 01-19) primesc „de”.
  const mod = n % 100;
  const needsDe = manyDe && (n >= 20 && (mod === 0 || mod >= 20));
  return `${n} ${needsDe ? "de " : ""}${many}`;
}
