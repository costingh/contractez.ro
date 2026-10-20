import { cn } from "@/lib/utils";

/*
 * Semnul Contractez: un C deschis care ține o bifă (cererea, închisă cu un om verificat).
 * Geometria e aceeași ca în public/brand/*.svg, src/app/icon.svg și pe canvas-ul de brand din Claude Design.
 * Bifa e verde pentru că verde înseamnă „verificat” în tot produsul.
 */

type Tone = "auto" | "ink";

const stops = {
  paper: ["#1c2f57", "#142340", "#2b4acb"],
  ink: ["#22386a", "#18294d", "#3b5bdb"],
};

export function LogoMark({ className, tone = "auto", title }: { className?: string; tone?: Tone; title?: string }) {
  const id = tone === "ink" ? "cz-tile-ink" : "cz-tile";
  const [a, b, c] = stops[tone === "ink" ? "ink" : "paper"];
  return (
    <svg viewBox="0 0 64 64" className={cn("size-7 shrink-0", className)} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="0.55" stopColor={b} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill={`url(#${id})`} />
      {/* Contur fin: mereu pe ink, doar în modul întunecat pentru „auto” */}
      <rect
        x="0.75"
        y="0.75"
        width="62.5"
        height="62.5"
        rx="14.25"
        fill="none"
        strokeWidth="1.5"
        className={tone === "ink" ? "stroke-white/20" : "stroke-transparent dark:stroke-white/20"}
      />
      <g transform="translate(2 0)">
        <path d="M45.02 21.07A17 17 0 1 0 45.02 42.93" fill="none" stroke="#fff" strokeWidth="6.5" strokeLinecap="round" />
        <path d="M25.5 32.5l4.5 4.5 9-10" fill="none" stroke="#4cc38a" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/** Semnul + wordmark-ul „contractez” (litere mici). În text curent numele se scrie „Contractez”. */
export function Logo({ className, markClassName, tone = "auto" }: { className?: string; markClassName?: string; tone?: Tone }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark tone={tone} className={markClassName} />
      <span className="font-semibold tracking-[-0.045em]">contractez</span>
    </span>
  );
}
