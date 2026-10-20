import { ArrowUpRight, BadgeCheck, Ban, MessagesSquare, Star } from "lucide-react";
import Link from "next/link";
import { freePlan, rules } from "@/config/site";
import { cssVars } from "./css-vars";
import { HeroPrompt } from "./hero-prompt";
import { ProductTheater } from "./product-theater";

const words = ["un site nou.", "un instalator.", "o renovare.", "un fotograf.", "un contabil.", "meditații."];

export function Hero({ openProjects }: { openProjects: number }) {
  return (
    <section className="px-2 pt-2 sm:px-3 sm:pt-3">
      <div className="ink-panel rounded-[1.75rem] sm:rounded-[2.25rem]">
        <div aria-hidden className="aurora aurora-a -top-40 left-[-10%] size-[640px]" />
        <div aria-hidden className="aurora aurora-b top-[20%] right-[-15%] size-[560px]" />
        <div aria-hidden className="aurora aurora-c bottom-[-30%] left-[30%] size-[520px] opacity-35" />

        <div className="container-page grid gap-14 pt-14 pb-16 sm:pt-20 sm:pb-24 lg:grid-cols-[1.08fr_1fr] lg:items-center lg:gap-10 lg:pt-24 lg:pb-28">
          <div>
            <Link
              href="/proiecte"
              className="enter group inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] py-1 pr-2.5 pl-3 text-xs font-medium text-white/80 backdrop-blur transition-colors hover:border-white/25 hover:text-white"
              style={cssVars({ i: 0 })}
            >
              <span className="live-dot size-1.5! text-emerald-400" />
              <span className="tabular-nums">{openProjects.toLocaleString("ro-RO")}</span> proiecte deschise acum
              <ArrowUpRight className="size-3.5 text-white/50 transition-transform group-hover:translate-x-px group-hover:-translate-y-px" />
            </Link>

            <h1 className="display-xl mt-7 text-white">
              <span className="enter block" style={cssVars({ i: 1 })}>
                Ai nevoie de
              </span>
              <span className="enter rotator" style={cssVars({ i: 2 })}>
                <span>
                  {[...words, words[0]].map((w, i) => (
                    <span key={i} className="serif-em text-gradient-ink">
                      {w}
                    </span>
                  ))}
                </span>
              </span>
              <span className="sr-only">Orice serviciu, de la prestatori verificați.</span>
            </h1>

            <p className="enter mt-7 max-w-xl text-[1.0625rem] leading-[1.7] text-white/65 sm:text-lg" style={cssVars({ i: 3 })}>
              Scrie-o în cuvintele tale. AI-ul o transformă într-un brief clar, o trimitem{" "}
              <mark className="hl-ink enter-hl bg-transparent" style={cssVars({ i: 0 })}>
                doar prestatorilor compatibili
              </mark>{" "}
              și primești{" "}
              <mark className="hl-ink enter-hl bg-transparent" style={cssVars({ i: 1 })}>
                maximum {rules.defaultMaxApplications} oferte
              </mark>
              . Totul{" "}
              <mark className="hl-ink enter-hl bg-transparent" style={cssVars({ i: 2 })}>
                gratuit
              </mark>
              , fără apeluri de vânzări.
            </p>

            <div className="enter mt-9 max-w-xl" style={cssVars({ i: 4 })}>
              <HeroPrompt />
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/55">
                <Link href="/inregistrare?rol=prestator" className="font-medium text-white/85 underline-offset-4 hover:text-white hover:underline">
                  Ești prestator? Primești {freePlan.monthlyApplications} aplicări gratuite pe lună →
                </Link>
              </div>
            </div>

            <ul className="enter mt-10 flex max-w-xl flex-wrap gap-x-6 gap-y-3 border-t border-white/10 pt-6 text-[0.8125rem] text-white/60" style={cssVars({ i: 5 })}>
              <li className="flex items-center gap-2">
                <BadgeCheck className="size-4 shrink-0 text-emerald-400" /> Verificare ANAF
              </li>
              <li className="flex items-center gap-2">
                <Ban className="size-4 shrink-0 text-white/45" /> Zero comision
              </li>
              <li className="flex items-center gap-2">
                <Star className="size-4 shrink-0 text-white/45" /> Recenzii reale
              </li>
              <li className="flex items-center gap-2">
                <MessagesSquare className="size-4 shrink-0 text-white/45" /> Chat inclus
              </li>
            </ul>
          </div>

          <div className="enter lg:pl-6" style={cssVars({ i: 3 })}>
            <ProductTheater />
          </div>
        </div>
      </div>
    </section>
  );
}
