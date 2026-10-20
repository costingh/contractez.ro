import { Bell, MessageSquare, Plus, Send } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { site } from "@/config/site";
import { getCurrentUser } from "@/server/auth/session";
import { getPlanUsage } from "@/server/billing/plans";
import { unreadConversationCount } from "@/server/chat/service";
import { unreadNotificationCount } from "@/server/notifications";
import { LiveApplicationsLeft, LiveCountBadge } from "./live-counts";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";

export type NavItem = { href: string; label: string };

export function navFor(user: { isClient: boolean; isProvider: boolean; role: string } | null): NavItem[] {
  if (!user) {
    return [
      { href: "/proiecte", label: "Proiecte" },
      { href: "/prestatori", label: "Prestatori" },
      { href: "/cum-functioneaza", label: "Cum funcționează" },
      { href: "/preturi", label: "Prețuri" },
    ];
  }
  const items: NavItem[] = [{ href: "/panou", label: "Panou" }];
  if (user.isProvider) {
    items.push({ href: "/recomandari", label: "Recomandări" }, { href: "/proiecte", label: "Proiecte" }, { href: "/aplicarile-mele", label: "Aplicările mele" });
  }
  if (user.isClient) items.push({ href: "/proiectele-mele", label: "Proiectele mele" }, { href: "/prestatori", label: "Prestatori" });
  if (!user.isProvider && !user.isClient) items.push({ href: "/proiecte", label: "Proiecte" });
  if (user.role === "admin") items.push({ href: "/admin", label: "Admin" });
  return items;
}

/** Momentul randării pe server; contoarele live mai noi decât acesta îl înlocuiesc. */
function renderedAt() {
  return Date.now();
}

export async function SiteHeader() {
  const user = await getCurrentUser();
  const [notifs, msgs, usage] = user
    ? await Promise.all([unreadNotificationCount(user.id), unreadConversationCount(user.id), user.isProvider ? getPlanUsage(user.id) : null])
    : [0, 0, null];
  const items = navFor(user);
  const counts = { notifications: notifs, messages: msgs, applicationsLeft: usage?.remaining ?? null };
  const at = renderedAt();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 print:hidden">
      <div className="container-page flex h-15 items-center gap-2 sm:gap-3">
        <MobileNav items={items} signedIn={Boolean(user)} />
        <Link href={user ? "/panou" : "/"} className="flex shrink-0 items-center" aria-label={`${site.name} — acasă`}>
          <Logo className="text-[1.1875rem]" markClassName="size-7.5" />
        </Link>
        <NavLinks items={items} />
        <div className="ml-auto flex items-center gap-1">
          {user ? (
            <>
              {user.isClient && (
                <Button asChild size="sm" className="mr-1 hidden sm:inline-flex">
                  <Link href="/proiecte/nou">
                    <Plus /> Publică proiect
                  </Link>
                </Button>
              )}
              {usage && (
                <Link
                  href="/abonament"
                  title={`Aplicări rămase în planul ${usage.plan.name}`}
                  className="mr-1 hidden h-8 items-center gap-1.5 rounded-md border bg-card px-2.5 text-xs font-medium tabular-nums shadow-xs transition-colors hover:bg-muted md:inline-flex"
                >
                  <Send className="size-3.5 text-muted-foreground" /> <LiveApplicationsLeft initial={counts} at={at} />
                  <span className="text-muted-foreground">· {usage.plan.name}</span>
                </Link>
              )}
              <Button asChild variant="ghost" size="icon" className="relative" aria-label="Mesaje">
                <Link href="/mesaje">
                  <MessageSquare />
                  <LiveCountBadge kind="messages" initial={counts} at={at} />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="icon" className="relative" aria-label="Notificări">
                <Link href="/notificari">
                  <Bell />
                  <LiveCountBadge kind="notifications" initial={counts} at={at} />
                </Link>
              </Button>
              <UserMenu
                user={{ name: user.name, email: user.email, isProvider: user.isProvider, isClient: user.isClient, role: user.role, avatarPath: user.avatarPath }}
              />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/autentificare">Intră în cont</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/inregistrare">Creează cont</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
