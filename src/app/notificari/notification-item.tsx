"use client";

import {
  Bell,
  Bot,
  CheckCircle2,
  Coins,
  Eye,
  FolderCheck,
  ListChecks,
  MessageSquare,
  Sparkles,
  Star,
  Trophy,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { markReadAction } from "./actions";

const ICONS: Record<string, LucideIcon> = {
  "match.new": Sparkles,
  "application.new": FolderCheck,
  "application.viewed": Eye,
  "application.shortlisted": ListChecks,
  "application.hired": Trophy,
  "application.rejected": XCircle,
  "message.new": MessageSquare,
  "autobid.proposed": Bot,
  "autobid.applied": Bot,
  "plan.welcome": Coins,
  "plan.activated": Coins,
  "plan.granted": Coins,
  "plan.referral": Coins,
  "application.refunded": Coins,
  "review.new": Star,
  "collab.confirmed": CheckCircle2,
  "collab.completed": CheckCircle2,
};

/** Culoarea „familiei” notificării: verde doar pentru ce e confirmat, cobalt pentru potriviri și mesaje. */
function toneOf(type: string) {
  if (type === "application.hired" || type.startsWith("collab.")) return "bg-success/10 text-success border-success/20";
  if (type === "match.new" || type.startsWith("autobid.")) return "bg-brand-soft text-brand border-brand/20";
  if (type === "message.new" || type === "application.new") return "bg-brand-soft text-brand border-brand/20";
  if (type === "review.new") return "bg-warning/10 text-warning border-warning/25";
  if (type.startsWith("plan.") || type === "application.refunded") return "bg-primary text-primary-foreground border-transparent";
  return "bg-muted text-foreground/70";
}

export type NotificationView = { id: string; type: string; title: string; body: string | null; link: string | null; readAt: string | null; createdAt: string };

export function NotificationItem({ n }: { n: NotificationView }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const Icon = ICONS[n.type] ?? (n.type.startsWith("project.") ? FolderCheck : Bell);
  const unread = !n.readAt;
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          if (unread) await markReadAction(n.id);
          if (n.link) router.push(n.link);
          else router.refresh();
        })
      }
      className={cn("relative flex w-full gap-3.5 px-5 py-4 text-left transition-colors hover:bg-muted/50", unread && "bg-brand-soft/50 dark:bg-brand-soft/40")}
    >
      <span className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border", unread ? toneOf(n.type) : "bg-muted/60 text-muted-foreground")}>
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-sm", unread ? "font-semibold" : "font-medium")}>{n.title}</span>
        {n.body && <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">{n.body}</span>}
        <span suppressHydrationWarning className="mt-1 block text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
      </span>
      {unread && <span className="live-dot mt-2 size-2! shrink-0 text-brand" aria-label="Necitită" />}
    </button>
  );
}
