import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type AnafInfo = { name: string; cui: string; vatPayer: boolean; eInvoice: boolean; caen: string | null; checkedAt: string } | null;

/** Badge „Firmă verificată ANAF”, cu explicație despre ce confirmă (și ce nu). */
export function AnafBadge({ info, compact, className }: { info: AnafInfo; compact?: boolean; className?: string }) {
  if (!info) return null;
  const checked = new Date(info.checkedAt).toLocaleDateString("ro-RO");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="success" className={cn("cursor-help gap-1", className)}>
          <ShieldCheck />
          {compact ? "Verificat ANAF" : "Firmă verificată ANAF"}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-left">
        <div className="font-medium">{info.name}</div>
        <div>
          CUI {info.cui}
          {info.caen ? ` · CAEN ${info.caen}` : ""}
        </div>
        <div>
          {info.vatPayer ? "Plătitor de TVA" : "Neplătitor de TVA"}
          {info.eInvoice ? " · înregistrat e-Factura" : ""}
        </div>
        <div className="mt-1 opacity-80">Firmă activă în registrul public ANAF (verificat la {checked}). Nu garantează calitatea serviciilor.</div>
      </TooltipContent>
    </Tooltip>
  );
}
