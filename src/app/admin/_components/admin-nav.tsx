"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Privire de ansamblu" },
  { href: "/admin/proiecte", label: "Proiecte & moderare" },
  { href: "/admin/utilizatori", label: "Utilizatori" },
  { href: "/admin/rapoarte", label: "Raportări" },
  { href: "/admin/leads", label: "Lead-uri outreach" },
  { href: "/admin/emailuri", label: "Emailuri" },
  { href: "/admin/plati", label: "Plăți & configurare" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Administrare" className="-mx-4 flex gap-1 overflow-x-auto border-b px-4 lg:mx-0 lg:flex-col lg:gap-0.5 lg:border-0 lg:px-0">
      {items.map((i) => {
        const active = i.href === "/admin" ? pathname === "/admin" : pathname.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px shrink-0 border-b-2 border-transparent px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground lg:mb-0 lg:rounded-md lg:border-0 lg:py-2 lg:hover:bg-muted",
              active && "border-foreground font-medium text-foreground lg:bg-card lg:shadow-xs lg:ring-1 lg:ring-border",
            )}
          >
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
