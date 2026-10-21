import { asc, eq } from "drizzle-orm";
import { Briefcase, ExternalLink, QrCode, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ServiceForm } from "@/components/onboarding/first-service-form";
import { ProviderProfileForm } from "@/components/onboarding/provider-profile-form";
import { BasicInfoForm } from "@/components/profile/basic-info-form";
import { CoverManager } from "@/components/profile/cover-manager";
import { PortfolioManager } from "@/components/profile/portfolio-manager";
import { PublicToggle } from "@/components/profile/public-toggle";
import { ReviewReply } from "@/components/profile/review-reply";
import { ServiceList } from "@/components/profile/service-list";
import { CompanyVerification } from "@/components/profile/company-verification";
import { profileShortUrl, qrDataUrl } from "@/server/share";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { getProviderFormData } from "@/server/account";
import { requireOnboardedUser } from "@/server/auth/guards";
import { getLocality } from "@/server/catalog/localities";
import { categoryOptions } from "@/server/catalog/options";
import { getCatalog } from "@/server/catalog/taxonomy";
import { db } from "@/server/db";
import { portfolioItems, providerServices } from "@/server/db/schema";
import { reviewsFor } from "@/server/trust/service";

export const metadata: Metadata = { title: "Profilul meu" };

function Stars({ n }: { n: number }) {
  return (
    <span className="flex" aria-label={`${n} din 5 stele`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`size-3.5 ${i < n ? "fill-warning text-warning" : "text-muted-foreground/40"}`} />
      ))}
    </span>
  );
}

