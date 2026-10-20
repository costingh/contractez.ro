import { desc, eq } from "drizzle-orm";
import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { getPlan } from "@/config/site";
import { formatDateTime } from "@/lib/format";
import { smsConfigured } from "@/server/auth/sms";
import { db } from "@/server/db";
import { stripeEvents, subscriptions, users } from "@/server/db/schema";
import { env, features } from "@/server/env";

function Flag({ on, label, hint }: { on: boolean; label: string; hint: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border bg-card p-4 shadow-xs">
      {on ? <CheckCircle2 className="mt-0.5 size-4 text-success" /> : <XCircle className="mt-0.5 size-4 text-muted-foreground" />}
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
    </div>
  );
}

const SUB_STATUS: Record<string, string> = { active: "Activ", past_due: "Plată restantă", canceled: "Anulat", incomplete: "Neconfirmat" };

export default async function AdminPaymentsPage() {
  const [subRows, events] = await Promise.all([
    db
      .select({ sub: subscriptions, email: users.email })
      .from(subscriptions)
      .innerJoin(users, eq(users.id, subscriptions.userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(100),
    db.select().from(stripeEvents).orderBy(desc(stripeEvents.createdAt)).limit(100),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader title="Plăți & configurare" description="Abonamente, evenimente Stripe și starea integrărilor." className="pt-0" />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Flag on={features.payments} label="Plăți active" hint={features.payments ? "Prestatorii se pot abona la Pro și Business." : features.stripeConfigured ? "Stripe configurat, dar PAYMENTS_ENABLED=false (beta)." : "Lipsește STRIPE_SECRET_KEY."} />
        <Flag on={features.managedPayments} label="Managed Payments (Stripe = vânzător)" hint={features.managedPayments ? `TVA și facturi gestionate de Stripe/Link · cod fiscal ${env.STRIPE_TAX_CODE}` : "Dezactivat: tu emiți facturile și gestionezi TVA-ul."} />
        <Flag on={Boolean(env.STRIPE_WEBHOOK_SECRET)} label="Webhook Stripe" hint="/api/stripe/webhook · STRIPE_WEBHOOK_SECRET" />
        <Flag on={features.ai} label="AI (OpenAI)" hint={features.ai ? `Model: ${env.OPENAI_MODEL}` : "Fără cheie: se folosesc reguli simple."} />
        <Flag on={features.email} label="Email (Resend)" hint={features.email ? `Expeditor: ${env.EMAIL_FROM}` : "Emailurile sunt doar salvate în /admin/emailuri."} />
        <Flag on={smsConfigured} label="SMS (verificare telefon)" hint={smsConfigured ? "SMS_WEBHOOK_URL configurat." : "Fără gateway: codurile apar doar în consolă (dev)."} />
        <Flag on={env.APP_URL.startsWith("https://")} label="HTTPS" hint={env.APP_URL} />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-[-0.01em]">Abonamente</h2>
        {subRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Niciun abonament.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border bg-card shadow-xs">
            <table className="w-full text-sm">
              <thead className="border-b bg-surface text-left text-xs tracking-[0.04em] text-muted-foreground uppercase dark:bg-muted/30">
                <tr>
                  <th className="h-10 px-4 font-medium whitespace-nowrap">Utilizator</th>
                  <th className="h-10 px-4 font-medium whitespace-nowrap">Plan</th>
                  <th className="h-10 px-4 font-medium whitespace-nowrap">Status</th>
                  <th className="h-10 px-4 font-medium whitespace-nowrap">Sursă</th>
                  <th className="h-10 px-4 font-medium whitespace-nowrap">Perioadă</th>
                </tr>
              </thead>
              <tbody>
                {subRows.map(({ sub: s, email }) => (
                  <tr key={s.id} className="border-t transition-colors hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <Link href={`/admin/utilizatori?q=${encodeURIComponent(email)}`} className="underline-offset-4 hover:underline">
                        {email}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{getPlan(s.planId)?.name ?? s.planId}</td>
                    <td className="px-4 py-3">
                      <Badge variant={s.status === "active" ? "brand" : s.status === "past_due" ? "warning" : "outline"}>{SUB_STATUS[s.status] ?? s.status}</Badge>
                      {s.cancelAtPeriodEnd && <span className="ml-1 text-xs text-muted-foreground">se anulează</span>}
                    </td>
                    <td className="px-4 py-3 text-xs">{s.stripeSubscriptionId ? "Stripe" : "Oferit de echipă"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {s.currentPeriodStart ? `${formatDateTime(s.currentPeriodStart)} → ${formatDateTime(s.currentPeriodEnd)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-[-0.01em]">Evenimente Stripe</h2>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Niciun eveniment primit.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border bg-card shadow-xs">
            <table className="w-full text-sm">
              <thead className="border-b bg-surface text-left text-xs tracking-[0.04em] text-muted-foreground uppercase dark:bg-muted/30">
                <tr>
                  <th className="h-10 px-4 font-medium whitespace-nowrap">Primit</th>
                  <th className="h-10 px-4 font-medium whitespace-nowrap">Tip</th>
                  <th className="h-10 px-4 font-medium whitespace-nowrap">ID</th>
                  <th className="h-10 px-4 font-medium whitespace-nowrap">Procesat</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-t transition-colors hover:bg-muted/40">
                    <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground">{formatDateTime(e.createdAt)}</td>
                    <td className="px-4 py-3">{e.type}</td>
                    <td className="px-4 py-3 font-mono text-xs">{e.id}</td>
                    <td className="px-4 py-3 text-xs">
                      {e.processedAt ? <span className="text-success">{formatDateTime(e.processedAt)}</span> : <span className="text-destructive">{e.error ?? "neprocesat"}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
