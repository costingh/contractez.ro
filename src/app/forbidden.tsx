import { ShieldX } from "lucide-react";
import Link from "next/link";
import { cssVars } from "@/components/home/css-vars";
import { Button } from "@/components/ui/button";

export default function Forbidden() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center sm:py-32">
      <div className="enter relative" style={cssVars({ i: 0 })}>
        <div aria-hidden className="absolute -inset-6 rounded-full bg-destructive/10 blur-2xl" />
        <div className="relative flex size-14 items-center justify-center rounded-2xl border bg-card shadow-md">
          <ShieldX className="size-6 text-foreground/75" strokeWidth={1.75} />
        </div>
      </div>
      <div className="enter mt-6 font-mono text-sm font-medium tracking-[0.2em] text-muted-foreground" style={cssVars({ i: 1 })}>
        403
      </div>
      <h1 className="enter display-md mt-3" style={cssVars({ i: 2 })}>
        Acces interzis
      </h1>
      <p className="enter mt-3 max-w-md leading-relaxed text-muted-foreground" style={cssVars({ i: 3 })}>
        Nu ai permisiunea să vezi această pagină.
      </p>
      <Button asChild size="lg" className="enter mt-8 h-12 rounded-xl px-6" style={cssVars({ i: 4 })}>
        <Link href="/panou">Înapoi la panou</Link>
      </Button>
    </div>
  );
}
