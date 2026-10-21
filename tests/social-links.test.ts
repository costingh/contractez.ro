import { describe, expect, it } from "vitest";
import { hostMatches, normalizeSocialUrl, socialLinkList, type SocialKey } from "@/lib/social-links";

const ok = (key: SocialKey, raw: string) => {
  const r = normalizeSocialUrl(key, raw);
  if (!r.ok) throw new Error(`${key} „${raw}”: ${r.error}`);
  return r.url;
};
const err = (key: SocialKey, raw: string) => {
  const r = normalizeSocialUrl(key, raw);
  if (r.ok) throw new Error(`${key} „${raw}” trebuia respins, a dat ${r.url}`);
  return r.error;
};

describe("normalizeSocialUrl", () => {
  it("câmpul gol înseamnă ștergerea linkului", () => {
    expect(ok("linkedin", "")).toBeNull();
    expect(ok("instagram", "   ")).toBeNull();
  });

  it("acceptă linkuri https complete și le normalizează", () => {
    expect(ok("linkedin", "https://www.linkedin.com/in/ana-pop/")).toBe("https://www.linkedin.com/in/ana-pop");
    expect(ok("linkedin", "https://RO.LinkedIn.com/company/firma-mea")).toBe("https://ro.linkedin.com/company/firma-mea");
    expect(ok("github", "  https://github.com/ana-pop#readme ")).toBe("https://github.com/ana-pop");
    expect(ok("facebook", "https://m.facebook.com/profile.php?id=1000123&fbclid=abc")).toBe("https://m.facebook.com/profile.php?id=1000123");
    expect(ok("instagram", "https://www.instagram.com/ana.pop/?igsh=xyz&utm_source=qr")).toBe("https://www.instagram.com/ana.pop");
    expect(ok("youtube", "https://www.youtube.com/@AnaPop?si=123")).toBe("https://www.youtube.com/@AnaPop");
    expect(ok("behance", "https://www.behance.net/anapop")).toBe("https://www.behance.net/anapop");
    expect(ok("dribbble", "https://dribbble.com/anapop")).toBe("https://dribbble.com/anapop");
    expect(ok("tiktok", "https://www.tiktok.com/@ana.pop")).toBe("https://www.tiktok.com/@ana.pop");
    expect(ok("facebook", "https://fb.com/anapopdesign")).toBe("https://fb.com/anapopdesign");
  });

  it("adaugă https:// la linkurile scrise fără protocol", () => {
    expect(ok("linkedin", "linkedin.com/in/ana-pop")).toBe("https://linkedin.com/in/ana-pop");
    expect(ok("linkedin", "in/ana-pop")).toBe("https://linkedin.com/in/ana-pop");
    expect(ok("instagram", "www.instagram.com/ana.pop")).toBe("https://www.instagram.com/ana.pop");
  });

  it("transformă numele de utilizator în linkul profilului", () => {
    expect(ok("instagram", "@nume")).toBe("https://www.instagram.com/nume");
    expect(ok("instagram", "@ana.pop")).toBe("https://www.instagram.com/ana.pop");
    expect(ok("tiktok", "@ana.pop")).toBe("https://www.tiktok.com/@ana.pop");
    expect(ok("tiktok", "anapop")).toBe("https://www.tiktok.com/@anapop");
    expect(ok("tiktok", "ana.pop")).toBe("https://www.tiktok.com/@ana.pop");
    expect(ok("instagram", "ana.pop")).toBe("https://www.instagram.com/ana.pop");
    expect(ok("youtube", "@canalulmeu")).toBe("https://www.youtube.com/@canalulmeu");
    expect(ok("github", "ana-pop")).toBe("https://github.com/ana-pop");
    expect(ok("linkedin", "ana-pop")).toBe("https://www.linkedin.com/in/ana-pop");
    expect(ok("behance", "@anapop")).toBe("https://www.behance.net/anapop");
    expect(ok("dribbble", "anapop")).toBe("https://dribbble.com/anapop");
    expect(ok("facebook", "anapopdesign")).toBe("https://www.facebook.com/anapopdesign");
  });

  it("respinge numele de utilizator invalide", () => {
    expect(err("github", "-ana")).toMatch(/GitHub/);
    expect(err("instagram", "@ana!pop")).toMatch(/Instagram/);
  });

  it("acceptă doar https", () => {
    expect(err("linkedin", "http://www.linkedin.com/in/ana")).toMatch(/https/);
    expect(err("github", "javascript:alert(1)")).toMatch(/invalid/);
    expect(err("github", "ftp://github.com/ana")).toMatch(/invalid/);
    expect(err("instagram", "data:text/html,hi")).toMatch(/invalid/);
  });

  it("domeniul trebuie să fie al rețelei alese", () => {
    expect(err("linkedin", "https://www.facebook.com/ana")).toMatch(/linkedin\.com/);
    expect(err("instagram", "https://instagram.com.evil.ro/ana")).toMatch(/instagram\.com/);
    expect(err("instagram", "https://evilinstagram.com/ana")).toMatch(/instagram\.com/);
    expect(err("github", "https://github.com@evil.ro/ana")).toBeTruthy();
    expect(err("github", "https://github.com:8443/ana")).toBeTruthy();
    expect(err("youtube", "https://youtu.be/abc")).toMatch(/youtube\.com/);
    expect(err("linkedin", "evil.ro")).toMatch(/linkedin\.com/);
  });

  it("cere un link către profil, nu către prima pagină a rețelei", () => {
    expect(err("instagram", "https://www.instagram.com/")).toMatch(/profilul/);
    expect(err("instagram", "instagram.com")).toMatch(/profilul/);
    expect(err("linkedin", "www.linkedin.com")).toMatch(/profilul/);
    expect(err("github", "github.com")).toMatch(/profilul/);
  });

  it("un singur link per rețea", () => {
    expect(err("github", "https://github.com/a https://github.com/b")).toMatch(/un singur link/);
  });

  it("respinge linkurile prea lungi", () => {
    expect(err("github", `https://github.com/${"a".repeat(400)}`)).toMatch(/lung/);
  });
});

describe("hostMatches", () => {
  it("acceptă domeniul și subdomeniile, nu și domenii asemănătoare", () => {
    expect(hostMatches("linkedin", "linkedin.com")).toBe(true);
    expect(hostMatches("linkedin", "ro.linkedin.com")).toBe(true);
    expect(hostMatches("linkedin", "linkedin.com.ro")).toBe(false);
    expect(hostMatches("linkedin", "notlinkedin.com")).toBe(false);
  });
});

describe("socialLinkList", () => {
  it("păstrează ordinea rețelelor și ignoră valorile invalide din baza de date", () => {
    const list = socialLinkList({
      github: "https://github.com/ana",
      linkedin: "https://www.linkedin.com/in/ana",
      instagram: "javascript:alert(1)",
    });
    expect(list.map((l) => l.key)).toEqual(["linkedin", "github"]);
    expect(list[0]).toMatchObject({ label: "LinkedIn", url: "https://www.linkedin.com/in/ana" });
    expect(socialLinkList(null)).toEqual([]);
  });
});
