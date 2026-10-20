"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteServiceAction } from "@/app/profil/actions";
import { Button } from "@/components/ui/button";
import { labels } from "@/config/site";

export type ServiceRow = { id: string; title: string; description: string; priceFrom: number | null; priceUnit: keyof typeof labels.priceUnit; categoryName: string };

export function ServiceList({ services }: { services: ServiceRow[] }) {
  const [pending, start] = useTransition();
  if (services.length === 0) return <p className="text-sm text-muted-foreground">Niciun serviciu listat încă.</p>;
  return (
    <ul className="divide-y rounded-lg border">
      {services.map((s) => (
        <li key={s.id} className="flex items-start justify-between gap-3 p-3">
          <div className="min-w-0">
            <div className="font-medium">{s.title}</div>
            <div className="text-xs text-muted-foreground">
              {s.categoryName}
              {s.priceFrom != null && ` · de la ${s.priceFrom.toLocaleString("ro-RO")} lei / ${labels.priceUnit[s.priceUnit]}`}
            </div>
            {s.description && <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={pending}
            aria-label="Șterge serviciul"
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
        </li>
      ))}
    </ul>
  );
}
