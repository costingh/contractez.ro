import type { CSSProperties } from "react";

/** Variabile CSS inline (--at, --i, --to…) pentru animațiile din globals.css. */
export function cssVars(vars: Record<string, string | number>): CSSProperties {
  return Object.fromEntries(Object.entries(vars).map(([k, v]) => [`--${k}`, v])) as CSSProperties;
}
