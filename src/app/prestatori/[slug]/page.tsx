import { asc, eq, sql } from "drizzle-orm";
import {
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  ExternalLink,
  Globe,
  Languages,
  Mail,
  MapPin,
  MessageSquareReply,
  Receipt,
  Star,
  Timer,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ReportDialog } from "@/components/project-detail/report-dialog";
import { SocialLinks } from "@/components/providers/social-links";
import { LANGUAGES } from "@/components/public-search/provider-filters-form";
import { EmptyState } from "@/components/shared/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { labels } from "@/config/site";
import { formatDate, formatResponseTime, initials, timeAgo } from "@/lib/format";
import { truncate } from "@/lib/text";
import { getCurrentUser } from "@/server/auth/session";
import { getCatalog } from "@/server/catalog/taxonomy";
import { db } from "@/server/db";
import { isPhoneVerified } from "@/server/features";
import {
  localities,
  portfolioItems,
  providerCategories,
  providerProfiles,
  providerServices,
  providerSkills,
  skills,
  users,
} from "@/server/db/schema";
import { reviewsFor } from "@/server/trust/service";
import { AnafBadge } from "@/components/shared/anaf-badge";
import { isFirstViewToday } from "@/server/views";

const loadProfile = cache(async (slug: string) => {
  const [row] = await db
    .select({
      profile: providerProfiles,
      user: {
        id: users.id,
        name: users.name,
        avatarPath: users.avatarPath,
        emailVerifiedAt: users.emailVerifiedAt,
        phoneVerifiedAt: users.phoneVerifiedAt,
        issuesInvoice: users.issuesInvoice,
        legalEntity: users.legalEntity,
        companyName: users.companyName,
        companyCui: users.companyCui,
        companyVerifiedAt: users.companyVerifiedAt,
        companyVerification: users.companyVerification,
        createdAt: users.createdAt,
        onboardedAt: users.onboardedAt,
        bannedAt: users.bannedAt,
        deletedAt: users.deletedAt,
        isProvider: users.isProvider,
      },
      localityName: localities.name,
      county: localities.county,
    })
    .from(providerProfiles)
    .innerJoin(users, eq(users.id, providerProfiles.userId))
    .leftJoin(localities, eq(localities.id, providerProfiles.localityId))
    .where(eq(providerProfiles.slug, slug));
  return row ?? null;
});

function isVisible(row: NonNullable<Awaited<ReturnType<typeof loadProfile>>>) {
  const u = row.user;
  return row.profile.isPublic && u.isProvider && u.onboardedAt && u.emailVerifiedAt && !u.bannedAt && !u.deletedAt;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const row = await loadProfile(slug);
  if (!row || !isVisible(row)) return { title: "Prestator" };
  const title = `${row.user.name} — ${row.profile.headline}`;
  const description = truncate(row.profile.bio, 160);
  return { title, description, alternates: { canonical: `/prestatori/${slug}` }, openGraph: { title, description, type: "profile" } };
}

