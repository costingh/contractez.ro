import { socialLinkList, type SocialLinks } from "./social-links";

/**
 * Completitudinea profilului de prestator, afișată în panou după onboarding.
 * Funcție pură: datele vin dintr-o singură interogare (`getProfileCompletion`).
 */

export type ProfileCompletionInput = {
  avatarPath: string | null;
  coverPath: string | null;
  websiteUrl: string | null;
  socialLinks: SocialLinks | null;
  hasPortfolio: boolean;
  hasServices: boolean;
};

export type ProfileCompletionKey = "avatar" | "cover" | "services" | "portfolio" | "links";

export type ProfileCompletionItem = { key: ProfileCompletionKey; label: string; href: string; done: boolean };

export type ProfileCompletion = {
  items: ProfileCompletionItem[];
  missing: ProfileCompletionItem[];
  done: number;
  total: number;
  complete: boolean;
};

export function profileCompletion(p: ProfileCompletionInput): ProfileCompletion {
  const items: ProfileCompletionItem[] = [
    { key: "avatar", label: "Adaugă o poză de profil", href: "/profil#date", done: Boolean(p.avatarPath) },
    { key: "cover", label: "Adaugă o imagine de copertă", href: "/profil#coperta", done: Boolean(p.coverPath) },
    { key: "services", label: "Adaugă un serviciu cu preț orientativ", href: "/profil#servicii", done: p.hasServices },
    { key: "portfolio", label: "Adaugă o lucrare în portofoliu", href: "/profil#portofoliu", done: p.hasPortfolio },
    {
      key: "links",
      label: "Adaugă LinkedIn, site-ul sau portofoliul online — profilurile complete primesc mai multe răspunsuri",
      href: "/profil#linkuri",
      done: Boolean(p.websiteUrl?.trim()) || socialLinkList(p.socialLinks).length > 0,
    },
  ];
  const missing = items.filter((i) => !i.done);
  const done = items.length - missing.length;
  return { items, missing, done, total: items.length, complete: missing.length === 0 };
}
