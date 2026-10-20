"use client";

import { Power, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteRuleAction, stopAllRulesAction, toggleRuleAction } from "@/app/auto-bid/actions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { ActionState } from "@/lib/action";

function report(res: ActionState) {
  if (res?.ok) toast.success(res.message);
  else if (res) toast.error(res.error);
}

export function RuleToggle({ ruleId, enabled }: { ruleId: string; enabled: boolean }) {
  const [pending, start] = useTransition();
  return (
    <Switch
      checked={enabled}
      disabled={pending}
      aria-label={enabled ? "Oprește regula" : "Pornește regula"}
      onCheckedChange={(c) => start(async () => report(await toggleRuleAction(ruleId, c)))}
    />
  );
}

export function RuleDelete({ ruleId }: { ruleId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (confirm("Ștergi această regulă? Istoricul aplicărilor rămâne.")) start(async () => report(await deleteRuleAction(ruleId)));
      }}
    >
      <Trash2 /> Șterge
    </Button>
  );
}

export function StopAllButton() {
  const [pending, start] = useTransition();
  return (
    <Button variant="outline" disabled={pending} onClick={() => start(async () => report(await stopAllRulesAction()))}>
      <Power /> Oprește tot
    </Button>
  );
}
