import type { Metadata } from "next";
import { site } from "@/config/site";

/** Google taie titlurile pe la ~60 de caractere (580 px); peste prag, sufixul cu numele site-ului se pierde oricum. */
const MAX_TITLE = 60;
const SUFFIX = ` · ${site.name}`;

/**
 * Titlul paginii cu sufixul „· Contractez” din șablonul layout-ului doar dacă încape;
 * altfel titlul rămâne întreg, fără sufix, ca să nu fie tăiat chiar cuvântul cheie de la final.
 */
export function pageTitle(title: string): Metadata["title"] {
  return title.length + SUFFIX.length <= MAX_TITLE ? title : { absolute: title };
}

/** Taie o meta description prea lungă la ultimul cuvânt întreg (Google afișează ~155–160 de caractere). */
export function metaDescription(text: string, max = 158): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.\s]+$/, "")}…`;
}
