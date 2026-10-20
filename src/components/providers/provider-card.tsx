import { BadgeCheck, MapPin, Receipt, ShieldCheck, Star, Timer } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { labels } from "@/config/site";
import { formatDistance, formatResponseTime, initials } from "@/lib/format";
import { truncate } from "@/lib/text";

export type ProviderCardData = {
  profile: {
    slug: string;
    headline: string;
    bio: string;
    hourlyRate: number | null;
    minProjectBudget: number | null;
    pricingModel: "hourly" | "fixed" | "quote";
    remote: boolean;
    onSite: boolean;
    travelRadiusKm: number;
    ratingAvg: number | null;
    ratingCount: number;
    completedCount: number;
    availability: "available" | "busy" | "unavailable";
    responseTimeMinutes: number | null;
    yearsExperience: number | null;
  };
  name: string;
  avatarPath: string | null;
  issuesInvoice: boolean;
  legalEntity: "none" | "pfa" | "ii" | "srl" | "other";
  phoneVerified: boolean;
  companyVerified?: boolean;
  localityName: string | null;
  countyCode: string | null;
  distanceKm: number | null;
  boosted?: boolean;
};

export function ProviderCard({ data, promoted }: { data: ProviderCardData; promoted?: boolean }) {
  const p = data.profile;
  const price =
    p.pricingModel === "hourly" && p.hourlyRate
      ? `${p.hourlyRate} lei/oră`
      : p.minProjectBudget
        ? `proiecte de la ${p.minProjectBudget.toLocaleString("ro-RO")} lei`
        : labels.pricingModel[p.pricingModel];
  const response = formatResponseTime(p.responseTimeMinutes);
  return (
    <Link
      href={`/prestatori/${p.slug}`}
      className="group flex gap-4 rounded-xl border bg-card p-5 shadow-xs lift sm:p-6"
    >
      <Avatar className="size-12 shrink-0">
        {data.avatarPath && <AvatarImage src={`/api/files/${data.avatarPath}`} alt="" />}
        <AvatarFallback>{initials(data.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="text-[1.0625rem] font-semibold tracking-[-0.012em]">{data.name}</h3>
          {data.phoneVerified && <BadgeCheck className="size-4 text-success" aria-label="Telefon verificat" />}
          {promoted && <Badge variant="outline" className="h-[18px] px-1.5 text-[10px] tracking-[0.06em] text-muted-foreground uppercase">Promovat</Badge>}
          {p.ratingCount > 0 && p.ratingAvg && (
            <span className="flex items-center gap-1 text-sm font-medium tabular-nums">
              <Star className="size-3.5 fill-warning text-warning" /> {p.ratingAvg.toFixed(1)}
              <span className="font-normal text-muted-foreground">({p.ratingCount})</span>
            </span>
          )}
          <span className="ml-auto text-sm font-semibold tabular-nums">{price}</span>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{p.headline}</p>
        <p className="mt-2 hidden text-sm leading-relaxed text-muted-foreground sm:block">{truncate(p.bio, 160)}</p>
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {data.localityName && (
            <Badge variant="outline" className="gap-1">
              <MapPin /> {data.localityName}
              {data.distanceKm != null && <span className="text-muted-foreground">· {formatDistance(data.distanceKm)}</span>}
            </Badge>
          )}
          {p.remote && <Badge variant="outline">Remote</Badge>}
          {p.onSite && <Badge variant="outline">Se deplasează {p.travelRadiusKm} km</Badge>}
          {data.companyVerified && (
            <Badge variant="success" className="gap-1">
              <ShieldCheck /> Verificat ANAF
            </Badge>
          )}
          {data.issuesInvoice && (
            <Badge variant="outline" className="gap-1">
              <Receipt /> Emite factură{data.legalEntity !== "none" ? ` (${labels.legalEntity[data.legalEntity]})` : ""}
            </Badge>
          )}
          {p.completedCount > 0 && <Badge variant="secondary">{p.completedCount} colaborări</Badge>}
          {response && (
            <Badge variant="secondary" className="gap-1">
              <Timer /> {response}
            </Badge>
          )}
          {p.availability === "busy" && <Badge variant="warning">Ocupat parțial</Badge>}
        </div>
      </div>
    </Link>
  );
}
