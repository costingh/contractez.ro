import { unstable_rethrow } from "next/navigation";
import { ZodError } from "zod";
import "./zod-ro";

export type ActionState<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | null;

/** Convertește erorile de business/validare în mesaje afișabile. Re-aruncă redirect/notFound. */
export function toActionError(err: unknown): { ok: false; error: string; fieldErrors?: Record<string, string> } {
  unstable_rethrow(err);
  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: Object.values(fieldErrors)[0] ?? "Date invalide.", fieldErrors };
  }
  if (err instanceof Error && (err.name === "DomainError" || err.name === "ActionError")) {
    return { ok: false, error: err.message };
  }
  // Un identificator invalid a ajuns totuși în Postgres (invalid_text_representation): tratat ca „nu există”, nu ca eroare.
  const pgCode = (e: unknown) => (e && typeof e === "object" && "code" in e ? (e as { code?: unknown }).code : undefined);
  if (pgCode(err) === "22P02" || (err instanceof Error && pgCode(err.cause) === "22P02")) {
    return { ok: false, error: "Elementul nu există sau nu mai este disponibil." };
  }
  console.error(err);
  return { ok: false, error: "A apărut o eroare neașteptată. Încearcă din nou." };
}

export function formBool(fd: FormData, key: string) {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

export function formStr(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

export function formNum(fd: FormData, key: string): number | null {
  const v = fd.get(key);
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n) : null;
}