function Stars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value} din 5 stele`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`size-3.5 ${i <= Math.round(value) ? "fill-warning text-warning" : "text-muted-foreground/40"}`} />
      ))}
    </span>
  );
}

export default async function ProviderProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [row, viewer] = await Promise.all([loadProfile(decodeURIComponent(slug)), getCurrentUser()]);
  if (!row) notFound();
  const isOwner = viewer?.id === row.user.id;
  if (!isVisible(row) && !isOwner && viewer?.role !== "admin") notFound();
  const p = row.profile;
  const u = row.user;

  if (!isOwner && (await isFirstViewToday("profile", u.id, viewer?.id ?? null))) {
    await db
      .update(providerProfiles)
      .set({ profileViews: sql`${providerProfiles.profileViews} + 1` })
      .where(eq(providerProfiles.userId, u.id));
  }

  const [catalog, services, skillRows, catRows, portfolio, reviews] = await Promise.all([
    getCatalog(),
    db.select().from(providerServices).where(eq(providerServices.providerId, u.id)).orderBy(asc(providerServices.sortOrder)),
    db.select({ name: skills.name }).from(providerSkills).innerJoin(skills, eq(skills.id, providerSkills.skillId)).where(eq(providerSkills.providerId, u.id)),
    db.select({ id: providerCategories.categoryId }).from(providerCategories).where(eq(providerCategories.providerId, u.id)),
    db.select().from(portfolioItems).where(eq(portfolioItems.providerId, u.id)).orderBy(asc(portfolioItems.sortOrder)),
    reviewsFor(u.id, viewer?.id ?? null),
  ]);
  const categoriesList = catRows.map((c) => catalog.byId.get(c.id)).filter((c): c is NonNullable<typeof c> => Boolean(c));
  const price =
    p.pricingModel === "hourly" && p.hourlyRate
      ? `${p.hourlyRate} lei/oră`
      : p.minProjectBudget
        ? `Proiecte de la ${p.minProjectBudget.toLocaleString("ro-RO")} lei`
        : labels.pricingModel[p.pricingModel];
  const response = formatResponseTime(p.responseTimeMinutes);
  const langNames = p.languages.map((code) => LANGUAGES.find((l) => l.code === code)?.name ?? code.toUpperCase());

  return (
    <div className="container-page pt-6 pb-16 sm:pt-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/prestatori" className="hover:text-foreground">Prestatori</Link>
        {categoriesList[0] && (
          <>
            <span className="mx-2 text-border-strong">/</span>
            <Link href={`/categorii/${categoriesList[0].slug}`} className="hover:text-foreground">{categoriesList[0].name}</Link>
          </>
        )}
      </nav>

      {isOwner && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-brand/20 bg-brand-soft px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span>Acesta este profilul tău public{!isVisible(row) ? " (momentan nu este vizibil în căutări)" : ""}.</span>
          <div className="flex gap-2">
            <Button asChild size="sm">
              <Link href={`/prestatori/${p.slug}/card`}>Distribuie / cod QR</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/profil">Editează profilul</Link>
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-10">
          <header className="enter overflow-hidden rounded-[1.6rem] border bg-card shadow-sm">
            {/* Coperta încărcată de prestator sau, implicit, panoul „ink” cu auroră; avatarul o încalecă */}
            {p.coverPath ? (
              <div className="relative bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/files/${p.coverPath}`}
                  alt=""
                  fetchPriority="high"
                  decoding="async"
                  className="aspect-[12/5] w-full object-cover sm:aspect-[16/5] dark:brightness-[0.92]"
                />
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/25 via-black/0 to-black/0 dark:from-black/45" />
              </div>
            ) : (
              <div aria-hidden className="ink-panel h-28 sm:h-36">
                <div className="aurora aurora-a -top-40 -left-20 size-[420px]" />
                <div className="aurora aurora-b -right-24 -bottom-48 size-[380px] opacity-45" />
                <div className="aurora aurora-c top-[-60%] left-[45%] size-[300px] opacity-30" />
              </div>
            )}
            <div className="flex flex-col gap-5 px-6 pb-7 sm:flex-row sm:items-start sm:px-8">
            <Avatar className="-mt-12 size-24 shrink-0 shadow-lg ring-4 ring-card sm:-mt-14 sm:size-28">
              {u.avatarPath && <AvatarImage src={`/api/files/${u.avatarPath}`} alt={u.name} />}
              <AvatarFallback className="bg-[linear-gradient(140deg,#1c2f57,#2b4acb)] text-2xl font-semibold text-white">{initials(u.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-3 sm:pt-5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[2rem] leading-[1.05] font-semibold tracking-[-0.035em] sm:text-[2.5rem]">{u.name}</h1>
                {p.featuredUntil && p.featuredUntil > new Date() && <Badge variant="outline">Recomandat · Promovat</Badge>}
              </div>
              <p className="text-base leading-relaxed text-muted-foreground sm:text-[1.1875rem]">{p.headline}</p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
                {p.ratingCount > 0 && p.ratingAvg ? (
                  <a href="#recenzii" className="flex items-center gap-1.5">
                    <Stars value={p.ratingAvg} />
                    <strong>{p.ratingAvg.toFixed(1)}</strong>
                    <span className="text-muted-foreground">({p.ratingCount === 1 ? "1 recenzie" : `${p.ratingCount} recenzii`})</span>
                  </a>
                ) : (
                  <span className="text-muted-foreground">Fără recenzii încă</span>
                )}
                {p.completedCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="size-4 text-muted-foreground" /> {p.completedCount} colaborări finalizate
                  </span>
                )}
                {row.localityName && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-4 text-muted-foreground" /> {row.localityName}
                    {row.county ? `, ${row.county}` : ""}
                  </span>
                )}
              </div>
              <SocialLinks links={p.socialLinks} />
              <div className="flex flex-wrap gap-1.5 border-t pt-4">
                {u.emailVerifiedAt && (
                  <Badge variant="success" className="gap-1">
                    <Mail /> Email verificat
                  </Badge>
                )}
                {isPhoneVerified(u.phoneVerifiedAt) && (
                  <Badge variant="success" className="gap-1">
                    <BadgeCheck /> Telefon verificat
                  </Badge>
                )}
                {u.companyVerifiedAt && u.companyVerification ? (
                  <AnafBadge info={u.companyVerification} />
                ) : null}
                {u.legalEntity !== "none" && (
                  <Badge variant="outline" className="gap-1">
                    <Building2 /> {u.companyVerifiedAt && u.companyName ? u.companyName : labels.legalEntity[u.legalEntity]}
                    {u.companyCui ? ` · CUI ${u.companyCui}` : ""}
                  </Badge>
                )}
                {u.issuesInvoice && (
                  <Badge variant="outline" className="gap-1">
                    <Receipt /> Emite factură
                  </Badge>
                )}
                <Badge variant={p.availability === "available" ? "secondary" : "outline"}>{labels.availability[p.availability]}</Badge>
              </div>
            </div>
            </div>
          </header>

          <section className="space-y-3">
            <h2 className="text-[1.375rem] font-semibold tracking-[-0.025em]">Despre</h2>
            <p className="max-w-prose text-[0.9375rem] leading-[1.7] whitespace-pre-line text-foreground/90">{p.bio}</p>
            {p.certifications && (
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Certificări:</strong> {p.certifications}
              </p>
            )}
          </section>

          {services.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-[1.375rem] font-semibold tracking-[-0.025em]">Servicii</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {services.map((s) => (
                  <div key={s.id} className="lift flex flex-col rounded-2xl border bg-card p-5 shadow-xs">
                    <div className="eyebrow">{catalog.byId.get(s.categoryId)?.name}</div>
                    <div className="mt-1.5 font-semibold">{s.title}</div>
                    {s.description && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{truncate(s.description, 220)}</p>}
                    {s.priceFrom !== null && (
                      <div className="mt-auto pt-3 text-sm font-semibold tabular-nums">
                        de la {s.priceFrom.toLocaleString("ro-RO")} lei / {labels.priceUnit[s.priceUnit]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {(skillRows.length > 0 || categoriesList.length > 0) && (
            <section className="space-y-3">
              <h2 className="text-[1.375rem] font-semibold tracking-[-0.025em]">Competențe</h2>
              <div className="flex flex-wrap gap-1.5">
                {categoriesList.map((c) => (
                  <Badge key={`c-${c.id}`} asChild variant="outline">
                    <Link href={`/categorii/${c.slug}`}>{c.name}</Link>
                  </Badge>
                ))}
                {skillRows.map((s) => (
                  <Badge key={s.name} variant="secondary">{s.name}</Badge>
                ))}
              </div>
            </section>
          )}

          {portfolio.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-[1.375rem] font-semibold tracking-[-0.025em]">Portofoliu</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {portfolio.map((item) => (
                  <div key={item.id} className="lift group/pf overflow-hidden rounded-2xl border bg-card shadow-xs">
                    {item.imagePath ? (
                      <div className="overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/files/${item.imagePath}`}
                          alt={item.title}
                          className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-out group-hover/pf:scale-[1.04]"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center bg-muted text-muted-foreground">
                        <Globe className="size-6" />
                      </div>
                    )}
                    <div className="space-y-1 p-4">
                      <div className="text-sm font-semibold">{item.title}</div>
                      {item.description && <p className="text-xs text-muted-foreground">{truncate(item.description, 140)}</p>}
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 pt-1 text-xs font-medium text-brand underline-offset-4 hover:underline">
                          Vezi lucrarea <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section id="recenzii" className="scroll-mt-20 space-y-4">
            <h2 className="text-[1.375rem] font-semibold tracking-[-0.025em]">Recenzii verificate</h2>
            <p className="-mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><BadgeCheck className="size-3.5 text-success" /> Doar clienții care au confirmat o colaborare pe platformă pot lăsa recenzii.</p>
            {reviews.length === 0 ? (
              <EmptyState title="Nicio recenzie încă" description="Recenziile apar după prima colaborare confirmată." />
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r.id} className="reveal relative overflow-hidden rounded-2xl border bg-card p-6 shadow-xs">
                    <span aria-hidden className="serif-em pointer-events-none absolute -top-4 right-4 text-[6rem] leading-none text-foreground/[0.06]">
                      „
                    </span>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Stars value={r.rating} />
                      <span className="font-medium">{r.authorName}</span>
                      {r.authorHidden && <BadgeCheck className="size-3.5 text-success" aria-label={r.authorName} />}
                      <span className="text-xs text-muted-foreground">· {timeAgo(r.createdAt)}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">Proiect: {r.projectTitle}</div>
                    {r.comment && <p className="mt-3 text-sm leading-relaxed whitespace-pre-line">{r.comment}</p>}
                    {r.reply && (
                      <div className="mt-4 flex gap-2.5 rounded-lg bg-muted/70 p-3.5 text-sm">
                        <MessageSquareReply className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <div>
                          <div className="text-xs font-medium">Răspunsul lui {u.name.split(" ")[0]}</div>
                          <p className="whitespace-pre-line">{r.reply}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card className="relative overflow-hidden rounded-[1.4rem]">
            <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--primary),var(--brand),#38bdf8)]" />
            <CardHeader>
              <div className="eyebrow">Tarif</div>
              <CardTitle className="text-[1.875rem] leading-tight tracking-[-0.035em] tabular-nums">{price}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <ul className="space-y-2.5 border-t pt-4">
                <li className="flex items-center gap-2">
                  <MapPin className="size-4 text-muted-foreground" />
                  {p.onSite ? `Se deplasează până la ${p.travelRadiusKm} km` : "Nu lucrează la fața locului"}
                </li>
                <li className="flex items-center gap-2">
                  <Globe className="size-4 text-muted-foreground" />
                  {p.remote ? "Lucrează și remote" : "Doar la fața locului"}
                </li>
                {p.yearsExperience !== null && (
                  <li className="flex items-center gap-2">
                    <Briefcase className="size-4 text-muted-foreground" /> {p.yearsExperience} ani de experiență
                  </li>
                )}
                {response && (
                  <li className="flex items-center gap-2">
                    <Timer className="size-4 text-muted-foreground" /> {response.charAt(0).toUpperCase() + response.slice(1)}
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <Languages className="size-4 text-muted-foreground" /> {langNames.join(", ")}
                </li>
                {p.hoursPerWeek && (
                  <li className="flex items-center gap-2">
                    <CalendarDays className="size-4 text-muted-foreground" /> ~{p.hoursPerWeek} ore/săptămână disponibile
                  </li>
                )}
                <li className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="size-4" /> Membru din {formatDate(u.createdAt, "MMMM yyyy")}
                </li>
              </ul>
              {p.websiteUrl && (
                <a href={p.websiteUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 font-medium text-brand underline-offset-4 hover:underline">
                  Website <ExternalLink className="size-3.5" />
                </a>
              )}
              {!isOwner && (
                <div className="space-y-2.5 border-t pt-4">
                  <Button asChild size="lg" className="h-12 w-full rounded-xl">
                    <Link href="/proiecte/nou">Publică un proiect și invită-l</Link>
                  </Button>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Publicarea e gratuită. Prestatorii compatibili cu cererea ta, inclusiv {u.name.split(" ")[0]}, primesc proiectul și îți trimit oferte.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          {!isOwner && (
            <div className="flex justify-center">
              <ReportDialog targetType="user" targetId={u.id} signedIn={Boolean(viewer)} label="Raportează profilul" />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
