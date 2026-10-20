import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cssVars } from "@/components/home/css-vars";

export default function NotFound() {
  return (
    <section className="px-2 pt-2 sm:px-3 sm:pt-3">
      <div className="ink-panel rounded-[1.75rem] sm:rounded-[2.25rem]">
        <div aria-hidden className="aurora aurora-a -top-48 left-[10%] size-[560px]" />
        <div aria-hidden className="aurora aurora-c right-[5%] -bottom-48 size-[480px] opacity-40" />
        <div className="container-page flex flex-col items-center py-24 text-center sm:py-32">
          <div className="enter serif-em text-gradient-ink text-[7rem] leading-none sm:text-[10rem]" style={cssVars({ i: 0 })}>
            404
          </div>
          <h1 className="enter display-md mt-4 text-white" style={cssVars({ i: 1 })}>
            Pagina nu există
          </h1>
          <p className="enter mt-4 max-w-md leading-relaxed text-white/60" style={cssVars({ i: 2 })}>
            Linkul poate fi greșit, iar proiectul sau profilul poate să fi fost șters ori închis.
          </p>
          <div className="enter mt-9 flex flex-wrap justify-center gap-3" style={cssVars({ i: 3 })}>
            <Link
              href="/"
              className="inline-flex h-12 items-center rounded-xl bg-white px-5 text-[0.9375rem] font-semibold text-[#0b1426] transition-colors hover:bg-[#eef1fc]"
            >
              Prima pagină
            </Link>
            <Link
              href="/proiecte"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-5 text-[0.9375rem] font-medium text-white transition-colors hover:bg-white/[0.1]"
            >
              Proiecte deschise <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
