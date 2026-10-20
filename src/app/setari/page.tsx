import { Bell, Gift, Lock, ShieldCheck, UserRoundCheck } from "lucide-react";
import type { Metadata } from "next";
import { cssVars } from "@/components/home/css-vars";
import { EmailStatus } from "@/components/profile/email-status";
import { CopyField } from "@/components/profile/copy-field";
import { PasswordForm } from "@/components/profile/password-form";
import { PhoneVerification } from "@/components/profile/phone-verification";
import { PreferencesForm } from "@/components/profile/preferences-form";
import {
  DeleteAccount,
  ExportData,
  LogoutEverywhere,
} from "@/components/profile/security-actions";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { rules } from "@/config/site";
import { ensureReferralCode, referralStats } from "@/server/account";
import { requireUser } from "@/server/auth/guards";
import { smsConfigured } from "@/server/auth/sms";
import { env } from "@/server/env";
import { getPreferences } from "@/server/notifications";

export const metadata: Metadata = { title: "Setări" };

export default async function SettingsPage() {
  const user = await requireUser("/setari");
  const [prefs, code, refStats] = await Promise.all([
    getPreferences(user.id),
    ensureReferralCode(user.id),
    referralStats(user.id),
  ]);
  const showPhone = smsConfigured || env.NODE_ENV !== "production";
  const referralUrl = `${env.APP_URL}/inregistrare?rol=prestator&ref=${code}`;

  return (
    <div className="container-page max-w-3xl space-y-6 pb-16 [&>[data-slot=card]]:rounded-2xl">
      <PageHeader
        eyebrow="Cont"
        title="Setări"
        description="Notificări, securitate și datele contului."
      />

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-muted text-foreground/70">
              <Bell className="size-3.5" />
            </span>
            Notificări
          </CardTitle>
          <CardDescription>
            Alege ce primești pe email. Notificările din aplicație rămân mereu
            active.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PreferencesForm
            isProvider={user.isProvider}
            initial={{
              matchFrequency: prefs.matchFrequency,
              messagesEmail: prefs.messagesEmail,
              applicationUpdatesEmail: prefs.applicationUpdatesEmail,
              autoBidEmail: prefs.autoBidEmail,
              productEmail: prefs.productEmail,
              minMatchScore: prefs.minMatchScore,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-muted text-foreground/70">
              <UserRoundCheck className="size-3.5" />
            </span>
            Verificare cont
          </CardTitle>
          <CardDescription>
            Emailul confirmat e necesar pentru a publica și a aplica. Telefonul
            verificat îți aduce insigna „verificat”.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <EmailStatus
            email={user.email}
            verified={Boolean(user.emailVerifiedAt)}
          />
          {showPhone ? (
            <PhoneVerification
              verifiedPhone={user.phoneVerifiedAt ? user.phone : null}
              devHint={!smsConfigured}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Verificarea telefonului va fi disponibilă în curând.
            </p>
          )}
        </CardContent>
      </Card>

      <section
        id="invita"
        className="ink-panel scroll-mt-20 rounded-[1.5rem] dark:ring-1 dark:ring-white/8"
        aria-labelledby="invita-titlu"
      >
        <div
          aria-hidden
          className="aurora aurora-a -top-40 -right-24 size-[420px] opacity-50"
        />
        <div
          aria-hidden
          className="aurora aurora-c -bottom-48 -left-24 size-[380px] opacity-35"
        />
        <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium tracking-[0.08em] text-white/55 uppercase">
              <Gift className="size-3.5 text-[#8ea6ff]" /> Invită prestatori
            </div>
            <h2
              id="invita-titlu"
              className="mt-3 text-[1.625rem] leading-tight font-semibold tracking-[-0.028em] text-white"
            >
              Primești{" "}
              <span className="serif-em text-gradient-ink">
                {rules.referralProDays} de zile
              </span>{" "}
              de Pro gratuit.
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/60">
              Pentru fiecare prestator care se înscrie cu linkul tău și își
              confirmă emailul.
            </p>
          </div>
          <dl className="flex gap-3">
            {[
              { l: "înscriși", v: refStats.invited },
              { l: "cu email confirmat", v: refStats.verified },
            ].map((x, n) => (
              <div key={x.l} className="glass min-w-28 rounded-2xl px-4 py-3">
                <dd className="text-[1.75rem] leading-none font-semibold tracking-[-0.03em] text-white tabular-nums">
                  <span
                    aria-hidden
                    className="count-in"
                    style={cssVars({ to: x.v, i: n + 1 })}
                  />
                  <span className="sr-only">{x.v}</span>
                </dd>
                <dt className="mt-1.5 text-xs text-white/55">{x.l}</dt>
              </div>
            ))}
          </dl>
          <div className="md:col-span-2">
            <div className="rounded-xl bg-white/[0.06] p-1.5 ring-1 ring-white/10 [&_input]:border-0! [&_input]:bg-white! [&_input]:text-[#0b1426]! [&_button]:border-white/15! [&_button]:bg-white/[0.08]! [&_button]:text-white! [&_button:hover]:bg-white/[0.14]!">
              <CopyField value={referralUrl} />
            </div>
          </div>
        </div>
      </section>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-muted text-foreground/70">
              <Lock className="size-3.5" />
            </span>
            Securitate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <PasswordForm hasPassword={user.passwordHash !== "oauth"} />
          <div className="border-t pt-5">
            <LogoutEverywhere />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-muted text-foreground/70">
              <ShieldCheck className="size-3.5" />
            </span>
            Datele tale (GDPR)
          </CardTitle>
          <CardDescription>
            Poți descărca oricând datele asociate contului sau poți cere
            ștergerea lui.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <ExportData />
          <DeleteAccount />
        </CardContent>
      </Card>
    </div>
  );
}
