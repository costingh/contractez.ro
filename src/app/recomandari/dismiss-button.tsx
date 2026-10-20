"use client";

import { EyeOff } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { dismissRecommendationAction, restoreDismissedAction } from "./actions";

export function DismissButton({ projectId, score }: { projectId: string; score: number }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await dismissRecommendationAction(projectId, score);
          if (res && !res.ok) toast.error(res.error);
        })
      }
    >
      <EyeOff /> Nu mă interesează
    </Button>
  );
}

export function RestoreButton() {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="link"
      size="sm"
      className="h-auto p-0"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await restoreDismissedAction();
          if (res?.ok) toast.success(res.message);
          else if (res) toast.error(res.error);
        })
      }
    >
      Readu recomandările ascunse
    </Button>
  );
}
