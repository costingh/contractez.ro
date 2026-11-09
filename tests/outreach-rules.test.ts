import { describe, expect, it } from "vitest";
import { isAnonymousAuthor, messengerUrl, personKey, personKeyFromThread } from "@/server/outreach/person-key";
import { ruleCategories, ruleClassify } from "@/server/outreach/rules";
import { GET as fbLinkGET } from "@/app/fb/[tip]/[grup]/route";
import { rules } from "@/config/site";
import { MESSAGE_GUIDELINES, outreachLink, templateMessage } from "@/server/outreach/templates";

describe("personKey", () => {
  it("normalizează URL-urile de profil", () => {
    expect(personKey("https://www.facebook.com/profile.php?id=123456")).toBe("id:123456");
    expect(personKey("https://m.facebook.com/profile.php?id=123456&ref=xyz")).toBe("id:123456");
    expect(personKey("https://www.facebook.com/groups/252706105062924/user/1000123/")).toBe("id:1000123");
    expect(personKey("https://www.facebook.com/groups/252706105062924/user/1000123/?__cft__=abc")).toBe("id:1000123");
    expect(personKey("https://www.facebook.com/Ion.Popescu.77?__tn__=R")).toBe("u:ion.popescu.77");
    expect(personKey("facebook.com/Maria.Ionescu/")).toBe("u:maria.ionescu");
    expect(personKey("https://www.facebook.com/people/Ion-Popescu/100089123456789/")).toBe("id:100089123456789");
  });

  it("authorFbId are prioritate", () => {
    expect(personKey("https://www.facebook.com/ion.popescu", "1000123")).toBe("id:1000123");
    expect(personKey(null, "1000123")).toBe("id:1000123");
  });

  it("respinge URL-uri care nu sunt profiluri", () => {
    expect(personKey(null)).toBeNull();
    expect(personKey("")).toBeNull();
    expect(personKey("https://example.com/ion")).toBeNull();
    expect(personKey("https://www.facebook.com/groups/252706105062924/")).toBeNull();
    expect(personKey("https://www.facebook.com/profile.php")).toBeNull();
    expect(personKey("https://www.facebook.com/watch/?v=1")).toBeNull();
  });

  it("deduce persoana din conversația Messenger", () => {
    expect(personKeyFromThread("https://www.facebook.com/messages/t/1000123")).toBe("id:1000123");
    expect(personKeyFromThread("https://www.facebook.com/messages/t/ion.popescu/")).toBe("u:ion.popescu");
    expect(personKeyFromThread("https://www.messenger.com/t/1000123")).toBe("id:1000123");
    expect(personKeyFromThread("https://www.facebook.com/messages/e2ee/t/987654321")).toBeNull();
  });

  it("construiește linkul Messenger", () => {
    expect(messengerUrl("id:1000123")).toBe("https://www.facebook.com/messages/t/1000123");
    expect(messengerUrl("u:ion.popescu")).toBe("https://www.facebook.com/messages/t/ion.popescu");
    expect(messengerUrl("u:ion.popescu", "555")).toBe("https://www.facebook.com/messages/t/555");
    expect(messengerUrl(null)).toBeNull();
  });

  it("recunoaște autorii anonimi", () => {
    expect(isAnonymousAuthor("Anonymous participant")).toBe(true);
    expect(isAnonymousAuthor("Anonim")).toBe(true);
    expect(isAnonymousAuthor("Participant anonim 12")).toBe(true);
    expect(isAnonymousAuthor("Ana Popescu")).toBe(false);
  });
});

