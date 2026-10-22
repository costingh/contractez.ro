import { Gift, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { asc, eq, sql } from "drizzle-orm";
import { BasicsForm } from "@/components/onboarding/basics-form";
import { FinishButton } from "@/components/onboarding/finish-button";
import { ServiceForm } from "@/components/onboarding/first-service-form";
import { ProviderProfileForm, emptyProviderForm } from "@/components/onboarding/provider-profile-form";
import { SavedToast } from "@/components/onboarding/saved-toast";
import { OnboardingSteps } from "@/components/onboarding/steps";
import { ContactPhoneForm } from "@/components/profile/contact-phone-form";
import { EmailStatus } from "@/components/profile/email-status";
import { ServiceList, type ServiceRow } from "@/components/profile/service-list";
import { PhoneVerification } from "@/components/profile/phone-verification";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { freePlan } from "@/config/site";
import { CONTACT_PHONE_HINT } from "@/lib/phone";
import { getProviderFormData } from "@/server/account";
import { requireUser } from "@/server/auth/guards";
import { smsConfigured } from "@/server/auth/sms";
import { getLocality } from "@/server/catalog/localities";
import { categoryOptions, serviceCategoryOptions, type ServiceCategoryOption } from "@/server/catalog/options";
import { getCatalog } from "@/server/catalog/taxonomy";
import { db } from "@/server/db";
import { providerServices } from "@/server/db/schema";
import { features } from "@/server/features";
import { onboardingProgress, type OnboardingStep } from "@/server/onboarding";

export const metadata: Metadata = { title: "Configurează contul" };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ pas?: string; rol?: string; salvat?: string }> }) {
  const { pas, rol: rolParam, salvat } = await searchParams;
  const user = await requireUser("/onboarding");
  // Fiecare pas se salvează la „Continuă”; progresul se deduce din datele salvate (merge și după re-login, pe alt dispozitiv).
  const progress = onboardingProgress(user, (await cookies()).get("onb_rol")?.value === "prestator");
  const pendingProvider = progress.wantsProvider && !progress.providerDone;
  const rol = rolParam ?? (pendingProvider ? "prestator" : undefined);
  if (user.onboardedAt && !pas && !rol) redirect("/panou");

  // Fără `pas` (după autentificare, din bannere etc.): continuăm de la primul pas nesalvat.
  // Excepție: un cont deja configurat care cere explicit alt rol (ex. clientul care devine prestator) pornește de la pasul 1.
  const resume =
    !pas &&
    !(user.onboardedAt && progress.firstIncomplete === 3) &&
    (!rolParam || (rolParam === "prestator" ? progress.wantsProvider : user.isClient));
  const step = pas === "1" ? 1 : pas === "2" ? 2 : pas === "3" ? 3 : resume ? progress.firstIncomplete : 1;
  if (step === 3 && pendingProvider) redirect("/onboarding?pas=2");
  if (step === 3 && !progress.basicsDone) redirect("/onboarding?pas=1");
  const wantsProvider = rol === "prestator" || progress.wantsProvider || step === 2;
  const steps = wantsProvider ? ["Despre tine", "Profil prestator", "Gata"] : ["Despre tine", "Gata"];
  const stepNumbers: OnboardingStep[] = wantsProvider ? [1, 2, 3] : [1, 3];
  const current = stepNumbers.indexOf(step) + 1 || 1;
  const done = stepNumbers.map((n) => (n === 1 ? progress.basicsDone : n === 2 ? progress.providerDone : Boolean(user.onboardedAt)));
  // Se poate reveni la pașii salvați și la primul pas nesalvat, dar nu se poate sări peste unul.
  const hrefs = stepNumbers.map((n) => (n <= progress.firstIncomplete || done[stepNumbers.indexOf(n)] ? `/onboarding?pas=${n}` : null));

  return (
    <div className="container-page max-w-3xl pt-8 pb-16 sm:pt-12">
      <section className="ink-panel enter mb-8 rounded-[1.75rem] dark:ring-1 dark:ring-white/8">
        <div aria-hidden className="aurora aurora-a -top-48 -left-24 size-[480px] opacity-50" />
        <div aria-hidden className="aurora aurora-b -right-32 -bottom-56 size-[420px] opacity-35" />
        <div className="p-6 sm:p-9">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-medium tracking-[0.08em] text-white/50 uppercase tabular-nums">
              Configurare cont · pasul {current} din {steps.length}
            </span>
            {user.onboardedAt && (
              <Link href="/panou" className="shrink-0 text-sm font-medium text-white/75 underline-offset-4 hover:text-white hover:underline">
                Înapoi la panou
              </Link>
            )}
          </div>
          <h1 className="display-md mt-4 text-white">
            {step === 1 ? (
              <>
                {user.name ? (
                  <>
                    Salut, <span className="serif-em text-gradient-ink">{user.name.split(" ")[0]}</span>!
                  </>
                ) : (
                  <>
                    Bun <span className="serif-em text-gradient-ink">venit</span>!
                  </>
                )}
              </>
            ) : step === 2 ? (
              <>
                Profilul tău de <span className="serif-em text-gradient-ink">prestator</span>
              </>
            ) : (
              <>
                Aproape <span className="serif-em text-gradient-ink">gata</span>
              </>
            )}
          </h1>
          <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-white/60">
            {step === 1
              ? "Hai să-ți configurăm contul. Durează mai puțin de un minut și poți schimba oricând totul din profil."
              : step === 2
                ? "Domeniile, zona și tariful tău. De aici calculăm ce proiecte îți trimitem."
                : "Verifică-ți contul și ești gata de primul proiect."}
          </p>
          <div className="mt-7">
            <OnboardingSteps steps={steps} current={current} done={done} hrefs={hrefs} tone="ink" />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-white/50">Fiecare pas se salvează când treci la următorul. Poți reveni oricând la pașii bifați.</p>
        </div>
      </section>

      {/* Cheie per pas: componenta rămâne montată între redirecționări, iar fiecare pas salvat își arată confirmarea. */}
      {salvat && <SavedToast key={`${step}-${salvat}`} description={salvat === "2" ? "Profilul de prestator a fost salvat." : "Datele tale au fost salvate."} />}
      {step === 1 && <StepBasics user={user} preselect={rol} />}
      {step === 2 && <StepProvider userId={user.id} />}
      {step === 3 && (
        <StepFinish
          userId={user.id}
          email={user.email}
          emailVerified={Boolean(user.emailVerifiedAt)}
          verifiedPhone={user.phoneVerifiedAt ? user.phone : null}
          contactPhone={user.phone}
          isProvider={user.isProvider}
          isClient={user.isClient}
          welcomeGranted={Boolean(user.welcomeCreditsGrantedAt)}
        />
      )}
    </div>
  );
}

