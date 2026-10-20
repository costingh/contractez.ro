import { MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import { ConversationList } from "@/components/chat/conversation-list";
import { requireUser } from "@/server/auth/guards";
import { conversationItems } from "./data";

export const metadata: Metadata = { title: "Mesaje" };

export default async function MessagesPage() {
  const user = await requireUser("/mesaje");
  const items = await conversationItems(user.id);
  return (
    <>
      <div className="flex flex-1 flex-col overflow-y-auto md:hidden">
        <div className="flex h-14 items-center border-b px-4 text-base font-semibold">Mesaje</div>
        <ConversationList items={items} />
      </div>
      <div className="relative hidden flex-1 flex-col items-center justify-center gap-2 overflow-hidden p-8 text-center md:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background-image:radial-gradient(var(--border-strong)_1px,transparent_1px)] [background-size:18px_18px] opacity-50 [mask-image:radial-gradient(ellipse_45%_45%_at_50%_45%,black,transparent)]"
        />
        <div className="enter relative mb-3">
          <div aria-hidden className="absolute -inset-5 rounded-full bg-brand/12 blur-2xl" />
          <div className="relative flex size-14 items-center justify-center rounded-2xl bg-[linear-gradient(140deg,#1c2f57,#2b4acb_70%,#4f7cff)] text-white shadow-[0_12px_30px_-10px_rgb(43_74_203/0.7)]">
            <MessageSquare className="size-6" strokeWidth={1.75} />
          </div>
        </div>
        <div className="relative text-xl font-semibold tracking-[-0.02em]">
          Alege o <span className="serif-em text-gradient">conversație</span>
        </div>
        <p className="relative max-w-sm text-sm leading-relaxed text-muted-foreground">
          Fiecare aplicare deschide automat o conversație între client și prestator. Mesajele sunt gratuite.
        </p>
      </div>
    </>
  );
}
