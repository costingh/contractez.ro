import { BadgeCheck, Check, Eye, MapPin, Receipt, Sparkles, Star } from "lucide-react";
import { rules } from "@/config/site";
import { cssVars } from "./css-vars";

const offers = [
  { at: 0.42, initials: "AP", name: "Andrei Pop", org: "WebCraft SRL", rating: "4,9", score: 94, price: "2.400 lei", tone: "from-[#5b7cff] to-[#22c3ee]" },
  { at: 0.53, initials: "IM", name: "Ioana Marin", org: "PFA · 6 ani experiență", rating: "5,0", score: 89, price: "2.800 lei", tone: "from-[#8b5cf6] to-[#5b7cff]" },
  { at: 0.64, initials: "RD", name: "Radu Dinu", org: "Studio Nord", rating: "4,8", score: 86, price: "2.150 lei", tone: "from-[#14b8a6] to-[#3b82f6]" },
];

/**
 * Demonstrația animată din hero, doar cu CSS: o cerere scrisă liber devine un brief structurat,
 * apoi sosesc ofertele (vezi .theater / .beat în globals.css). Decorativă: aria-hidden.
 */
export function ProductTheater() {
  return (
    <div aria-hidden className="theater relative mx-auto w-full max-w-[540px] select-none">
      {/* Halo în spatele panoului */}
      <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-[radial-gradient(closest-side,rgb(91_124_255/0.35),transparent)] blur-2xl" />

      <div className="glass rounded-[1.4rem] p-3 sm:p-4">
        {/* Bara de sus */}
        <div className="flex items-center justify-between px-2 pt-1 pb-3 text-[0.6875rem] font-medium tracking-[0.08em] text-white/45 uppercase">
          <span>Exemplu</span>
          <span className="flex items-center gap-1.5 normal-case tracking-normal text-white/55">
            <span className="live-dot size-1.5! text-emerald-400" /> în timp real
          </span>
        </div>

        {/* 1 · Mesajul scris liber */}
        <div className="beat flex gap-3 rounded-2xl bg-white/[0.06] p-3.5" style={cssVars({ at: 0.02 })}>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/12 text-xs font-semibold text-white/85">M</span>
          <div className="min-w-0 space-y-1">
            <div className="text-xs text-white/50">Maria · Cluj-Napoca</div>
            <p className="text-[0.8125rem] leading-relaxed text-white/85">
              Salut! Caut pe cineva să-mi facă un site pentru restaurant, cu meniu și rezervări. Buget 2–3 mii lei, cu factură.
            </p>
          </div>
        </div>

        {/* 2 · AI structurează */}
        <div className="beat-fade relative my-3 flex items-center gap-3 px-2" style={cssVars({ at: 0.13 })}>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/20" />
          <span className="flex items-center gap-1.5 text-xs font-medium">
            <Sparkles className="size-3.5 text-[#8ea6ff]" />
            <span className="text-gradient-ink">AI structurează cererea</span>
          </span>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/20" />
        </div>

        {/* 3 · Brief-ul (card deschis la culoare, ca să iasă în față) */}
        <div className="beat rounded-2xl bg-white p-4 text-[#0d1626] shadow-[0_20px_50px_-20px_rgb(0_0_0/0.7)]" style={cssVars({ at: 0.22 })}>
          <div className="flex items-center justify-between gap-2 text-[0.6875rem] text-[#5b6472]">
            <span>
              IT & Programare <span className="text-[#cfd0c9]">/</span> Site de prezentare
            </span>
            <span className="rounded-md bg-[#eef1fc] px-1.5 py-0.5 font-semibold text-[#2b4acb]">Calitate 92/100</span>
          </div>
          <div className="mt-2 text-[0.9375rem] leading-snug font-semibold tracking-[-0.012em]">
            Site de prezentare pentru restaurant, cu meniu și rezervări online
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5 text-[0.6875rem] font-medium">
            <span className="rounded-md bg-[#142340] px-2 py-1 text-white tabular-nums">2.000–3.000 lei</span>
            <span className="flex items-center gap-1 rounded-md border border-[#e3e3de] px-2 py-1">
              <MapPin className="size-3" /> Cluj-Napoca
            </span>
            <span className="flex items-center gap-1 rounded-md border border-[#e3e3de] px-2 py-1">
              <Receipt className="size-3" /> Cu factură
            </span>
            <span className="rounded-md border border-[#e3e3de] px-2 py-1">Rezervări online</span>
          </div>
          <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-[#ecece7] pt-3 text-[0.6875rem] text-[#5b6472]">
            <span className="flex items-center gap-2">
              <span className="flex gap-[3px]">
                {Array.from({ length: rules.defaultMaxApplications }, (_, i) => (
                  <span key={i} className="relative h-3 w-[7px] overflow-hidden rounded-[2px] bg-[#e3e3de]">
                    {i < offers.length && (
                      <span className="beat-fade absolute inset-0 bg-[#142340]" style={cssVars({ at: offers[i].at })} />
                    )}
                  </span>
                ))}
              </span>
              <span className="tabular-nums">
                <span className="beat-count font-semibold text-[#0d1626]" style={cssVars({ at: 0.4, to: 3 })} /> din {rules.defaultMaxApplications} oferte
              </span>
            </span>
            <span>trimis la 14 prestatori compatibili</span>
          </div>
        </div>

        {/* 4 · Ofertele */}
        <div className="mt-3 space-y-2">
          {offers.map((o) => (
            <div key={o.name} className="beat flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.045] px-3 py-2.5" style={cssVars({ at: o.at })}>
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${o.tone} text-xs font-semibold text-white`}>
                {o.initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-white">
                  <span className="truncate">{o.name}</span>
                  <BadgeCheck className="size-3.5 shrink-0 text-emerald-400" />
                </div>
                <div className="flex items-center gap-1.5 truncate text-[0.6875rem] text-white/50">
                  <Star className="size-3 fill-amber-300 text-amber-300" /> {o.rating} · {o.org}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[0.8125rem] font-semibold text-white tabular-nums">{o.price}</div>
                <div className="text-[0.6875rem] font-medium text-[#9fb5ff] tabular-nums">
                  <span className="beat-count" style={cssVars({ at: o.at, to: o.score })} />% compatibil
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Etichete plutitoare */}
      <div className="beat absolute top-[23.5%] -left-6 hidden sm:block lg:-left-16" style={cssVars({ at: 0.3 })}>
        <div className="bob flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-[#07130e]/85 px-3 py-2 text-xs text-emerald-200 shadow-xl backdrop-blur-md">
          <BadgeCheck className="size-4 text-emerald-400" />
          <span>
            <span className="font-semibold text-white">Firmă activă</span> · verificat ANAF
          </span>
        </div>
      </div>
      <div className="beat absolute -right-4 -bottom-12 hidden sm:block lg:-right-10" style={cssVars({ at: 0.76 })}>
        <div className="bob flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-2.5 text-xs text-[#0d1626] shadow-2xl [animation-delay:-3s]">
          <span className="flex size-6 items-center justify-center rounded-full bg-[#17714a] text-white">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
          <span>
            <span className="block font-semibold">3 oferte în 12 minute</span>
            <span className="flex items-center gap-1 text-[#5b6472]">
              <Eye className="size-3" /> fără apeluri, fără spam
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
