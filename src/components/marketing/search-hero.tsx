import { Sparkles } from "lucide-react";
import { cssVars } from "@/components/home/css-vars";

/**
 * Antet „ink” pentru paginile de căutare (proiecte, prestatori): titlu mare + căutare AI
 * în limbaj natural. Formularul e un GET simplu (câmpul `ai`), ca înainte.
 */
export function SearchHero({
  eyebrow,
  title,
  description,
  action,
  searchAction,
  placeholder,
  stat,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description: React.ReactNode;
  action?: React.ReactNode;
  /** Ruta la care se trimite căutarea AI. */
  searchAction: string;
  placeholder: string;
  /** Mică statistică live afișată lângă eyebrow (ex. „12 proiecte deschise”). */
  stat?: React.ReactNode;
}) {
  return (
    <section className="px-2 pt-2 sm:px-3 sm:pt-3">
      <div className="ink-panel rounded-[1.75rem] sm:rounded-[2.25rem]">
        <div aria-hidden className="aurora aurora-a -top-56 -left-32 size-[560px] opacity-50" />
        <div aria-hidden className="aurora aurora-b -right-40 -bottom-64 size-[520px] opacity-35" />
        <div className="container-page py-12 sm:py-16">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="enter flex flex-wrap items-center gap-3 text-xs font-medium tracking-[0.08em] text-white/50 uppercase" style={cssVars({ i: 0 })}>
                {eyebrow}
                {stat && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.06] px-2.5 py-0.5 tracking-normal normal-case text-white/75">
                    <span className="live-dot size-1.5! text-emerald-400" />
                    {stat}
                  </span>
                )}
              </div>
              <h1 className="enter display-lg mt-4 text-white" style={cssVars({ i: 1 })}>
                {title}
              </h1>
              <p className="enter mt-4 text-[1.0625rem] leading-relaxed text-white/65" style={cssVars({ i: 2 })}>
                {description}
              </p>
            </div>
            {action && (
              <div className="enter shrink-0" style={cssVars({ i: 3 })}>
                {action}
              </div>
            )}
          </div>

          <form
            action={searchAction}
            className="enter ring-glow mt-8 flex flex-col gap-2 rounded-2xl bg-white/[0.07] p-2 backdrop-blur-md transition-colors focus-within:bg-white/[0.1] sm:flex-row sm:items-center"
            style={cssVars({ i: 3 })}
          >
            <div className="relative flex-1">
              <Sparkles className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#9fb5ff]" />
              <input
                name="ai"
                placeholder={placeholder}
                aria-label="Căutare AI în limbaj natural"
                className="h-12 w-full min-w-0 bg-transparent pr-4 pl-11 text-[0.9375rem] text-white outline-none placeholder:text-white/40"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 text-[0.9375rem] font-semibold text-[#0b1426] transition-colors hover:bg-[#eef1fc]"
            >
              Caută cu AI
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