async function StepBasics({ user, preselect }: { user: Awaited<ReturnType<typeof requireUser>>; preselect?: string }) {
  const loc = user.localityId ? await getLocality(user.localityId) : null;
  const fresh = !user.onboardedAt && !user.isClient && !user.isProvider && !user.wantsProvider;
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Despre tine</CardTitle>
        <CardDescription>Durează mai puțin de un minut. Poți schimba oricând din profil.</CardDescription>
      </CardHeader>
      <CardContent>
        <BasicsForm
          freeApplications={freePlan.monthlyApplications}
          initial={{
            name: user.name,
            isClient: user.isClient || preselect === "client" || (fresh && preselect !== "prestator"),
            isProvider: user.isProvider || user.wantsProvider || preselect === "prestator",
            locality: loc ? { id: loc.id, name: loc.name, county: loc.county, countyCode: loc.countyCode } : null,
          }}
        />
      </CardContent>
    </Card>
  );
}

async function StepProvider({ userId }: { userId: string }) {
  const [categories, data] = await Promise.all([categoryOptions(), getProviderFormData(userId)]);
  return (
    <div className="space-y-4">
      <div className="enter flex gap-3.5 rounded-2xl border border-brand/20 bg-brand-soft px-5 py-4 text-sm">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground">
          <Sparkles className="size-4" />
        </span>
        <p className="leading-relaxed">
          Cu cât profilul e mai complet, cu atât scorul de compatibilitate e mai precis. Îți trimitem doar proiecte din categoriile, zona și
          bugetul tău — fără spam.
        </p>
      </div>
      <ProviderProfileForm categories={categories} initial={data?.initial ?? emptyProviderForm} context="onboarding" submitLabel="Salvează și continuă" />
    </div>
  );
}

