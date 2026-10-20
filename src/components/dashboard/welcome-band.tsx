import { Bot, Plus, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import type { PlanUsage } from "@/server/billing/plans";
import { PlanUsageGlass } from "./plan-usage-glass";

/**
 * Banda de bun venit din panou: panou „ink” cu numele în serif, acțiunile principale
 * și, pentru prestatori, aplicările rămase din plan.
 */
export function WelcomeBand({
  firstName,
  isProvider,
  isClient,
  usage,
}: {
  firstName: string;
  isProvider: boolean;
  isClient: boolean;
  usage: PlanUsage | null;
}) {
  const today = new Intl.DateTimeFormat("ro-RO", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Bucharest" }).format(new Date());

  return (
    <section className="ink-panel enter mt-6 rounded-[1.75rem] sm:mt-8 dark:ring-1 dark:ring-white/8">
      <div aria-hidden className="aurora aurora-a -top-48 -left-24 size-[520px] opacity-50" />
      <div aria-hidden className="aurora aurora-b -right-32 -bottom-56 size-[460px] opacity-35" />

      <div className="grid gap-8 px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[1fr_360px] lg:items-center lg:gap-12">
        <div className="min-w-0">
          <div className="text-xs font-medium tracking-[0.08em] text-white/50 uppercase first-letter:uppercase">{today}</div>
          <h1 className="display-md mt-3 text-white">
            Bună, <span className="serif-em text-gradient-ink">{firstName}</span>.
          </h1>
          <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-white/65">
            {isProvider && isClient
              ? "Proiectele potrivite pentru tine, ofertele primite și piața din zona ta, într-un singur loc."
              : isProvider
                ? "Proiectele potrivite pentru tine, aplicările tale și piața din zona ta."
                : "Proiectele tale și ofertele primite. Publici gratuit, alegi în liniște."}
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {isClient && (
              <Link
                href="/proiecte/nou"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#0b1426] transition-colors hover:bg-[#eef1fc]"
              >
                <Plus className="size-4" /> Publică proiect
              </Link>
            )}
            {isProvider && (
              <Link
                href="/recomandari"
                className={
                  isClient
                    ? "inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-4 text-sm font-medium text-white transition-colors hover:bg-white/[0.1]"
                    : "inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#0b1426] transition-colors hover:bg-[#eef1fc]"
                }
              >
                <Sparkles className="size-4" /> Recomandări
              </Link>
            )}
            {isProvider ? (
              <Link
                href={usage?.plan.autoBid ? "/auto-bid" : "/abonament"}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-4 text-sm font-medium text-white transition-colors hover:bg-white/[0.1]"
              >
                <Bot className="size-4" /> Auto Bid
              </Link>
            ) : (
              <Link
                href="/prestatori"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-4 text-sm font-medium text-white transition-colors hover:bg-white/[0.1]"
              >
                <Search className="size-4" /> Caută prestatori
              </Link>
            )}
          </div>
        </div>

        {usage && <PlanUsageGlass usage={usage} i={2} />}
      </div>
    </section>
  );
}
