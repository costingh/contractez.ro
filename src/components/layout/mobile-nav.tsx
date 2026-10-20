"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { NavItem } from "./site-header";

export function MobileNav({ items, signedIn }: { items: NavItem[]; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const extra: NavItem[] = signedIn
    ? [
        { href: "/mesaje", label: "Mesaje" },
        { href: "/abonament", label: "Abonament" },
        { href: "/setari", label: "Setări" },
      ]
    : [
        { href: "/autentificare", label: "Intră în cont" },
        { href: "/inregistrare", label: "Creează cont" },
      ];
  const link = (item: NavItem) => {
    const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setOpen(false)}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-10 items-center rounded-md px-3 text-[0.9375rem] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          active && "bg-muted font-medium text-foreground",
        )}
      >
        {item.label}
      </Link>
    );
  };
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="-ml-2 lg:hidden" aria-label="Meniu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[18rem] gap-0">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>
            <Logo markClassName="size-6.5" />
          </SheetTitle>
        </SheetHeader>
        <nav aria-label="Meniu mobil" className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
          {items.map(link)}
          <div className="mx-3 my-3 border-t" />
          {extra.map(link)}
        </nav>
        <div className="flex items-center justify-between border-t px-5 py-4">
          <span className="text-sm text-muted-foreground">Temă</span>
          <ThemeToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
}
