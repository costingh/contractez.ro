"use client";

import { Send, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { confirmProposalAction, declineProposalAction } from "@/app/auto-bid/actions";
import { ScoreBadge } from "@/components/shared/score-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ProposalCard({
  executionId,
  projectId,
  projectTitle,
  meta,
  score,
  draft,
}: {
  executionId: string;
  projectId: string;
  projectTitle: string;
  meta: string;
  score: number | null;
  draft: string;
}) {
  const [message, setMessage] = useState(draft);
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <Link href={`/proiecte/${projectId}`} className="font-semibold tracking-[-0.01em] underline-offset-4 hover:underline" target="_blank">
            {projectTitle}
          </Link>
          <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{meta}</div>
        </div>
        {score !== null && <ScoreBadge score={score} />}
      </div>
      <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} aria-label="Mesajul aplicării" />
      <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
        <Button
          variant="ghost"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await declineProposalAction(executionId);
              if (res && !res.ok) toast.error(res.error);
            })
          }
        >
          <X /> Refuză
        </Button>
        <Button
          disabled={pending || message.trim().length < 30}
          onClick={() =>
            start(async () => {
              const res = await confirmProposalAction(executionId, message);
              if (res?.ok) toast.success(res.message);
              else if (res)
                toast.error(res.error, res.error.includes("aplicări") ? { action: { label: "Abonament", onClick: () => router.push("/abonament") } } : undefined);
            })
          }
        >
          <Send /> Trimite aplicarea
        </Button>
      </div>
    </div>
  );
}
