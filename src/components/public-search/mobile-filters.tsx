"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

/** Filtrele în panou lateral pe mobil (pe desktop sunt afișate în sidebar). */
export function MobileFilters({ children, activeCount }: { children: React.ReactNode; activeCount: number }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="lg:hidden">
          <SlidersHorizontal /> Filtre{activeCount > 0 ? ` (${activeCount})` : ""}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto">
        <SheetHeader className="border-b">
          <SheetTitle>Filtre</SheetTitle>
        </SheetHeader>
        <div className="px-4 pt-2 pb-6">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