describe("ruleClassify (fallback fără AI)", () => {
  const cats = ruleCategories([
    { slug: "social-media", name: "Social media", skills: ["Instagram", "TikTok", "Facebook"] },
    { slug: "site-prezentare", name: "Site de prezentare", skills: ["WordPress", "Landing page"] },
  ]);

  it("clienți: „caut”, „am nevoie”, „recomandați”", () => {
    const a = ruleClassify({ text: "Caut un social media manager pentru centrul nostru educațional din Cluj, buget 1500 lei/lună." }, cats);
    expect(a.type).toBe("client");
    expect(a.categorySlug).toBe("social-media");
    expect(a.score).toBeGreaterThanOrEqual(70);
    expect(ruleClassify({ text: "Am nevoie de un site WordPress pentru un cabinet stomatologic" }, cats).type).toBe("client");
    expect(ruleClassify({ text: "Îmi recomandați pe cineva pentru un logo?" }, cats).type).toBe("client");
    expect(ruleClassify({ text: "Caut un social media manager pentru Instagram. Aștept mesaje cu portofoliu." }, cats).type).toBe("client");
    expect(ruleClassify({ text: "Avem nevoie de un landing page. Trimiteți portofoliu în privat." }, cats).type).toBe("client");
  });

  it("prestatori: „ofer”, „realizez”, „portofoliu”", () => {
    const p = ruleClassify({ text: "Realizez site-uri de prezentare în WordPress. Portofoliu în comentarii." }, cats);
    expect(p.type).toBe("provider");
    expect(p.categorySlug).toBe("site-prezentare");
    expect(ruleClassify({ text: "Ofer servicii de administrare pagini Instagram și TikTok" }, cats).type).toBe("provider");
    expect(ruleClassify({ text: "Caut clienți noi pentru servicii de editare video" }, cats).type).toBe("provider");
    expect(ruleClassify({ text: "Te pot ajuta, îți scriu în PM" }, cats).type).toBe("provider");
  });

  it("irelevant: fără intenție sau spam", () => {
    expect(ruleClassify({ text: "Ce părere aveți despre noul update de la Facebook?" }, cats).type).toBe("irrelevant");
    expect(ruleClassify({ text: "Câștigă bani din investiții crypto, scrie-mi!" }, cats).type).toBe("irrelevant");
    expect(ruleClassify({ text: "" }, cats).type).toBe("irrelevant");
  });

  it("comentariile moștenesc categoria postării", () => {
    const r = ruleClassify({ text: "Te pot ajuta, am experiență", kind: "comment", parentText: "Caut pe cineva pentru Instagram" }, cats);
    expect(r.type).toBe("provider");
    expect(r.categorySlug).toBe("social-media");
  });
});

describe("șabloane", () => {
  it("linkuri scurte per grup, care redirecționează la înregistrare cu UTM", async () => {
    expect(outreachLink("provider", "252706105062924")).toMatch(/\/fb\/p\/252706105062924$/);
    expect(outreachLink("client", "42")).toMatch(/\/fb\/c\/42$/);
    const msg = templateMessage("client", "42");
    expect(msg).toContain(outreachLink("client", "42"));
    expect(msg).not.toContain("https://contractez.ro,");

    const go = async (tip: string, grup: string) =>
      (await fbLinkGET(new Request(`http://localhost/fb/${tip}/${grup}`), { params: Promise.resolve({ tip, grup }) })).headers.get("location");
    expect(await go("p", "252706105062924")).toMatch(
      /\/inregistrare\?rol=prestator&utm_source=facebook&utm_medium=dm&utm_campaign=252706105062924$/,
    );
    expect(await go("c", "42")).toMatch(/\/inregistrare\?rol=client&utm_source=facebook&utm_medium=dm&utm_campaign=42$/);
    expect(await go("x", "42")).toMatch(/\/\?utm_source=facebook/);
  });

  it("sunt cold DM: îndemn la acțiune, fără cerere de feedback, cu cifrele din config", () => {
    for (const audience of ["provider", "client"] as const) {
      const msg = templateMessage(audience, "42");
      expect(msg).not.toMatch(/feedback|părere|arunci o privire|la început|am lansat/i);
      expect(msg).toContain(`cel mult ${rules.defaultMaxApplications} oferte`);
      expect(msg.endsWith(outreachLink(audience, "42"))).toBe(true);
      expect(msg.length).toBeLessThanOrEqual(450);
    }
    expect(MESSAGE_GUIDELINES).toMatch(/NU ceri feedback/);
  });
});
