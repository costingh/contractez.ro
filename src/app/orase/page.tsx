import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { cssVars } from "@/components/home/css-vars";
import { cities, countyLabel } from "@/content/cities";

export const metadata: Metadata = {
  title: "Prestatori și meseriași pe orașe",
  description: "Găsește electricieni, instalatori, firme de renovări, curățenie și mutări în orașul tău. Publici gratuit și primești până la 5 oferte verificate.",
  alternates: { canonical: "/orase" },
};

export default function CitiesPage() {
  const sorted = [...cities].sort((a, b) => a.name.localeCompare(b.name, "ro"));
  return (
    <div className="pb-16">
      <header className="border-b">
        <div className="container-page py-14 sm:py-20">
          <div className="enter eyebrow" style={cssVars({ i: 0 })}>
            Orașe
          </div>
          <h1 className="enter display-lg mt-4 max-w-3xl" style={cssVars({ i: 1 })}>
            Prestatori verificați, <span className="serif-em text-gradient">aproape de tine</span>.
          </h1>
          <p className="enter mt-5 max-w-2xl text-[1.0625rem] leading-relaxed text-muted-foreground" style={cssVars({ i: 2 })}>
            Alege orașul și vezi serviciile disponibile. Funcționează și pentru localitățile din jur: prestatorii își setează raza de deplasare.
          </p>
        </div>
      </header>
      <div className="container-page mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {sorted.map((c) => (
          <Link
            key={c.slug}
            href={`/orase/${c.slug}`}
            className="group flex items-center justify-between rounded-2xl border bg-card px-5 py-4 shadow-xs transition-colors hover:border-border-strong"
          >
            <span>
              <span className="block font-semibold">{c.name}</span>
              <span className="text-xs text-muted-foreground">{countyLabel(c)}</span>
            </span>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </div>
  );
}
