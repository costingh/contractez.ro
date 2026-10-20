"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleSaveAction } from "@/app/proiecte/[id]/actions";
import { Button } from "@/components/ui/button";

export function SaveButton({ projectId, initialSaved }: { projectId: string; initialSaved: boolean }) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await toggleSaveAction(projectId);
          if (res.ok) {
            setSaved(res.saved);
            toast.success(res.saved ? "Proiect salvat" : "Proiect eliminat din salvate");
          } else toast.error(res.error);
        })
      }
    >
      {saved ? <BookmarkCheck className="text-brand" /> : <Bookmark />}
      {saved ? "Salvat" : "Salvează"}
    </Button>
  );
}
