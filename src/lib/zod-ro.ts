import { z } from "zod";

/**
 * Mesajele de validare Zod în română, pentru utilizatori (nu pentru programatori).
 * Se aplică global la încărcarea modulului: îl importă `src/server/env.ts` (încărcat de tot codul de server)
 * și `src/lib/action.ts`. Mesajele scrise explicit în scheme (ex. `.min(2, "Scrie-ți numele")`) au prioritate.
 */

const fmt = (n: number | bigint) => (typeof n === "number" && Math.abs(n) >= 10_000 ? n.toLocaleString("ro-RO") : String(n));

/** „1 caracter”, „5 caractere”, „20 de caractere” (regula lui „de” pentru numerele ≥ 20). */
export function roCount(n: number | bigint, one: string, many: string) {
  const v = Number(n);
  if (v === 1) return `1 ${one}`;
  const rest = Math.abs(v) % 100;
  return `${fmt(n)} ${rest === 0 && v !== 0 ? "de " : rest >= 20 ? "de " : ""}${many}`;
}

function sized(origin: string, n: number | bigint) {
  switch (origin) {
    case "string":
      return roCount(n, "caracter", "caractere");
    case "array":
    case "set":
      return roCount(n, "element", "elemente");
    case "file":
      return roCount(n, "octet", "octeți");
    default:
      return null;
  }
}

const isEmpty = (v: unknown) => v === undefined || v === null || (typeof v === "string" && v.trim() === "");

export const roZodError: z.core.$ZodErrorMap = (issue) => {
  switch (issue.code) {
    case "invalid_type": {
      if (isEmpty(issue.input)) return "Câmpul este obligatoriu.";
      if (issue.expected === "number" || issue.expected === "int" || issue.expected === "bigint") return "Introdu un număr valid.";
      if (issue.expected === "date") return "Introdu o dată validă.";
      if (issue.expected === "boolean") return "Alege da sau nu.";
      if (issue.expected === "array") return "Alege cel puțin o opțiune.";
      return "Valoare invalidă.";
    }
    case "too_small": {
      const { origin, minimum, inclusive, exact } = issue;
      if (origin === "string" && Number(minimum) === 1 && inclusive !== false) return "Câmpul este obligatoriu.";
      const what = sized(origin, minimum);
      if (what) {
        if (exact) return `Trebuie să aibă exact ${what}.`;
        if (origin === "array" || origin === "set") return `Alege cel puțin ${what}.`;
        return `Trebuie să aibă cel puțin ${what}.`;
      }
      if (origin === "date") return "Data este prea devreme.";
      return inclusive === false ? `Valoarea trebuie să fie mai mare decât ${fmt(minimum)}.` : `Valoarea trebuie să fie cel puțin ${fmt(minimum)}.`;
    }
    case "too_big": {
      const { origin, maximum, inclusive, exact } = issue;
      const what = sized(origin, maximum);
      if (what) {
        if (exact) return `Trebuie să aibă exact ${what}.`;
        if (origin === "file") return `Fișierul este prea mare (cel mult ${what}).`;
        if (origin === "array" || origin === "set") return `Poți alege cel mult ${what}.`;
        return `Poate avea cel mult ${what}.`;
      }
      if (origin === "date") return "Data este prea târzie.";
      return inclusive === false ? `Valoarea trebuie să fie mai mică decât ${fmt(maximum)}.` : `Valoarea poate fi cel mult ${fmt(maximum)}.`;
    }
    case "invalid_format":
      switch (issue.format) {
        case "email":
          return "Adresa de email nu este validă.";
        case "url":
          return "Linkul nu este valid (ex: https://exemplu.ro).";
        case "uuid":
        case "guid":
          return "Identificator invalid.";
        case "date":
        case "datetime":
          return "Introdu o dată validă.";
        default:
          return "Formatul nu este valid.";
      }
    case "invalid_value":
      return issue.values.length === 1 ? "Valoare invalidă." : "Alege una dintre opțiunile disponibile.";
    case "not_multiple_of":
      return `Valoarea trebuie să fie multiplu de ${issue.divisor}.`;
    case "unrecognized_keys":
      return "Date neașteptate în formular.";
    case "invalid_union":
    case "invalid_key":
    case "invalid_element":
    case "custom":
    default:
      return "Valoare invalidă.";
  }
};

z.config({ customError: roZodError });
