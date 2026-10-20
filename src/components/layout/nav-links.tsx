"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "./site-header";

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigare principală" className="ml-6 hidden h-full items-center gap-1 lg:flex">
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex h-full items-center px-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
              "after:absolute after:inset-x-2.5 after:-bottom-px after:h-0.5 after:rounded-full after:bg-transparent after:transition-colors",
              active && "font-medium text-foreground after:bg-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