async function StepFinish(props: {
  userId: string;
  email: string;
  emailVerified: boolean;
  verifiedPhone: string | null;
  contactPhone: string | null;
  isProvider: boolean;
  isClient: boolean;
  welcomeGranted: boolean;
}) {
  const catalog = await getCatalog();
  let providerCats: ServiceCategoryOption[] = [];
  let services: ServiceRow[] = [];
  if (props.isProvider) {
    const rows = (await db.execute(sql`SELECT category_id FROM provider_categories WHERE provider_id = ${props.userId}`)) as unknown as { category_id: number }[];
    providerCats = await serviceCategoryOptions(rows.map((r) => r.category_id));
    services = (
      await db.select().from(providerServices).where(eq(providerServices.providerId, props.userId)).orderBy(asc(providerServices.sortOrder))
    ).map((s) => ({ ...s, categoryName: catalog.byId.get(s.categoryId)?.name ?? "" }));
  }
  return (
    <div className="space-y-5">
      {props.isProvider && !props.welcomeGranted && (
        <div className="enter flex items-center gap-4 rounded-2xl border border-brand/20 bg-brand-soft px-5 py-5">
          <span className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(140deg,#1c2f57,#2b4acb_70%,#4f7cff)] text-white shadow-[0_8px_20px_-8px_rgb(43_74_203/0.7)]">
            <Gift className="size-5" />
          </span>
          <div className="space-y-0.5 text-sm leading-relaxed">
            <div className="text-base font-semibold tracking-[-0.01em]">
              Planul Gratuit îți dă <span className="hl">{freePlan.monthlyApplications} aplicări</span> la proiecte în fiecare lună.
            </div>
            <div className="text-muted-foreground">
              {props.emailVerified ? "Le poți folosi imediat ce finalizezi configurarea." : "Le poți folosi după ce îți confirmi adresa de email."}
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Verificarea contului</CardTitle>
          <CardDescription>Conturile verificate primesc mai multă încredere. Clienții trebuie să confirme emailul ca să publice proiecte.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <EmailStatus email={props.email} verified={props.emailVerified} />
          {features.phoneVerification ? (
            <div className="space-y-2">
              <div className="text-sm font-medium">
                Telefon <span className="font-normal text-muted-foreground">(opțional — afișăm insigna „verificat”)</span>
              </div>
              <PhoneVerification verifiedPhone={props.verifiedPhone} devHint={!smsConfigured} />
              <p className="text-xs text-muted-foreground">{CONTACT_PHONE_HINT}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm font-medium">
                Telefon de contact <span className="font-normal text-muted-foreground">(opțional)</span>
              </div>
              <ContactPhoneForm phone={props.contactPhone} />
            </div>
          )}
        </CardContent>
      </Card>

      {props.isProvider && providerCats.length > 0 && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Primul tău serviciu</CardTitle>
            <CardDescription>Opțional. Serviciile cu preț orientativ apar pe profilul public și ajută clienții să te aleagă.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {services.length > 0 && <ServiceList services={services} categories={providerCats} />}
            <ServiceForm categories={providerCats} submitLabel={services.length ? "Adaugă încă un serviciu" : "Adaugă serviciul"} />
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-4 rounded-2xl border border-border-strong bg-card p-5 shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {props.isProvider ? "Îți arătăm imediat proiectele deschise potrivite pentru tine." : "Următorul pas: descrie ce ai nevoie, iar AI-ul te ajută să scrii cererea."}
        </p>
        <FinishButton label={props.isProvider ? "Vezi proiectele potrivite" : "Publică primul proiect"} />
      </div>
    </div>
  );
}
