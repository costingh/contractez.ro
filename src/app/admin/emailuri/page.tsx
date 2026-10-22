import { desc, ilike, or } from "drizzle-orm";
import { stripControlChars } from "@/lib/text";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/format";
import { db } from "@/server/db";
import { emailLog } from "@/server/db/schema";
import { features } from "@/server/env";

const STATUS: Record<string, { label: string; variant: "secondary" | "destructive" | "outline" | "default" | "brand" }> = {
  queued: { label: "În coadă", variant: "outline" },
  sent: { label: "Trimis", variant: "brand" },
  logged: { label: "Doar salvat", variant: "secondary" },
  failed: { label: "Eșuat", variant: "destructive" },
};

export default async function AdminEmailsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const raw = (await searchParams).q;
  const q = raw ? stripControlChars(raw).trim().slice(0, 200) || undefined : undefined;
  const rows = await db
    .select({
      id: emailLog.id,
      to: emailLog.to,
      subject: emailLog.subject,
      template: emailLog.template,
      status: emailLog.status,
      error: emailLog.error,
      createdAt: emailLog.createdAt,
    })
    .from(emailLog)
    .where(q ? or(ilike(emailLog.to, `%${q}%`), ilike(emailLog.subject, `%${q}%`), ilike(emailLog.template, `%${q}%`)) : undefined)
    .orderBy(desc(emailLog.createdAt))
    .limit(200);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emailuri"
        description={
          features.email
            ? "Emailurile sunt trimise prin Resend. Aici vezi istoricul și conținutul lor."
            : "Resend nu este configurat: emailurile sunt doar salvate aici (inclusiv linkurile de confirmare și resetare)."
        }
        className="pt-0"
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/emailuri/previzualizare">Previzualizare șabloane</Link>
          </Button>
        }
      />
      <form className="flex gap-2">
        <Input name="q" defaultValue={q} placeholder="Destinatar, subiect sau șablon" className="max-w-sm" />
        <Button type="submit" variant="outline">Caută</Button>
      </form>
      {rows.length === 0 ? (
        <EmptyState title="Niciun email" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card shadow-xs">
          <table className="w-full text-sm">
            <thead className="border-b bg-surface text-left text-xs tracking-[0.04em] text-muted-foreground uppercase dark:bg-muted/30">
              <tr>
                <th className="h-10 px-4 font-medium whitespace-nowrap">Data</th>
                <th className="h-10 px-4 font-medium whitespace-nowrap">Destinatar</th>
                <th className="h-10 px-4 font-medium whitespace-nowrap">Subiect</th>
                <th className="h-10 px-4 font-medium whitespace-nowrap">Șablon</th>
                <th className="h-10 px-4 font-medium whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t transition-colors hover:bg-muted/40">
                  <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground">{formatDateTime(r.createdAt)}</td>
                  <td className="min-w-40 px-4 py-3 [overflow-wrap:anywhere]">{r.to}</td>
                  <td className="min-w-48 px-4 py-3 [overflow-wrap:anywhere]">
                    <Link href={`/admin/emailuri/${r.id}`} className="underline-offset-4 hover:underline">
                      {r.subject}
                    </Link>
                    {r.error && <div className="text-xs text-destructive">{r.error}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.template}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS[r.status]?.variant ?? "outline"}>{STATUS[r.status]?.label ?? r.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
