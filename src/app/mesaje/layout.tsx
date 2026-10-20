import { ConversationList } from "@/components/chat/conversation-list";
import { requireUser } from "@/server/auth/guards";
import { conversationItems } from "./data";

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/mesaje");
  const items = await conversationItems(user.id);
  return (
    <div className="container-page py-4 sm:py-8">
      <div className="flex h-[calc(100dvh-8rem)] min-h-[480px] overflow-hidden rounded-2xl border bg-card shadow-sm sm:h-[calc(100dvh-9.5rem)]">
        <aside className="hidden w-80 shrink-0 flex-col border-r bg-surface md:flex dark:bg-background/40">
          <div className="flex h-16 items-center border-b px-5 text-base font-semibold tracking-[-0.01em]">Mesaje</div>
          <div className="flex-1 overflow-y-auto">
            <ConversationList items={items} />
          </div>
        </aside>
        <section className="flex min-w-0 flex-1 flex-col">{children}</section>
      </div>
    </div>
  );
}
