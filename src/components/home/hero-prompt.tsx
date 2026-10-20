"use client";

import { ArrowRight } from "lucide-react";
import { cssVars } from "./css-vars";
import { DRAFT_COOKIE } from "./draft";


const examples = ["Un electrician în Iași, urgent", "Logo pentru o cafenea din Cluj", "Meditații la mate, clasa a XII-a", "Site de prezentare cu rezervări"];

/**
 * Caseta din hero: un formular GET simplu către /proiecte/nou (merge și fără JS).
 * Textul e păstrat și într-un cookie de 30 de minute, citit de pagina de publicare.
 */
export function HeroPrompt() {
  return (
    <form
      action="/proiecte/nou"
      method="get"
      onSubmit={(e) => {
        const text = new FormData(e.currentTarget).get("cerere");
        if (typeof text === "string" && text.trim()) {
          document.cookie = `${DRAFT_COOKIE}=${encodeURIComponent(text.trim())}; max-age=1800; path=/; samesite=lax`;
        }
      }}
      className="prompt ring-glow group relative flex flex-col gap-2 rounded-2xl bg-white/[0.07] p-2 shadow-[0_20px_60px_-25px_rgb(91_124_255/0.6)] backdrop-blur-md transition-colors focus-within:bg-white/[0.1] sm:flex-row sm:items-center"
    >
      <label htmlFor="hero-cerere" className="sr-only">
        Descrie ce ai nevoie
      </label>
      <div className="relative flex min-w-0 flex-1 items-center">
        <input
          id="hero-cerere"
          name="cerere"
          placeholder=" "
          autoComplete="off"
          maxLength={600}
          className="h-12 w-full min-w-0 bg-transparent px-4 text-[0.9375rem] text-white outline-none placeholder:text-transparent"
        />
        <span className="typer inset-y-0 left-4 font-mono text-[0.8125rem] text-white/55 sm:text-sm" aria-hidden>
          {examples.map((ex, k) => (
            <span key={ex} style={cssVars({ chars: ex.length, k })}>
              {ex}
            </span>
          ))}
        </span>
      </div>
      <button
        type="submit"
        className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 text-[0.9375rem] font-semibold text-[#0b1426] shadow-[0_8px_24px_-8px_rgb(255_255_255/0.5)] transition-[transform,background-color] duration-200 hover:bg-[#eef1fc] active:translate-y-px"
      >
        Publică gratuit <ArrowRight className="size-4 transition-transform duration-200 group-focus-within:translate-x-0.5" />
      </button>
    </form>
  );
}
