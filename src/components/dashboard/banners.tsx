import { MailWarning, Smartphone, UserCog } from "lucide-react";
import Link from "next/link";
import { ResendButton } from "@/app/(auth)/verifica-email/resend-button";
import { EmailVerifiedWatcher } from "@/components/profile/email-verification-sync";
import { Button } from "@/components/ui/button";

export function DashboardBanners({
  emailVerified,
  email,
  phoneVerified,
  isProvider,
  hasProviderProfile,
  showPhone,
}: {
  emailVerified: boolean;
  email: string;
  phoneVerified: boolean;
  isProvider: boolean;
  hasProviderProfile: boolean;
  showPhone: boolean;
}) {
  return (
    <div className="space-y-3">
      {!emailVerified && (
        <div className="flex flex-col gap-3 enter rounded-2xl border border-warning/30 bg-warning/8 p-4 sm:flex-row sm:px-5 sm:items-center sm:justify-between">
          <EmailVerifiedWatcher />
          <div className="flex gap-3.5 text-sm">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-warning/12 text-warning">
              <MailWarning className="size-[1.125rem]" />
            </span>
            <div>
              <div className="font-semibold">Confirmă adresa de email</div>
              <div className="mt-0.5 leading-relaxed text-muted-foreground">
                Am trimis un link la {email}. Fără confirmare nu poți publica proiecte{isProvider ? " sau aplica la proiecte" : ""}.
              </div>
            </div>
          </div>
          <div className="sm:w-64">
            <ResendButton />
          </div>
        </div>
      )}
      {isProvider && !hasProviderProfile && (
        <div className="flex flex-col gap-3 enter rounded-2xl border border-brand/20 bg-brand-soft p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-3.5 text-sm">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/12 text-brand">
              <UserCog className="size-[1.125rem]" />
            </span>
            <span className="font-medium">Completează profilul de prestator ca să primești proiecte.</span>
          </div>
          <Button asChild size="sm">
            <Link href="/onboarding?rol=prestator">Completează</Link>
          </Button>
        </div>
      )}
      {emailVerified && !phoneVerified && showPhone && (
        <div className="flex flex-col gap-2 enter rounded-2xl border bg-card px-4 py-3 text-sm shadow-xs sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Smartphone className="size-4" /> Verifică-ți telefonul pentru insigna „verificat” — crește încrederea și răspunsurile.
          </span>
          <Link href="/setari" className="shrink-0 font-medium text-brand underline-offset-4 hover:underline">
            Verifică acum
          </Link>
        </div>
      )}
    </div>
  );
}
