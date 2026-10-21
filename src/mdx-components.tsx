import { ArrowRight, Info, Lightbulb, TriangleAlert } from "lucide-react";
import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Casetă evidențiată în articole: <Callout type="tip">…</Callout> */
function Callout({ type = "info", title, children }: { type?: "info" | "tip" | "warning"; title?: string; children: React.ReactNode }) {
  const Icon = type === "tip" ? Lightbulb : type === "warning" ? TriangleAlert : Info;
  return (
    <aside
      className={cn(
        "my-7 flex gap-3 rounded-2xl border p-5 text-[0.9375rem] leading-relaxed",
        type === "warning" ? "border-amber-500/30 bg-amber-500/[0.06]" : "border-brand/20 bg-brand-soft",
      )}
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", type === "warning" ? "text-amber-600 dark:text-amber-400" : "text-brand")} />
      <div className="space-y-2 [&_p]:m-0">
        {title && <p className="font-semibold text-foreground">{title}</p>}
        {children}
      </div>
    </aside>
  );
}

/** Îndemn către publicarea unui proiect sau o categorie: <Cta href="/categorii/…">Text</Cta> */
function Cta({ href = "/proiecte/nou", title, children }: { href?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="ink-panel my-9 rounded-2xl p-6 sm:p-7">
      <p className="text-lg font-semibold tracking-[-0.01em] text-white">{title}</p>
      {children && <div className="mt-2 text-sm leading-relaxed text-white/65 [&_p]:m-0 [&_p]:text-white/65">{children}</div>}
      <Link
        href={href}
        className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#0b1426] transition-colors hover:bg-[#eef1fc]"
      >
        Primește oferte gratuite <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

const components: MDXComponents = {
  h2: ({ className, ...props }) => <h2 className={cn("mt-12 mb-4 scroll-mt-24 text-[1.625rem] leading-tight font-semibold tracking-[-0.025em]", className)} {...props} />,
  h3: ({ className, ...props }) => <h3 className={cn("mt-8 mb-3 scroll-mt-24 text-xl font-semibold tracking-[-0.015em]", className)} {...props} />,
  p: ({ className, ...props }) => <p className={cn("my-5 leading-[1.8] text-foreground/85", className)} {...props} />,
  ul: ({ className, ...props }) => <ul className={cn("my-5 list-disc space-y-2 pl-6 leading-[1.75] text-foreground/85 marker:text-brand/60", className)} {...props} />,
  ol: ({ className, ...props }) => <ol className={cn("my-5 list-decimal space-y-2 pl-6 leading-[1.75] text-foreground/85 marker:text-muted-foreground", className)} {...props} />,
  strong: ({ className, ...props }) => <strong className={cn("font-semibold text-foreground", className)} {...props} />,
  a: ({ href = "", className, ...props }) =>
    href.startsWith("/") ? (
      <Link href={href} className={cn("font-medium text-brand underline underline-offset-4 hover:no-underline", className)} {...props} />
    ) : (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cn("font-medium text-brand underline underline-offset-4 hover:no-underline", className)} {...props} />
    ),
  blockquote: ({ className, ...props }) => <blockquote className={cn("my-6 border-l-2 border-brand/40 pl-5 text-foreground/75 italic", className)} {...props} />,
  table: ({ className, ...props }) => (
    <div className="my-7 overflow-x-auto rounded-2xl border bg-card shadow-xs">
      <table className={cn("w-full text-left text-sm", className)} {...props} />
    </div>
  ),
  thead: ({ className, ...props }) => <thead className={cn("bg-muted/60 text-xs text-muted-foreground", className)} {...props} />,
  th: ({ className, ...props }) => <th className={cn("px-4 py-3 font-medium whitespace-nowrap", className)} {...props} />,
  td: ({ className, ...props }) => <td className={cn("border-t px-4 py-3 align-top", className)} {...props} />,
  hr: () => <hr className="my-10 border-border" />,
  Callout,
  Cta,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
