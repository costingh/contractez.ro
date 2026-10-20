import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { BadgeCheck, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { SubmitButton } from "@/components/forms/submit-button";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPlan, labels, paidPlans } from "@/config/site";
import { formatDate, formatDateTime } from "@/lib/format";
import { NativeSelect } from "@/components/shared/native-select";
import { getPlanUsage } from "@/server/billing/plans";
import { db } from "@/server/db";
import { providerProfiles, subscriptions, users } from "@/server/db/schema";
import { ActionForm } from "../_components/action-form";
import { banUserAction, grantPlanAction, revokePlanAction, toggleAdminAction, unbanUserAction } from "./actions";

const SUB_STATUS: Record<string, string> = { active: "Activ", past_due: "Plată restantă", canceled: "Anulat", incomplete: "Neconfirmat" };

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string; id?: string }> }) {
  const { q, id } = await searchParams;
  const rows = await db
    .select({
      user: users,
      planId: sql<string | null>`(
        SELECT s.plan_id FROM subscriptions s
        WHERE s.user_id = ${users.id} AND s.status IN ('active', 'past_due')
          AND (s.current_period_end IS NULL OR s.current_period_end > now())
        ORDER BY s.created_at DESC LIMIT 1)`,
      slug: providerProfiles.slug,
    })
    .from(users)
    .leftJoin(providerProfiles, eq(providerProfiles.userId, users.id))
    .where(q ? or(ilike(users.email, `%${q}%`), ilike(users.name, `%${q}%`), sql`${users.id}::text = ${q}`) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(q ? 50 : 30);

  const selected = id ? rows.find((r) => r.user.id === id) ?? null : rows.length === 1 ? rows[0] : null;
  const [usage, subs] = selected
    ? await Promise.all([
        selected.user.isProvider ? getPlanUsage(selected.user.id) : null,
        db.select().from(subscriptions).where(eq(subscriptions.userId, selected.user.id)).orderBy(desc(subscriptions.createdAt)).limit(20),
      ])
    : [null, []];

  return (
    <div className="space-y-6">
      <PageHeader title="Utilizatori" description="Caută conturi, verifică abonamentul, oferă un plan sau suspendă conturi abuzive." className="pt-0" />
      <form className="flex gap-2">
        <Input name="q" defaultValue={q} placeholder="Email, nume sau ID" className="max-w-sm" />
        <Button type="submit" variant="outline">Caută</Button>
      </form>

      {rows.length === 0 ? (
        <EmptyState title="Niciun utilizator găsit" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card shadow-xs">
          <table className="w-full text-sm">
            <thead className="border-b bg-surface text-left text-xs tracking-[0.04em] text-muted-foreground uppercase dark:bg-muted/30">
              <tr>
                <th className="h-10 px-4 font-medium whitespace-nowrap">Utilizator</th>
                <th className="h-10 px-4 font-medium whitespace-nowrap">Roluri</th>
                <th className="h-10 px-4 font-medium whitespace-nowrap">Verificări</th>
                <th className="h-10 px-4 font-medium whitespace-nowrap">Plan</th>
                <th className="h-10 px-4 font-medium whitespace-nowrap">Creat</th>
                <th className="px-4" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.user.id} className="border-t transition-colors hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.user.name}</div>
                    <div className="text-xs text-muted-foreground">{r.user.email}</div>
                    {r.user.bannedAt && <Badge variant="destructive" className="mt-1">Suspendat</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.user.role === "admin" && <Badge>Admin</Badge>}
                      {r.user.isClient && <Badge variant="secondary">Client</Badge>}
                      {r.user.isProvider && <Badge variant="secondary">Prestator</Badge>}
                      {!r.user.onboardedAt && <Badge variant="outline">Fără onboarding</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 text-muted-foreground">
                      <Mail className={r.user.emailVerifiedAt ? "size-4 text-success" : "size-4 opacity-40"} aria-label="Email" />
                      <Phone className={r.user.phoneVerifiedAt ? "size-4 text-success" : "size-4 opacity-40"} aria-label="Telefon" />
                      {r.user.legalEntity !== "none" && <span className="text-xs">{labels.legalEntity[r.user.legalEntity]}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {r.user.isProvider ? (
                      <Badge variant={r.planId ? "brand" : "secondary"}>{getPlan(r.planId)?.name ?? "Gratuit"}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground tabular-nums">{formatDate(r.user.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/admin/utilizatori?${new URLSearchParams({ ...(q ? { q } : {}), id: r.user.id })}`}>Detalii</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <section className="space-y-6 rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-[-0.015em]">{selected.user.name}</h2>
            {selected.user.phoneVerifiedAt && <BadgeCheck className="size-4 text-success" />}
            <span className="text-sm text-muted-foreground">{selected.user.email}</span>
            {selected.slug && (
              <Link href={`/prestatori/${selected.slug}`} className="text-sm font-medium text-brand underline-offset-4 hover:underline">
                Profil public
              </Link>
            )}
          </div>
          {selected.user.bannedAt && (
            <p className="text-sm text-destructive">
              Suspendat la {formatDateTime(selected.user.bannedAt)}: {selected.user.banReason}
            </p>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-3 rounded-lg border bg-surface p-4 dark:bg-muted/30">
              {usage ? (
                <>
                  <div className="text-sm">
                    <span className="font-medium">Plan {usage.plan.name}</span>
                    {usage.comp && <span className="text-muted-foreground"> · oferit</span>}
                    <div className="text-xs text-muted-foreground">
                      {usage.used}/{usage.limit} aplicări · perioada {formatDate(usage.periodStart)} – {formatDate(usage.periodEnd)}
                    </div>
                  </div>
                  <ActionForm action={grantPlanAction}>
                    <div className="text-sm font-medium">Oferă un plan (fără plată)</div>
                    <input type="hidden" name="userId" value={selected.user.id} />
                    <div className="flex flex-wrap gap-2">
                      <NativeSelect name="planId" defaultValue="pro" className="w-32">
                        {paidPlans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </NativeSelect>
                      <Input name="days" type="number" min={1} max={366} defaultValue={30} className="w-24" aria-label="Zile" />
                      <Input name="note" placeholder="Notă (ex: beta tester)" className="min-w-40 flex-1" />
                    </div>
                    <SubmitButton size="sm" pendingText="Se acordă…">Oferă planul</SubmitButton>
                  </ActionForm>
                  {usage.comp && (
                    <ActionForm action={revokePlanAction}>
                      <input type="hidden" name="userId" value={selected.user.id} />
                      <SubmitButton size="sm" variant="ghost">Anulează planul oferit</SubmitButton>
                    </ActionForm>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Nu este prestator: nu are abonament.</p>
              )}
            </div>

            <div className="space-y-3 rounded-lg border bg-surface p-4 dark:bg-muted/30">
              {selected.user.bannedAt ? (
                <ActionForm action={unbanUserAction}>
                  <input type="hidden" name="userId" value={selected.user.id} />
                  <SubmitButton size="sm" variant="outline">Reactivează contul</SubmitButton>
                </ActionForm>
              ) : (
                <ActionForm action={banUserAction}>
                  <div className="text-sm font-medium">Suspendă contul</div>
                  <input type="hidden" name="userId" value={selected.user.id} />
                  <Input name="reason" placeholder="Motiv (ex: fraudă, spam repetat)" required />
                  <SubmitButton size="sm" variant="destructive">Suspendă</SubmitButton>
                </ActionForm>
              )}
              <ActionForm action={toggleAdminAction}>
                <input type="hidden" name="userId" value={selected.user.id} />
                <SubmitButton size="sm" variant="ghost">
                  {selected.user.role === "admin" ? "Retrage rolul de admin" : "Fă-l admin"}
                </SubmitButton>
              </ActionForm>
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-medium">Istoric abonamente</h3>
            {subs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Niciun abonament.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border bg-card">
                <table className="w-full text-sm">
                  <thead className="border-b bg-surface text-left text-xs tracking-[0.04em] text-muted-foreground uppercase dark:bg-muted/30">
                    <tr>
                      <th className="h-10 px-4 font-medium whitespace-nowrap">Plan</th>
                      <th className="h-10 px-4 font-medium whitespace-nowrap">Status</th>
                      <th className="h-10 px-4 font-medium whitespace-nowrap">Sursă</th>
                      <th className="h-10 px-4 font-medium whitespace-nowrap">Perioadă</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subs.map((s) => (
                      <tr key={s.id} className="border-t transition-colors hover:bg-muted/40">
                        <td className="px-4 py-2.5">{getPlan(s.planId)?.name ?? s.planId}</td>
                        <td className="px-4 py-2.5">{SUB_STATUS[s.status] ?? s.status}</td>
                        <td className="px-4 py-2.5 text-xs">{s.stripeSubscriptionId ? "Stripe" : "Oferit de echipă"}</td>
                        <td className="px-4 py-2.5 text-xs whitespace-nowrap text-muted-foreground">
                          {s.currentPeriodStart ? formatDate(s.currentPeriodStart) : "—"} – {s.currentPeriodEnd ? formatDate(s.currentPeriodEnd) : "—"}
                          {s.cancelAtPeriodEnd && " · se încheie"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
