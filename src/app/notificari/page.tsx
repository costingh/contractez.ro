import { Bell } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { cssVars } from "@/components/home/css-vars";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/server/auth/guards";
import { listNotifications } from "@/server/notifications";
import { MarkAllButton } from "./mark-all-button";
import { NotificationItem } from "./notification-item";

export const metadata: Metadata = { title: "Notificări" };

const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest" });

/** Grupează notificările pe zile (ora României): Azi, Ieri, Săptămâna aceasta, Mai devreme. */
function groupByDay<T extends { createdAt: Date }>(rows: T[]) {
  const now = new Date();
  const today = dayKey.format(now);
  const yesterday = dayKey.format(new Date(now.getTime() - 86_400_000));
  const weekAgo = now.getTime() - 7 * 86_400_000;
  const groups: { label: string; items: T[] }[] = [];
  for (const r of rows) {
    const d = dayKey.format(r.createdAt);
    const label = d === today ? "Azi" : d === yesterday ? "Ieri" : r.createdAt.getTime() > weekAgo ? "Săptămâna aceasta" : "Mai devreme";
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(r);
    else groups.push({ label, items: [r] });
  }
  return groups;
}

export default async function NotificationsPage() {
  const user = await requireUser("/notificari");
  const rows = await listNotifications(user.id, 100);
  const unread = rows.filter((n) => !n.readAt).length;
  return (
    <div className="container-page max-w-3xl pb-16">
      <PageHeader
        title="Notificări"
        description={unread > 0 ? `Ai ${unread} ${unread === 1 ? "notificare necitită" : "notificări necitite"}.` : "Ești la zi."}
        actions={<MarkAllButton disabled={unread === 0} />}
      />
      {rows.length === 0 ? (
        <EmptyState icon={Bell} title="Nicio notificare încă" description="Aici apar ofertele noi, mesajele, proiectele compatibile și actualizările despre abonament." />
      ) : (
        <div className="space-y-8">
          {groupByDay(rows).map((g, gi) => (
            <section key={g.label} className="enter" style={cssVars({ i: gi + 1 })} aria-label={g.label}>
              <h2 className="eyebrow mb-3 px-1">{g.label}</h2>
              <div className="divide-y overflow-hidden rounded-2xl border bg-card shadow-xs">
                {g.items.map((n) => (
                  <NotificationItem
                    key={n.id}
                    n={{ id: n.id, type: n.type, title: n.title, body: n.body, link: n.link, readAt: n.readAt?.toISOString() ?? null, createdAt: n.createdAt.toISOString() }}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Alegi ce primești pe email din{" "}
        <Link href="/setari" className="font-medium text-brand underline-offset-4 hover:underline">
          setări
        </Link>
        .
      </p>
    </div>
  );
}
