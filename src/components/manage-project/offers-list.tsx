"use client";

import { BadgeCheck, Bot, CheckCircle2, MapPin, MessageSquare, Receipt, Sparkles, Star, ThumbsDown, Trophy } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { hireAction, rejectAction, shortlistAction } from "@/app/proiectele-mele/[id]/actions";
import { ContactDetails } from "@/components/shared/contact-details";
import { NativeSelect } from "@/components/shared/native-select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { labels } from "@/config/site";
import { formatDistance, formatRating, initials, timeAgo } from "@/lib/format";
import { pluralRo } from "@/lib/text";
import { cn } from "@/lib/utils";
import type { OfferView } from "./types";

type Sort = "date" | "price_asc" | "price_desc" | "rating";
const ACTIVE = ["submitted", "viewed", "shortlisted"];

function priceLabel(o: OfferView) {
  if (!o.priceAmount) return labels.priceType[o.priceType];
  const unit = o.priceType === "hourly" ? " lei/oră" : o.priceType === "monthly" ? " lei/lună" : " lei";
  return `${o.priceAmount.toLocaleString("ro-RO")}${unit}`;
}

function statusTone(status: OfferView["status"]) {
  if (status === "hired") return "border-success/25 bg-success/8 text-success";
  if (status === "shortlisted") return "border-warning/30 bg-warning/10 text-warning";
  if (status === "rejected" || status === "withdrawn" || status === "refunded") return "border-border bg-muted text-muted-foreground";
  return "border-border bg-secondary text-secondary-foreground";
}

