import { Info, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PlanCards } from "@/components/billing/plan-cards";
import { UsageMeter } from "@/components/billing/usage-meter";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { paidPlans, plans, rules, type PlanId } from "@/config/site";
import { formatDate } from "@/lib/format";
import { requireOnboardedUser } from "@/server/auth/guards";
import { getPlanUsage, hasRecentCheckout } from "@/server/billing/plans";
import { features } from "@/server/env";
import { PortalButton, SubscribeButton } from "./plan-buttons";

export const metadata: Metadata = { title: "Abonament" };

export default async function SubscriptionPage({ searchParams }: { searchParams: Promise<{ plata?: string }> }) {
  const user = await requireOnboardedUser("/abonament");
  const { plata } = await searchParams;

  if (!user.isProvider) {
    return (
      <div className="container-page max-w-3xl pb-16">
        <PageHeader eyebrow="Cont" title="Abonament" description="Abonamentele sunt pentru prestatori." />
        <Card>
          <CardContent className="space-y-3 text-sm leading-relaxed">
            <p>Pentru clienți totul este gratuit: publici proiecte, primești oferte și discuți cu prestatorii fără niciun cost.</p>
            <p className="mt-1 leading-relaxed text-muted-foreground">Prestezi și tu servicii? Creează profilul de prestator și primești {plans[0].monthlyApplications} aplicări gratuite în fiecare lună.</p>
            <Button asChild variant="outline" size="sm">
              <Link href="/onboarding?rol=prestator">Devino prestator</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const usage = await getPlanUsage(user.id);
  const sub = usage.subscription;
  const hasPaid = Boolean(sub?.stripeSubscriptionId);
  // La întoarcerea din Stripe (`?plata=succes`), mesajul urmează starea reală a planului, nu URL-ul:
  // plan plătit activ → confirmare; altfel „în curs de confirmare” doar dacă a pornit o plată în ultimele minute.
  const returnBanner = plata !== "succes" ? null : hasPaid && usage.plan.priceLei > 0 ? "active" : (await hasRecentCheckout(user.id)) ? "pending" : null;

  const actions: Partial<Record<PlanId, React.ReactNode>> = {};
  for (const p of paidPlans) {
    const current = usage.plan.id === p.id && hasPaid;
    actions[p.id] = hasPaid ? (
      current ? (
        <Button className="w-full" size="lg" variant="outline" disabled>
          Planul tău
        </Button>
      ) : (
        <PortalButton label={`Schimbă la ${p.name}`} className="w-full" />
      )
    ) : (
      <SubscribeButton
        planId={p.id}
        enabled={features.payments}
        variant={p.highlight ? "default" : "outline"}
        label={features.payments ? `Alege ${p.name}` : "Disponibil la lansare"}
      />
    );
  }

  return (
    <div className="container-page pb-16">
      <PageHeader eyebrow="Cont" title="Abonament" description="Clienții publică gratuit. Tu alegi câte aplicări ai nevoie în fiecare lună; chat-ul cu clienții e nelimitat." />

      {returnBanner === "active" && (
        <Alert variant="success" className="mb-6">
          <ShieldCheck />
          <AlertTitle>Planul {usage.plan.name} este activ</AlertTitle>
          <AlertDescription>Mulțumim! Ai {usage.limit} aplicări pe lună, până pe {formatDate(usage.periodEnd)}.</AlertDescription>
        </Alert>
      )}
      {returnBanner === "pending" && (
        <Alert variant="info" className="mb-6">
          <Info />
          <AlertTitle>Plata este în curs de confirmare</AlertTitle>
          <AlertDescription>Planul se activează în câteva secunde, imediat ce Stripe confirmă plata. Reîncarcă pagina dacă nu îl vezi.</AlertDescription>
        </Alert>
      )}
      {plata === "anulata" && (
        <Alert className="mb-6">
          <Info />
          <AlertTitle>Plata a fost anulată</AlertTitle>
          <AlertDescription>Nu ți-am debitat nimic. Poți reîncerca oricând.</AlertDescription>
        </Alert>
      )}

      <Card className="enter overflow-hidden rounded-[1.4rem] py-0">
        <CardContent className="relative grid gap-6 p-6 sm:p-8 md:grid-cols-[minmax(0,16rem)_1fr] md:items-center">
          <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-brand/10 blur-3xl" />
          <div className="relative">
            <div className="eyebrow">Planul curent</div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="display-md">{usage.plan.name}</span>
              <span className="text-sm text-muted-foreground tabular-nums">{usage.plan.priceLei} lei / lună</span>
            </div>
          </div>
          <UsageMeter usage={usage} className="relative md:border-l md:pl-8" />
          {sub && (
            <div className="relative flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm md:col-span-2">
              <div className="leading-relaxed text-muted-foreground">
                {usage.comp ? (
                  <>Plan oferit de echipă, valabil până pe {formatDate(usage.planEndsAt ?? usage.periodEnd)}. După aceea treci automat pe Gratuit.</>
                ) : sub.status === "past_due" ? (
                  <span className="text-destructive">Plata pentru reînnoire nu a reușit. Actualizează cardul ca să păstrezi planul.</span>
                ) : sub.cancelAtPeriodEnd ? (
                  <>Abonamentul este anulat și rămâne activ până pe {formatDate(usage.periodEnd)}.</>
                ) : (
                  <>Se reînnoiește automat pe {formatDate(usage.periodEnd)}. Poți anula oricând.</>
                )}
              </div>
              {hasPaid && features.stripeConfigured && <PortalButton />}
            </div>
          )}
        </CardContent>
      </Card>

      <section id="planuri" className="mt-14 scroll-mt-20">
        <h2 className="display-md mb-1">
          Alege ritmul <span className="serif-em text-gradient">potrivit</span>.
        </h2>
        {!features.payments && (
          <p className="mt-4 mb-4 rounded-xl border border-brand/20 bg-brand-soft px-4 py-3 text-sm leading-relaxed">
            <span className="font-medium">Beta:</span> Plățile se activează la lansarea publică. Până atunci folosești planul Gratuit sau un plan oferit de echipă.
          </p>
        )}
        <div className="mt-8">
          <PlanCards currentPlanId={usage.plan.id} actions={actions} />
        </div>
        <p className="mt-4 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          Prețurile sunt finale, cu TVA inclus. Abonamentul se reînnoiește lunar și îl poți anula oricând; aplicările nefolosite nu se reportează.{" "}
          {features.managedPayments
            ? "Plata e procesată de Stripe prin Link, care este vânzătorul oficial: primești chitanța și factura pe email de la Link."
            : "Plata se face securizat prin Stripe."}
        </p>
      </section>

      <section className="mt-14 grid gap-px overflow-hidden rounded-[1.4rem] border bg-border text-sm sm:grid-cols-3 [&>div]:bg-card [&>div]:p-6">
        <div>
          <div className="font-semibold">Proiect fals sau duplicat?</div>
          <p className="mt-1 leading-relaxed text-muted-foreground">Dacă moderatorii elimină un proiect la care ai aplicat, aplicarea nu se mai socotește în limita ta.</p>
        </div>
        <div>
          <div className="font-semibold">Ofertă nedeschisă</div>
          <p className="mt-1 leading-relaxed text-muted-foreground">Dacă clientul nu deschide oferta în {rules.unseenRefundDays} zile, îți returnăm aplicarea.</p>
        </div>
        <div>
          <div className="font-semibold">Schimbi planul oricând</div>
          <p className="mt-1 leading-relaxed text-muted-foreground">Treci de la Pro la Business sau înapoi din „Gestionează abonamentul”; diferența se calculează automat.</p>
        </div>
      </section>
    </div>
  );
}
