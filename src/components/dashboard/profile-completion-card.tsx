import { ArrowRight, Camera, Images, Link2, type LucideIcon, Tag, UserRoundCheck, Wallpaper } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProfileCompletion, ProfileCompletionKey } from "@/lib/profile-completion";

const icons: Record<ProfileCompletionKey, LucideIcon> = {
  avatar: Camera,
  cover: Wallpaper,
  services: Tag,
  portfolio: Images,
  links: Link2,
};

/** „Completează-ți profilul”: pașii lipsă după onboarding, fiecare cu link spre secțiunea din /profil. */
export function ProfileCompletionCard({ completion }: { completion: ProfileCompletion }) {
  if (completion.complete) return null;
  const { done, total, missing } = completion;
  const pct = Math.round((done / total) * 100);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserRoundCheck className="size-4 text-brand" /> Completează-ți profilul
          <span className="ml-auto text-xs font-medium text-muted-foreground tabular-nums">
            {done} din {total}
          </span>
        </CardTitle>
        <CardDescription>Clienții aleg mai ușor un profil cu poze, lucrări și linkuri.</CardDescription>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted dark:bg-secondary"
          role="progressbar"
          aria-label="Profil completat"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-valuetext={`${done} din ${total}`}
        >
          <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
        </div>
      </CardHeader>
      <CardContent>
        <ul className="-mx-2 space-y-0.5">
          {missing.map((item) => {
            const Icon = icons[item.key];
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="group flex items-start gap-2.5 rounded-lg px-2 py-2 text-sm leading-snug transition-colors hover:bg-muted"
                >
                  <span className="mt-px flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-foreground/70 group-hover:bg-background">
                    <Icon className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1 pt-0.5">{item.label}</span>
                  <ArrowRight className="mt-1 size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
