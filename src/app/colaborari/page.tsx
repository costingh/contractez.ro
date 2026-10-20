import { Handshake, MessageSquare, Star, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { requireOnboardedUser } from "@/server/auth/guards";
import { listCollaborations } from "@/server/trust/service";
import { CollaborationActions } from "./collaboration-actions";
import { ReviewForm } from "./review-form";

export const metadata: Metadata = { title: "Colaborări" };

const STATUS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" | "success" | "warning" | "brand" }> = {
  pending_confirmation: { label: "Așteaptă confirmarea prestatorului", variant: "warning" },
  active: { label: "Activă", variant: "brand" },
  completed: { label: "Finalizată", variant: "success" },
  cancelled: { label: "Anulată", variant: "outline" },
};

export default async function CollaborationsPage() {
  const user = await requireOnboardedUser("/colaborari");
  const rows = await listCollaborations(user.id);

  return (
    <div className="container-page max-w-4xl pb-16">
      <PageHeader
        title="Colaborări"
        description="Colaborările confirmate de ambele părți permit recenzii verificate — ele construiesc reputația pe platformă."
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="Nicio colaborare încă"
          description="Când un client alege o ofertă, colaborarea apare aici. Prestatorul o confirmă, iar la final vă puteți lăsa recenzii."
        />
      ) : (
        <div className="space-y-4">
          {rows.map((r) => {
            const asClient = r.collab.clientId === user.id;
            const other = asClient ? r.providerName : r.clientName;
            const st = STATUS[r.collab.status];
            const canReview = (r.collab.status === "active" || r.collab.status === "completed") && r.myReview === null;
            return (
              <article
                key={r.collab.id}
                className={cn(
                  "reveal relative space-y-4 overflow-hidden rounded-2xl border bg-card p-5 shadow-xs sm:p-6",
                  r.collab.status === "completed" && "border-success/30",
                  r.collab.status === "pending_confirmation" && !asClient && "border-brand/35",
                )}
              >
                {r.collab.status === "completed" && (
                  <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-success/0 via-success to-success/0" />
                )}
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant={st.variant}>{st.label}</Badge>
                  <span>{asClient ? "Tu ești clientul" : "Tu ești prestatorul"}</span>
                  <span>· începută pe {formatDate(r.collab.createdAt)}</span>
                  {r.collab.completedAt && <span>· finalizată pe {formatDate(r.collab.completedAt)}</span>}
                </div>
                <div>
                  <h2 className="text-lg leading-snug font-semibold tracking-[-0.015em]">{r.projectTitle}</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {asClient ? "Prestator" : "Client"}: {other}
                  </p>
                </div>
                {r.collab.status === "pending_confirmation" && !asClient && (
                  <div className="flex items-center gap-3.5 rounded-xl border border-brand/20 bg-brand-soft px-4 py-3.5 text-sm leading-relaxed">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(140deg,#1c2f57,#2b4acb_70%,#4f7cff)] text-white shadow-sm">
                      <Trophy className="size-4" />
                    </span>
                    <p>
                      <span className="font-semibold">Clientul te-a ales!</span> Confirmă colaborarea ca să puteți lăsa recenzii verificate la final.
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                  {r.conversationId && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/mesaje/${r.conversationId}`}>
                        <MessageSquare /> Chat
                      </Link>
                    </Button>
                  )}
                  <CollaborationActions id={r.collab.id} status={r.collab.status} isProvider={!asClient} />
                  {r.myReview !== null && (
                    <span className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
                      Ai acordat {r.myReview} <Star className="size-3.5 fill-warning text-warning" />
                    </span>
                  )}
                </div>
                {canReview && <ReviewForm collaborationId={r.collab.id} targetName={other} asClient={asClient} />}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
