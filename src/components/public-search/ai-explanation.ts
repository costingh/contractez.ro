/**
 * Explicația căutării AI din `?aiexp=`: URL-ul poartă doar un cod, nu text. Textul afișat vine dintr-o listă fixă,
 * ca un link creat de altcineva să nu poată pune mesaje arbitrare într-o alertă cu aspect oficial.
 * Filtrele deduse apar oricum ca etichete (chips) sub alertă.
 */
export const AI_EXPLANATIONS = {
  ai: "Am transformat descrierea ta în filtrele de mai jos.",
  simplu: "Interpretare automată simplă (AI indisponibil). Ajustează filtrele dacă e nevoie.",
} as const;

export type AiExplanationCode = keyof typeof AI_EXPLANATIONS;

/** Codul necunoscut (ex. un link vechi, cu text) nu afișează nimic. */
export function aiExplanation(code: string | undefined): string | null {
  return code && Object.hasOwn(AI_EXPLANATIONS, code) ? AI_EXPLANATIONS[code as AiExplanationCode] : null;
}
