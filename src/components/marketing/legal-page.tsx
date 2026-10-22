import { FileText, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { cssVars } from "@/components/home/css-vars";

const docs = [
  { href: "/termeni", label: "Termeni și condiții", icon: FileText },
  { href: "/confidentialitate", label: "Confidențialitate (GDPR)", icon: ShieldCheck },
  { href: "/contact", label: "Contact și raportări", icon: Mail },
];

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="pb-16">
      <header className="relative overflow-hidden border-b">
        {/* punctaj fin, estompat: textură de „hârtie” pentru documente */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background-image:radial-gradient(var(--border-strong)_1px,transparent_1px)] [background-size:18px_18px] opacity-70 [mask-image:radial-gradient(ellipse_70%_90%_at_30%_0%,black,transparent)]"
        />
        <div className="container-page relative py-14 sm:py-20">
          <div className="enter eyebrow" style={cssVars({ i: 0 })}>
            Document legal
          </div>
          <h1 className="enter display-lg mt-4 max-w-3xl" style={cssVars({ i: 1 })}>
            {title}
          </h1>
          <p className="enter mt-4 text-sm text-muted-foreground" style={cssVars({ i: 2 })}>
            Ultima actualizare: {updated}
          </p>
        </div>
      </header>

      <div className="container-page mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="max-w-3xl">
          <div className="space-y-5 text-[0.9375rem] leading-[1.75] [&_a]:text-brand [&_a]:underline-offset-4 hover:[&_a]:underline [&_h2]:mt-12 [&_h2]:border-t [&_h2]:pt-8 [&_h2]:text-[1.375rem] [&_h2]:font-semibold [&_h2]:tracking-[-0.025em] [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_p]:text-muted-foreground [&_section:first-child_h2]:mt-0 [&_section:first-child_h2]:border-t-0 [&_section:first-child_h2]:pt-0 [&_strong]:text-foreground [&_ul]:space-y-1.5 [&_ul]:text-muted-foreground">
            {children}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav aria-label="Documente" className="rounded-2xl border bg-card p-2 shadow-xs">
            <div className="eyebrow px-3 pt-2 pb-2">Documente</div>
            {docs.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted">
                <Icon className="size-4 text-muted-foreground" strokeWidth={1.75} /> {label}
              </Link>
            ))}
          </nav>
        </aside>
      </div>
    </div>
  );
}
