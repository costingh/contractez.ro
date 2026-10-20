"use client";

import { Flag } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { reportConversationAction } from "@/app/mesaje/actions";
import { NativeSelect } from "@/components/shared/native-select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const REASONS = [
  { v: "spam", l: "Spam sau mesaje nesolicitate" },
  { v: "fraud", l: "Tentativă de fraudă / cere bani în avans" },
  { v: "abusive", l: "Limbaj abuziv sau hărțuire" },
  { v: "inappropriate", l: "Conținut nepotrivit" },
  { v: "other", l: "Altceva" },
];

export function ReportDialog({ conversationId }: { conversationId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [pending, start] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Flag /> <span className="hidden sm:inline">Raportează</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Raportează conversația</DialogTitle>
          <DialogDescription>Raportarea este confidențială. Echipa de moderare verifică mesajele și poate suspenda contul.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="report-reason">Motiv</Label>
            <NativeSelect id="report-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="">Alege motivul</option>
              {REASONS.map((r) => (
                <option key={r.v} value={r.v}>
                  {r.l}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="report-details">Detalii (opțional)</Label>
            <Textarea id="report-details" value={details} onChange={(e) => setDetails(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={pending || !reason}
            onClick={() =>
              start(async () => {
                const res = await reportConversationAction(conversationId, reason, details);
                if (res?.ok) {
                  toast.success(res.message);
                  setOpen(false);
                } else if (res) toast.error(res.error);
              })
            }
          >
            Trimite raportarea
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
