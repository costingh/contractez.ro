"use client";

import { Undo2 } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { withdrawApplicationAction } from "./actions";

export function WithdrawButton({ applicationId }: { applicationId: string }) {
  const [pending, start] = useTransition();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Undo2 /> Retrage
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Retragi aplicarea?</DialogTitle>
          <DialogDescription>Clientul nu va mai vedea oferta ta, iar conversația se închide. Aplicarea rămâne socotită în limita lunară.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Renunță</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await withdrawApplicationAction(applicationId);
                if (res?.ok) toast.success(res.message);
                else if (res) toast.error(res.error);
              })
            }
          >
            Retrage aplicarea
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ChatLink({ conversationId }: { conversationId: string | null }) {
  if (!conversationId) return null;
  return (
    <Button asChild variant="outline" size="sm">
      <Link href={`/mesaje/${conversationId}`}>Deschide chat-ul</Link>
    </Button>
  );
}
