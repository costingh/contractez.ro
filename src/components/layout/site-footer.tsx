import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { site } from "@/config/site";

const columns: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Pentru clienți",
    links: [
      { href: "/proiecte/nou", label: "Publică un proiect gratuit" },
      { href: "/prestatori", label: "Caută prestatori" },
      { href: "/cum-functioneaza", label: "Cum funcționează" },
    ],
  },
  {
    title: "Pentru prestatori",
    links: [
      { href: "/proiecte", label: "Proiecte deschise" },
      { href: "/preturi", label: "Abonamente & Auto Bid" },
      { href: "/inregistrare?rol=prestator", label: "Creează profil" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/termeni", label: "Termeni și condiții" },
      { href: "/confidentialitate", label: "Confidențialitate (GDPR)" },
      { href: "/contact", label: "Contact & raportări" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t bg-surface print:hidden dark:bg-background">
      <div className="container-page grid gap-10 py-12 text-sm sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo className="text-[1.0625rem]" markClassName="size-6.5" />
          <p className="max-w-xs leading-relaxed text-muted-foreground">{site.tagline}</p>
        </div>
        {columns.map((col) => (
          <div key={col.title} className="space-y-3">
            <div className="eyebrow">{col.title}</div>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-foreground/80 transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t">
        <div className="container-page flex flex-col gap-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl leading-relaxed">
            © {new Date().getFullYear()} {site.name}. Platforma nu intermediază plata lucrărilor; clientul și prestatorul stabilesc direct condițiile.
          </p>
          <ThemeToggle className="self-start sm:self-auto" />
        </div>
      </div>
    </footer>
  );
}