export function OffersList({ offers, projectOpen, highlight }: { offers: OfferView[]; projectOpen: boolean; highlight?: Record<string, boolean> }) {
  const [invoiceOnly, setInvoiceOnly] = useState(false);
  const [manualOnly, setManualOnly] = useState(false);
  const [hideClosed, setHideClosed] = useState(false);
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [sort, setSort] = useState<Sort>("date");
  const [rejecting, setRejecting] = useState<OfferView | null>(null);
  const [reason, setReason] = useState("");
  const [hiring, setHiring] = useState<OfferView | null>(null);
  const [pending, start] = useTransition();

  const filtered = useMemo(() => {
    const max = Number(maxPrice) || null;
    const minR = Number(minRating) || null;
    const list = offers.filter((o) => {
      if (invoiceOnly && !o.provider.issuesInvoice) return false;
      if (manualOnly && o.isAuto) return false;
      if (hideClosed && !ACTIVE.includes(o.status) && o.status !== "hired") return false;
      if (max && o.priceAmount && o.priceAmount > max) return false;
      if (minR && (o.provider.ratingAvg ?? 0) < minR) return false;
      return true;
    });
    const price = (o: OfferView) => o.priceAmount ?? Number.POSITIVE_INFINITY;
    return [...list].sort((a, b) => {
      if (sort === "price_asc") return price(a) - price(b);
      if (sort === "price_desc") return (b.priceAmount ?? -1) - (a.priceAmount ?? -1);
      if (sort === "rating") return (b.provider.ratingAvg ?? 0) - (a.provider.ratingAvg ?? 0);
      // implicit: lista scurtă și evidențiate sus, apoi cele mai noi
      const rank = (o: OfferView) => (o.status === "hired" ? 0 : o.status === "shortlisted" ? 1 : ACTIVE.includes(o.status) ? 2 : 3);
      return rank(a) - rank(b) || Number(b.boosted) - Number(a.boosted) || b.createdAt.localeCompare(a.createdAt);
    });
  }, [offers, invoiceOnly, manualOnly, hideClosed, maxPrice, minRating, sort]);

  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string } | null>, after?: () => void) =>
    start(async () => {
      const res = await fn();
      if (res?.ok) {
        if (res.message) toast.success(res.message);
        after?.();
      } else if (res) toast.error(res.error ?? "Eroare");
    });

  return (
    <div className="space-y-4">
      <div className="space-y-4 rounded-2xl border bg-card p-4 shadow-xs sm:p-5">
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={invoiceOnly} onCheckedChange={setInvoiceOnly} /> Doar cu factură
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={manualOnly} onCheckedChange={setManualOnly} /> Doar manuale
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={hideClosed} onCheckedChange={setHideClosed} /> Ascunde respinse
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Input inputMode="numeric" placeholder="Preț maxim (lei)" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value.replace(/[^\d]/g, ""))} aria-label="Preț maxim" />
          <NativeSelect value={minRating} onChange={(e) => setMinRating(e.target.value)} aria-label="Rating minim">
            <option value="">Orice rating</option>
            <option value="4">4★ sau mai mult</option>
            <option value="4.5">4,5★ sau mai mult</option>
          </NativeSelect>
          <NativeSelect value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sortare">
            <option value="date">Recomandate</option>
            <option value="price_asc">Preț crescător</option>
            <option value="price_desc">Preț descrescător</option>
            <option value="rating">Rating</option>
          </NativeSelect>
        </div>
      </div>

      {filtered.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nicio ofertă nu corespunde filtrelor.</p>}

      {filtered.map((o) => {
        const p = o.provider;
        const active = ACTIVE.includes(o.status);
        return (
          <article
            key={o.id}
            className={cn(
              "min-w-0 space-y-4 rounded-2xl border bg-card p-5 shadow-xs [overflow-wrap:anywhere] sm:p-6",
              o.boosted && active && "border-brand/35",
              o.status === "hired" && "border-success/40",
              highlight?.[o.id] && "ring-2 ring-brand/40",
              !active && o.status !== "hired" && "opacity-70",
            )}
          >
            <div className="flex gap-3">
              <Avatar className="size-11 shrink-0">
                {p.avatarPath && <AvatarImage src={`/api/files/${p.avatarPath}`} alt="" />}
                <AvatarFallback>{initials(p.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {p.slug ? (
                    <Link href={`/prestatori/${p.slug}`} className="font-semibold underline-offset-4 hover:underline" target="_blank">
                      {p.name}
                    </Link>
                  ) : (
                    <span className="font-semibold">{p.name}</span>
                  )}
                  {p.phoneVerified && <BadgeCheck className="size-4 text-success" aria-label="Telefon verificat" />}
                  {p.ratingCount > 0 && p.ratingAvg && (
                    <span className="flex items-center gap-0.5 text-sm">
                      <Star className="size-3.5 fill-warning text-warning" /> {formatRating(p.ratingAvg)}
                      <span className="text-muted-foreground">({p.ratingCount})</span>
                    </span>
                  )}
                  <span className={cn("inline-flex h-[22px] items-center rounded-md border px-2 text-xs font-medium", statusTone(o.status))}>{labels.applicationStatus[o.status]}</span>
                  {o.isNew && <Badge variant="brand">Nouă</Badge>}
                </div>
                {p.headline && <p className="truncate text-sm text-muted-foreground">{p.headline}</p>}
              </div>
              <div className="text-right">
                <div className="text-base font-semibold tabular-nums">{priceLabel(o)}</div>
                {o.estimatedDays && <div className="text-xs text-muted-foreground">~{o.estimatedDays} zile</div>}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {o.isAuto && (
                <Badge variant="outline" className="gap-1" title="Trimisă automat, după regulile aprobate de prestator">
                  <Bot /> Automată
                </Badge>
              )}
              {o.boosted && (
                <Badge variant="brand" className="gap-1">
                  <Sparkles /> Evidențiată
                </Badge>
              )}
              {p.issuesInvoice && (
                <Badge variant="outline" className="gap-1">
                  <Receipt /> Factură{p.legalEntity !== "none" ? ` · ${labels.legalEntity[p.legalEntity]}` : ""}
                </Badge>
              )}
              {p.distanceKm != null && (
                <Badge variant="outline" className="gap-1">
                  <MapPin /> {formatDistance(p.distanceKm)}
                </Badge>
              )}
              {p.completedCount > 0 && <Badge variant="secondary">{pluralRo(p.completedCount, "colaborare", "colaborări")}</Badge>}
              <span suppressHydrationWarning className="ml-auto text-xs text-muted-foreground">{timeAgo(o.createdAt)}</span>
            </div>

            <p className="text-sm leading-relaxed [overflow-wrap:anywhere] whitespace-pre-line">{o.message}</p>
            {o.status === "rejected" && o.rejectionReason && <p className="text-xs text-muted-foreground">Motiv: {o.rejectionReason}</p>}
            {o.contact && <ContactDetails contact={o.contact} label="Contact prestator" />}
            {o.status === "hired" && !o.contact && (
              <p className="text-xs text-muted-foreground">Telefonul și emailul prestatorului apar aici după ce confirmă colaborarea.</p>
            )}

            <div className="flex flex-wrap gap-2 border-t pt-4">
              {o.conversationId && (
                <Button asChild size="sm" variant={active ? "default" : "outline"}>
                  <Link href={`/mesaje/${o.conversationId}`}>
                    <MessageSquare /> Discută în chat
                  </Link>
                </Button>
              )}
              {active && projectOpen && (
                <>
                  <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => shortlistAction(o.id, o.status !== "shortlisted"))}>
                    <Star className={cn(o.status === "shortlisted" && "fill-warning text-warning")} />
                    {o.status === "shortlisted" ? "Scoate de pe lista scurtă" : "Listă scurtă"}
                  </Button>
                  <Button size="sm" variant="outline" disabled={pending} onClick={() => setHiring(o)}>
                    <Trophy /> Alege acest prestator
                  </Button>
                  <Button size="sm" variant="ghost" className="text-muted-foreground" disabled={pending} onClick={() => setRejecting(o)}>
                    <ThumbsDown /> Respinge
                  </Button>
                </>
              )}
            </div>
          </article>
        );
      })}

      <Dialog open={rejecting !== null} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respingi oferta lui {rejecting?.provider.name}?</DialogTitle>
            <DialogDescription>Prestatorul va fi anunțat. Un motiv scurt îl ajută să facă oferte mai bune data viitoare.</DialogDescription>
          </DialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} placeholder="Opțional: ex. prețul depășește bugetul, am nevoie de cineva mai aproape" />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Renunță</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() =>
                rejecting &&
                run(
                  () => rejectAction(rejecting.id, reason),
                  () => {
                    setRejecting(null);
                    setReason("");
                  },
                )
              }
            >
              Respinge oferta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={hiring !== null} onOpenChange={(open) => !open && setHiring(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alegi pe {hiring?.provider.name}?</DialogTitle>
            <DialogDescription>
              Proiectul trece „în desfășurare” și nu mai primește oferte noi. Ceilalți prestatori vor fi anunțați politicos că ai ales pe altcineva. După
              confirmarea colaborării de către prestator, vă puteți lăsa recenzii unul altuia.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Mai compar</Button>
            </DialogClose>
            <Button disabled={pending} onClick={() => hiring && run(() => hireAction(hiring.id), () => setHiring(null))}>
              <CheckCircle2 /> Da, aleg acest prestator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
