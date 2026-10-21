import { describe, expect, it } from "vitest";
import { profileCompletion, type ProfileCompletionInput } from "@/lib/profile-completion";

const empty: ProfileCompletionInput = {
  avatarPath: null,
  coverPath: null,
  websiteUrl: null,
  socialLinks: {},
  hasPortfolio: false,
  hasServices: false,
};

const full: ProfileCompletionInput = {
  avatarPath: "avatars/a.webp",
  coverPath: "covers/c.webp",
  websiteUrl: "https://exemplu.ro",
  socialLinks: { linkedin: "https://www.linkedin.com/in/ana-pop" },
  hasPortfolio: true,
  hasServices: true,
};

const missingKeys = (p: ProfileCompletionInput) => profileCompletion(p).missing.map((i) => i.key);

describe("profileCompletion", () => {
  it("profilul gol are toți pașii lipsă, în ordine", () => {
    const c = profileCompletion(empty);
    expect(c.done).toBe(0);
    expect(c.total).toBe(5);
    expect(c.complete).toBe(false);
    expect(c.missing.map((i) => i.key)).toEqual(["avatar", "cover", "services", "portfolio", "links"]);
  });

  it("profilul complet nu mai are pași lipsă", () => {
    const c = profileCompletion(full);
    expect(c).toMatchObject({ done: 5, total: 5, complete: true, missing: [] });
  });

  it("numără pașii făcuți", () => {
    const c = profileCompletion({ ...empty, avatarPath: "a.webp", hasServices: true, hasPortfolio: true });
    expect(c.done).toBe(3);
    expect(c.missing.map((i) => i.key)).toEqual(["cover", "links"]);
  });

  it("linkurile: ajunge site-ul SAU o rețea socială", () => {
    expect(missingKeys({ ...full, socialLinks: {} })).not.toContain("links");
    expect(missingKeys({ ...full, websiteUrl: null })).not.toContain("links");
    expect(missingKeys({ ...full, websiteUrl: null, socialLinks: null })).toContain("links");
  });

  it("ignoră site-ul gol și linkurile sociale invalide", () => {
    expect(missingKeys({ ...full, websiteUrl: "   ", socialLinks: {} })).toContain("links");
    expect(missingKeys({ ...full, websiteUrl: null, socialLinks: { linkedin: "https://evil.example/in/x" } })).toContain("links");
  });

  it("fiecare pas duce la secțiunea potrivită din /profil", () => {
    const hrefs = Object.fromEntries(profileCompletion(empty).items.map((i) => [i.key, i.href]));
    expect(hrefs).toEqual({
      avatar: "/profil#date",
      cover: "/profil#coperta",
      services: "/profil#servicii",
      portfolio: "/profil#portofoliu",
      links: "/profil#linkuri",
    });
  });
});
