"use client";

import { CheckCheck } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { markAllReadAction } from "./actions";

export function MarkAllButton({ disabled }: { disabled: boolean }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      disabled={disabled || pending}
      onClick={() =>
        start(async () => {
          const res = await markAllReadAction();
          if (res?.ok) toast.success(res.message);
          else if (res) toast.error(res.error);
        })
      }
    >
      <CheckCheck /> Marchează toate ca citite
    </Button>
  );
}
