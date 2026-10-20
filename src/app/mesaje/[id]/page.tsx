import { eq } from "drizzle-orm";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChatView } from "@/components/chat/chat-view";
import { ReportDialog } from "@/components/chat/report-dialog";
import { serializeMessage } from "@/components/chat/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { labels } from "@/config/site";
import { initials } from "@/lib/format";
import { requireUser } from "@/server/auth/guards";
import { listMessages, markConversationRead, roleIn } from "@/server/chat/service";
import { db } from "@/server/db";
import { applications, projects, providerProfiles, users } from "@/server/db/schema";
import { isDomainError } from "@/server/errors";

export const metadata: Metadata = { title: "Conversație" };

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/mesaje/${id}`);
  let data: Awaited<ReturnType<typeof listMessages>>;
  try {
    data = await listMessages(id, user.id);
  } catch (err) {
    if (isDomainError(err)) notFound();
    throw err;
  }
  const c = data.conversation;
  const role = roleIn(c, user.id);
  const otherId = role === "client" ? c.providerId : c.clientId;
  await markConversationRead(id, user.id);

  const [[project], [app], [other], [otherProfile]] = await Promise.all([
    db.select({ id: projects.id, title: projects.title, status: projects.status }).from(projects).where(eq(projects.id, c.projectId)),
    db.select({ status: applications.status, isAuto: applications.isAuto }).from(applications).where(eq(applications.id, c.applicationId)),
    db.select({ name: users.name, avatarPath: users.avatarPath, bannedAt: users.bannedAt }).from(users).where(eq(users.id, otherId)),
    db.select({ slug: providerProfiles.slug }).from(providerProfiles).where(eq(providerProfiles.userId, otherId)),
  ]);

  const closed = app?.status === "withdrawn" || Boolean(other?.bannedAt);
  const projectHref = role === "client" ? `/proiectele-mele/${c.projectId}` : `/proiecte/${c.projectId}`;

  return (
    <>
      <header className="flex min-h-16 items-center gap-3 border-b px-3 py-2.5 sm:px-5">
        <Button asChild variant="ghost" size="icon" className="md:hidden" aria-label="Înapoi la mesaje">
          <Link href="/mesaje">
            <ArrowLeft />
          </Link>
        </Button>
        <Avatar className="size-9">
          {other?.avatarPath && <AvatarImage src={`/api/files/${other.avatarPath}`} alt="" />}
          <AvatarFallback className="text-xs">{initials(other?.name ?? "?")}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {role === "client" && otherProfile ? (
              <Link href={`/prestatori/${otherProfile.slug}`} className="truncate font-semibold underline-offset-4 hover:underline">
                {other?.name}
              </Link>
            ) : (
              <span className="truncate font-semibold">{other?.name}</span>
            )}
            <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">{role === "client" ? "prestator" : "client"}</span>
          </div>
          <Link href={projectHref} className="flex items-center gap-1 truncate text-xs text-muted-foreground hover:text-foreground">
            {project?.title} <ExternalLink className="size-3 shrink-0" />
          </Link>
        </div>
        {app && (
          <Badge variant="secondary" className="hidden sm:inline-flex">
            {app.isAuto ? "Auto Bid · " : ""}
            {labels.applicationStatus[app.status]}
          </Badge>
        )}
        {role === "client" && (
          <Button asChild size="sm" variant="outline" className="hidden lg:inline-flex">
            <Link href={projectHref}>Gestionează ofertele</Link>
          </Button>
        )}
        <ReportDialog conversationId={id} />
      </header>
      <ChatView
        key={id}
        conversationId={id}
        meId={user.id}
        initial={data.messages.map(serializeMessage)}
        disabled={closed}
        disabledReason={app?.status === "withdrawn" ? "Aplicarea a fost retrasă; conversația este închisă." : "Contul celuilalt utilizator este suspendat."}
      />
    </>
  );
}
