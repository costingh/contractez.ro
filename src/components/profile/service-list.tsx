"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteServiceAction } from "@/app/profil/actions";
import { ServiceForm, type ServiceCategory } from "@/components/onboarding/first-service-form";
import { Button } from "@/components/ui/button";
import { labels } from "@/config/site";

export type ServiceRow = {
  id: string;
  categoryId: number;
  title: string;
  description: string;
  priceFrom: number | null;
  priceUnit: keyof typeof labels.priceUnit;
  categoryName: string;
};

/** Lista serviciilor, cu editare inline (același formular ca la adăugare) și ștergere. */
export function ServiceList({ services, categories }: { services: ServiceRow[]; categories: ServiceCategory[] }) {
  const [pending, start] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  if (services.length === 0) return <p className="text-sm text-muted-foreground">Niciun serviciu listat încă.</p>;
  return (
    <ul className="divide-y rounded-lg border">
      {services.map((s) => {
        if (s.id === editingId) {
          // Categoria serviciului rămâne selectabilă chiar dacă a fost scoasă între timp din profil.
          const options = categories.some((c) => c.id === s.categoryId) ? categories : [{ id: s.categoryId, name: s.categoryName }, ...categories];
          return (
            <li key={s.id} className="bg-surface p-3 sm:p-4 dark:bg-muted/30">
              <div className="mb-3 text-sm font-medium">Editează serviciul</div>
              <ServiceForm categories={options} service={s} onDone={() => setEditingId(null)} onCancel={() => setEditingId(null)} />
            </li>
          );
        }
        return (
          <li key={s.id} className="flex items-start justify-between gap-3 p-3">
            <div className="min-w-0">
              <div className="font-medium break-words">{s.title}</div>
              <div className="text-xs text-muted-foreground">
                {s.categoryName}
                {s.priceFrom != null && ` · de la ${s.priceFrom.toLocaleString("ro-RO")} lei / ${labels.priceUnit[s.priceUnit]}`}
              </div>
              {s.description && <p className="mt-1 text-sm break-words text-muted-foreground">{s.description}</p>}
            </div>
            <div className="flex shrink-0 gap-1">
              <Button variant="ghost" size="icon-sm" disabled={pending} aria-label="Editează serviciul" title="Editează serviciul" onClick={() => setEditingId(s.id)}>
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={pending}
                aria-label="Șterge serviciul"
                title="Șterge serviciul"
                onClick={() =>
                  start(async () => {
                    const r = await deleteServiceAction(s.id);
                    if (r && !r.ok) toast.error(r.error);
                    else toast.success("Serviciul a fost șters.");
                  })
                }
              >
                <Trash2 />
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
