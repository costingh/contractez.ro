"use client";

import { CheckCircle2, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { hireAction } from "@/app/proiectele-mele/[id]/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Textul comun al confirmării: alegerea prestatorului îngheață aplicările. */
export const HIRE_EXPLAINER =
  "Proiectul trece „în desfășurare” și aplicările se îngheață: nu mai primește oferte noi, iar ceilalți prestatori sunt anunțați politicos. Dacă anulezi colaborarea și proiectul nu e gata, poți redeschide aplicările. La final vă lăsați feedback unul altuia.";

/** „Continuă cu acest prestator”, din conversație: clientul spune pe cine a ales, fără să treacă prin lista de oferte. */
export function HireButton({ applicationId, providerName, className }: { applicationId: string; providerName: string; className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const hire = () =>
    start(async () => {
      const res = await hireAction(applicationId);
      if (res?.ok) {
        toast.success(res.message ?? "Gata");
        setOpen(false);
        router.refresh();
      } else if (res) toast.error(res.error);
    });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className={cn("shrink-0", className)}>
          <Trophy /> Continuă cu acest prestator
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Continui cu {providerName}?</DialogTitle>
          <DialogDescription>{HIRE_EXPLAINER}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Mai compar</Button>
          </DialogClose>
          <Button disabled={pending} onClick={hire}>
            <CheckCircle2 /> Da, continui
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
