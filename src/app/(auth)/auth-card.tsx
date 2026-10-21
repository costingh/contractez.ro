import { BadgeCheck, LockKeyhole, MessagesSquare, Star } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cssVars } from "@/components/home/css-vars";
import { rules } from "@/config/site";
import { features } from "@/server/features";

const trust = [
  {
    icon: BadgeCheck,
    title: "Prestatori verificați",
    text: features.phoneVerification
      ? "Firmă confirmată în registrul ANAF, email și telefon verificate."
      : "Firmă confirmată în registrul ANAF și email verificat.",
  },
  { icon: MessagesSquare, title: "Oferte relevante, fără spam", text: `Maximum ${rules.defaultMaxApplications} oferte per proiect, doar de la prestatori compatibili.` },
  { icon: Star, title: "Recenzii reale", text: "Se pot lăsa doar după o colaborare confirmată de ambele părți." },
];

/** Titlul implicit din panoul întunecat; paginile îl pot înlocui (ex. înregistrarea ca prestator). */
const defaultHeadline = (
  <>
    Servicii de încredere, de la oameni <span className="serif-em text-gradient-ink">verificați</span>.
  </>
);

export function AuthCard({
  title,
  description,
  children,
  footer,
  headline = defaultHeadline,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  headline?: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 px-2 pt-2 sm:px-3 sm:pt-3 lg:min-h-[calc(100dvh-4.5rem)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* Panoul „ink”: pe mobil o bandă scurtă, pe desktop jumătate de ecran */}
      <aside className="ink-panel flex flex-col justify-between rounded-[1.5rem] px-6 py-7 sm:rounded-[2rem] sm:px-10 sm:py-10 lg:px-14 lg:py-14">
        <div aria-hidden className="aurora aurora-a -top-40 -left-32 size-[560px]" />
        <div aria-hidden className="aurora aurora-b right-[-30%] bottom-[-20%] size-[520px] opacity-40" />
        <div aria-hidden className="aurora aurora-c top-[40%] left-[20%] hidden size-[420px] opacity-30 lg:block" />

        <div className="enter text-lg text-white" style={cssVars({ i: 0 })}>
          <Logo tone="ink" markClassName="size-8" />
        </div>

        <div className="lg:my-auto lg:py-12">
          <p className="enter mt-3 max-w-lg text-[1.75rem] leading-[1.06] font-semibold tracking-[-0.035em] text-balance text-white sm:text-[2.25rem] lg:mt-0 lg:text-[3.25rem]" style={cssVars({ i: 1 })}>
            {headline}
          </p>
          <ul className="mt-10 hidden max-w-md space-y-3 lg:block">
            {trust.map(({ icon: Icon, title: t, text }, n) => (
              <li key={t} className="enter glass flex gap-4 rounded-2xl p-4" style={cssVars({ i: n + 2 })}>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]">
                  <Icon className="size-4 text-emerald-400" strokeWidth={1.9} />
                </span>
                <div>
                  <div className="text-sm font-medium text-white">{t}</div>
                  <p className="mt-0.5 text-sm leading-relaxed text-white/55">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="enter mt-6 hidden items-center gap-1.5 text-xs text-white/45 lg:flex" style={cssVars({ i: 5 })}>
          <LockKeyhole className="size-3.5" /> Conexiune securizată · date prelucrate conform GDPR
        </p>
      </aside>

      <div className="flex items-center justify-center px-2 py-10 sm:py-14">
        <div className="enter w-full max-w-[26rem]" style={cssVars({ i: 2 })}>
          <div className="mb-7 space-y-2">
            <h1 className="text-[1.875rem] leading-[1.1] font-semibold tracking-[-0.032em]">{title}</h1>
            {description && <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">{description}</p>}
          </div>
          <div className="rounded-2xl border bg-card p-6 shadow-md sm:p-7">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground lg:hidden">
            <LockKeyhole className="size-3.5" /> Conexiune securizată · date prelucrate conform GDPR
          </p>
        </div>
      </div>
    </div>
  );
}
