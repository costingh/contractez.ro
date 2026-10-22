import { Briefcase, Clock, Globe2, Languages, MapPin, Receipt, Star, Wallet } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnafBadge } from "@/components/shared/anaf-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { labels, site } from "@/config/site";
import { formatRating, initials } from "@/lib/format";
import { getCurrentUser } from "@/server/auth/session";
import { cardPrice, getPublicCard } from "@/server/providers/public-card";
import { profileShortUrl, qrDataUrl } from "@/server/share";
import { ShareActions } from "./share-actions";

const LANG: Record<string, string> = { ro: "RO", en: "EN", de: "DE", fr: "FR", it: "IT", es: "ES", hu: "HU" };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await getPublicCard(slug);
  if (!c) return { title: "Profil indisponibil" };
  return {
    title: `${c.name} — card de prezentare`,
    description: `${c.profile.headline}. Vezi profilul complet pe ${site.name}.`,
    openGraph: { images: [`/prestatori/${slug}/opengraph-image`] },
  };
}

function Row({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" /> {label}
      </span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export default async function ProfileCardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const card = await getPublicCard(slug);
  if (!card) notFound();
  const user = await getCurrentUser();
  const isOwner = user?.id === card.profile.userId;
  const p = card.profile;
  const shortUrl = profileShortUrl(slug);
  const qr = await qrDataUrl(shortUrl, 320);
  const location = [card.localityName, card.countyCode].filter(Boolean).join(", ");

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-12">
        {/* Cardul (se printează singur) */}
        <article
          id="card"
          className="enter mx-auto w-full max-w-[420px] overflow-hidden rounded-[1.75rem] border bg-card shadow-[0_40px_80px_-40px_rgb(13_22_38/0.45)] print:shadow-none"
        >
          <div className="ink-panel flex items-center justify-between px-6 py-5 print:bg-white print:text-black">
            <div aria-hidden className="aurora aurora-a -top-24 -left-16 size-[260px] print:hidden" />
            <div aria-hidden className="aurora aurora-b -right-20 -bottom-28 size-[240px] opacity-50 print:hidden" />
            <Logo tone="ink" className="relative text-lg" markClassName="size-7 print:hidden" />
            <span className="text-xs text-white/70 print:text-black">Card de prezentare</span>
          </div>
          <div className="flex items-start justify-between gap-4 px-6 pt-6">
            <div className="min-w-0">
              <h1 className="text-[1.625rem] leading-tight font-semibold tracking-[-0.03em]">{card.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {card.companyVerifiedAt && card.companyName ? card.companyName : labels.legalEntity[card.legalEntity]}
              </p>
            </div>
            <Avatar className="size-16 shrink-0 ring-4 ring-brand-soft">
              {card.avatarPath && <AvatarImage src={`/api/files/${card.avatarPath}`} alt="" />}
              <AvatarFallback className="bg-[linear-gradient(140deg,#1c2f57,#2b4acb)] text-lg font-semibold text-white">{initials(card.name)}</AvatarFallback>
            </Avatar>
          </div>
          <p className="border-b px-6 pt-4 pb-5 text-center text-[15px] text-foreground/80">{p.headline}</p>
          <div className="divide-y px-6 py-2">
            <div className="py-1">
              {location && <Row icon={MapPin} label="Locație" value={location} />}
              <Row icon={Globe2} label="Lucrează" value={[p.remote && "Remote", p.onSite && `Deplasare ${p.travelRadiusKm} km`].filter(Boolean).join(" · ") || "—"} />
              {p.yearsExperience ? <Row icon={Briefcase} label="Experiență" value={`${p.yearsExperience} ani`} /> : null}
              <Row icon={Languages} label="Limbi" value={p.languages.map((l) => LANG[l] ?? l.toUpperCase()).join(", ")} />
            </div>
            <div className="py-1">
              <Row icon={Wallet} label="Onorariu" value={cardPrice(card)} />
              {p.hoursPerWeek ? <Row icon={Clock} label="Disponibilitate" value={`${p.hoursPerWeek} ore / săptămână`} /> : <Row icon={Clock} label="Disponibilitate" value={labels.availability[p.availability]} />}
              <Row icon={Receipt} label="Factură" value={card.issuesInvoice ? "Da" : "Nu"} />
              {p.ratingCount > 0 && p.ratingAvg ? (
                <Row icon={Star} label="Recenzii" value={`${formatRating(p.ratingAvg)} ★ (${p.ratingCount})`} />
              ) : null}
            </div>
          </div>
          {card.skills.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 px-6 pb-4">
              {card.skills.slice(0, 6).map((s) => (
                <span key={s} className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium">
                  {s}
                </span>
              ))}
            </div>
          )}
          {card.companyVerifiedAt && card.companyVerification && (
            <div className="flex justify-center pb-4">
              <AnafBadge info={card.companyVerification} />
            </div>
          )}
          <div className="flex items-center gap-4 border-t bg-muted/40 px-6 py-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="Cod QR către profil" className="size-24 rounded-lg bg-white p-1" />
            <div className="min-w-0 text-sm">
              <div className="font-medium">Scanează pentru profil, recenzii și contact</div>
              <div className="mt-1 truncate text-xs text-muted-foreground">{shortUrl.replace(/^https?:\/\//, "")}</div>
            </div>
          </div>
        </article>

        {/* Acțiuni */}
        <div className="enter space-y-6 print:hidden lg:pt-6" style={{ "--i": 2 } as React.CSSProperties}>
          <div>
            <div className="eyebrow">Card cu cod QR</div>
            <h2 className="display-md mt-3">
              {isOwner ? (
                <>
                  Distribuie-ți profilul <span className="serif-em text-gradient">oriunde</span>.
                </>
              ) : (
                `Profilul lui ${card.name.split(" ")[0]}`
              )}
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              {isOwner
                ? "Pune linkul în grupurile de Facebook, pe WhatsApp sau tipărește codul QR pe cartea de vizită, pe mașină sau pe ofertele tale. Când cineva îl deschide, vede profilul complet, portofoliul și recenziile."
                : "Vezi profilul complet, portofoliul și recenziile verificate."}
            </p>
          </div>
          <ShareActions url={shortUrl} slug={slug} name={card.name} headline={p.headline} isOwner={isOwner} />
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/prestatori/${slug}`}>Vezi profilul complet</Link>
            </Button>
            {isOwner && (
              <Button asChild variant="ghost">
                <Link href="/profil">Editează datele de pe card</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
