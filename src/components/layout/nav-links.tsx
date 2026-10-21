"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { NavItem, NavLink } from "./site-header";

export function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
}

const itemClass = cn(
  "relative flex h-full items-center gap-1 px-2.5 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
  "after:absolute after:inset-x-2.5 after:-bottom-px after:h-0.5 after:rounded-full after:bg-transparent after:transition-colors",
);

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigare principală" className="ml-6 hidden h-full items-center gap-1 lg:flex">
      {items.map((item) => {
        if ("children" in item) return <NavGroup key={item.label} label={item.label} links={item.children} pathname={pathname} />;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(itemClass, active && "font-medium text-foreground after:bg-foreground")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function NavGroup({ label, links, pathname }: { label: string; links: NavLink[]; pathname: string }) {
  const active = links.some((l) => isActive(pathname, l.href));
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className={cn(itemClass, "group outline-none", active && "font-medium text-foreground after:bg-foreground")}>
        {label}
        <ChevronDown className="size-3.5 opacity-60 transition-transform group-data-[state=open]:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} className="w-64 p-1.5">
        {links.map((l) => (
          <DropdownMenuItem key={l.href} asChild className={cn("flex-col items-start gap-0.5 px-3 py-2", isActive(pathname, l.href) && "bg-muted")}>
            <Link href={l.href}>
              <span className="text-sm font-medium">{l.label}</span>
              {l.description && <span className="text-xs text-muted-foreground">{l.description}</span>}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
