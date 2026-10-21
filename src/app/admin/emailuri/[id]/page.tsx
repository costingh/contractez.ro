import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { db } from "@/server/db";
import { emailLog } from "@/server/db/schema";

export default async function AdminEmailPreview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [email] = await db.select().from(emailLog).where(eq(emailLog.id, id));
  if (!email) notFound();
  const links = [...email.html.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replaceAll("&amp;", "&")).filter((h) => h.startsWith("http"));

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/emailuri">
          <ArrowLeft /> Înapoi
        </Link>
      </Button>
      <PageHeader title={email.subject} description={`Către ${email.to} · ${formatDateTime(email.createdAt)} · ${email.template} · ${email.status}`} className="pt-0" />
      {links.length > 0 && (
        <div className="rounded-2xl border bg-card p-5 text-sm shadow-xs">
          <div className="mb-1 font-medium">Linkuri din email</div>
          <ul className="space-y-1">
            {links.map((l) => (
              <li key={l} className="truncate">
                <a href={l} className="text-brand underline-offset-4 hover:underline">
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <iframe title="Previzualizare email" srcDoc={email.html} sandbox="" className="h-[720px] w-full rounded-xl border bg-white" />
      {email.text && (
        <details className="rounded-2xl border bg-card text-sm shadow-xs">
          <summary className="cursor-pointer px-5 py-3 font-medium">Varianta text</summary>
          <pre className="overflow-x-auto border-t px-5 py-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">{email.text}</pre>
        </details>
      )}
    </div>
  );
}