export default async function ProfilePage() {
  const user = await requireOnboardedUser("/profil");
  const [loc, categories, providerData, catalog, reviews] = await Promise.all([
    user.localityId ? getLocality(user.localityId) : null,
    categoryOptions(),
    user.isProvider ? getProviderFormData(user.id) : null,
    getCatalog(),
    reviewsFor(user.id, user.id),
  ]);
  const [services, portfolio] = user.isProvider
    ? await Promise.all([
        db.select().from(providerServices).where(eq(providerServices.providerId, user.id)).orderBy(asc(providerServices.sortOrder)),
        db.select().from(portfolioItems).where(eq(portfolioItems.providerId, user.id)).orderBy(asc(portfolioItems.sortOrder)),
      ])
    : [[], []];
  const shortUrl = providerData?.slug ? profileShortUrl(providerData.slug) : null;
  const qr = shortUrl ? await qrDataUrl(shortUrl, 240) : null;
  const providerCats = (providerData?.initial.categoryIds ?? []).map((id) => ({ id, name: catalog.byId.get(id)?.name ?? "" })).filter((c) => c.name);
  const nav = [
    { href: "#date", label: "Date de bază" },
    ...(user.isProvider
      ? [
          { href: "#distribuie", label: "Distribuie" },
          { href: "#prestator", label: "Profil prestator" },
          { href: "#servicii", label: "Servicii" },
          { href: "#portofoliu", label: "Portofoliu" },
        ]
      : []),
    { href: "#firma", label: "Firmă (opțional)" },
    { href: "#recenzii", label: `Recenzii (${reviews.length})` },
  ];

  return (
    <div className="container-page max-w-4xl pb-16">
      <PageHeader
        eyebrow="Cont"
        title="Profilul meu"
        description="Ce văd ceilalți despre tine. Un profil complet primește mai multe oferte și răspunsuri."
        actions={
          providerData?.slug ? (
            <Button asChild variant="outline">
              <Link href={`/prestatori/${providerData.slug}`} target="_blank">
                Vezi profilul public <ExternalLink />
              </Link>
            </Button>
          ) : undefined
        }
      />
      <nav aria-label="Secțiuni profil" className="sticky top-15 z-10 -mx-4 mb-8 flex gap-1 overflow-x-auto border-b bg-background/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:mx-0 sm:px-0">
        {nav.map((n) => (
          <a key={n.href} href={n.href} className="-mb-px shrink-0 border-b-2 border-transparent px-3 py-3 text-sm text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground">
            {n.label}
          </a>
        ))}
      </nav>

      <div className="space-y-8 [&>[data-slot=card]]:rounded-2xl">
        <Card id="date" className="scroll-mt-28">
          <CardHeader className="border-b">
            <CardTitle>Date de bază</CardTitle>
          </CardHeader>
          <CardContent>
            <BasicInfoForm
              name={user.name}
              avatarPath={user.avatarPath}
              locality={loc ? { id: loc.id, name: loc.name, county: loc.county, countyCode: loc.countyCode } : null}
            />
          </CardContent>
        </Card>

        {user.isProvider && providerData?.slug && qr && shortUrl ? (
          <section id="distribuie" className="ink-panel scroll-mt-28 rounded-[1.5rem] dark:ring-1 dark:ring-white/8" aria-labelledby="distribuie-titlu">
            <div aria-hidden className="aurora aurora-a -top-40 -left-24 size-[420px] opacity-50" />
            <div aria-hidden className="aurora aurora-b -right-32 -bottom-48 size-[380px] opacity-35" />
            <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
              <div className="relative shrink-0 self-start sm:self-center">
                <div aria-hidden className="absolute -inset-4 rounded-3xl bg-[#5b7cff]/30 blur-2xl" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt="Cod QR către profilul tău" className="relative size-32 rounded-2xl bg-white p-2 shadow-2xl" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium tracking-[0.08em] text-white/55 uppercase">Distribuie profilul</div>
                <h2 id="distribuie-titlu" className="mt-2.5 text-[1.5rem] leading-tight font-semibold tracking-[-0.028em] text-white">
                  Adu clienți și <span className="serif-em text-gradient-ink">din offline</span>.
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  Linkul tău scurt: <span className="font-medium text-white">{shortUrl.replace(/^https?:\/\//, "")}</span>. Pune-l în grupuri, pe WhatsApp
                  sau tipărește codul QR pe cartea de vizită.
                </p>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <Link
                    href={`/prestatori/${providerData.slug}/card`}
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-white px-3.5 text-sm font-semibold text-[#0b1426] transition-colors hover:bg-[#eef1fc]"
                  >
                    <QrCode className="size-4" /> Card, QR și distribuire
                  </Link>
                  <Link
                    href={`/prestatori/${providerData.slug}`}
                    target="_blank"
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/15 bg-white/[0.05] px-3.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.1]"
                  >
                    Profil public <ExternalLink className="size-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <Card id="firma" className="scroll-mt-28">
          <CardHeader className="border-b">
            <CardTitle>
              Firmă & verificare ANAF <span className="text-sm font-normal text-muted-foreground">(opțional)</span>
            </CardTitle>
            <CardDescription>
              {user.isProvider
                ? "Doar dacă ai PFA, II sau SRL: confirmi firma și primești badge-ul „Firmă verificată ANAF”."
                : "Publici proiecte în numele unei firme? Verificarea crește încrederea prestatorilor."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CompanyVerification
              cui={user.companyCui}
              verifiedAt={user.companyVerifiedAt?.toISOString() ?? null}
              info={user.companyVerification ?? null}
              hasCompany={user.legalEntity !== "none" || Boolean(user.companyCui)}
            />
          </CardContent>
        </Card>

        {user.isProvider && providerData ? (
          <>
            <section id="prestator" className="scroll-mt-28 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold tracking-[-0.02em]">Profil prestator</h2>
                <PublicToggle initial={providerData.isPublic} />
              </div>
              {providerData.exists && (
                <Card id="coperta" className="scroll-mt-28 rounded-2xl">
                  <CardHeader className="border-b">
                    <CardTitle>Imagine de copertă</CardTitle>
                    <CardDescription>Bannerul lat din capul profilului public. O fotografie cu lucrările tale face profilul mai ușor de recunoscut.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CoverManager coverPath={providerData.coverPath} />
                  </CardContent>
                </Card>
              )}
              <ProviderProfileForm categories={categories} initial={providerData.initial} context="profile" />
            </section>

            <Card id="servicii" className="scroll-mt-28">
              <CardHeader className="border-b">
                <CardTitle>Servicii</CardTitle>
                <CardDescription>Listează serviciile cu prețuri orientative (max 20).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <ServiceList services={services.map((s) => ({ ...s, categoryName: catalog.byId.get(s.categoryId)?.name ?? "" }))} />
                {providerCats.length > 0 && <ServiceForm categories={providerCats} />}
              </CardContent>
            </Card>

            <Card id="portofoliu" className="scroll-mt-28">
              <CardHeader className="border-b">
                <CardTitle>Portofoliu</CardTitle>
                <CardDescription>Fotografii și linkuri către lucrări realizate (max 30).</CardDescription>
              </CardHeader>
              <CardContent>
                <PortfolioManager items={portfolio} />
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-start gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/60"><Briefcase className="size-4" strokeWidth={1.75} /></span>
                <div>
                  <div className="font-medium">Oferi și tu servicii?</div>
                  <p className="text-sm text-muted-foreground">Creează un profil de prestator și primește proiecte compatibile. Planul Gratuit include aplicări în fiecare lună.</p>
                </div>
              </div>
              <Button asChild>
                <Link href="/onboarding?rol=prestator">Devino prestator</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <Card id="recenzii" className="scroll-mt-28">
          <CardHeader className="border-b">
            <CardTitle>Recenzii primite</CardTitle>
            <CardDescription>Doar participanții la o colaborare confirmată pot lăsa recenzii. Le poți răspunde public.</CardDescription>
          </CardHeader>
          <CardContent>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nicio recenzie încă. După finalizarea unei colaborări, cere-i clientului o recenzie din pagina „Colaborări”.</p>
            ) : (
              <ul className="space-y-4">
                {reviews.map((r) => (
                  <li key={r.id} className="space-y-2 rounded-lg border bg-surface p-4 dark:bg-muted/30">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Stars n={r.rating} />
                      <span className="font-medium">{r.authorName}</span>
                      {r.authorHidden && <span className="text-xs text-muted-foreground">(public apare ca „{r.authorRole === "client" ? "Client verificat" : "Prestator verificat"}”)</span>}
                      <span className="ml-auto text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Proiect: {r.projectTitle}</div>
                    {r.comment && <p className="text-sm">{r.comment}</p>}
                    {r.reply && (
                      <div className="rounded-md border bg-card p-3 text-sm">
                        <span className="font-medium">Răspunsul tău: </span>
                        {r.reply}
                      </div>
                    )}
                    <ReviewReply reviewId={r.id} existing={r.reply} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
