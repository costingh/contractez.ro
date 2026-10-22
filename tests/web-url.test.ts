import { describe, expect, it } from "vitest";
import { normalizeWebUrl, safeWebUrl } from "@/lib/web-url";
import { portfolioSchema, providerProfileSchema } from "@/server/providers/service";

const ok = (raw: string) => {
  const r = normalizeWebUrl(raw);
  if (!r.ok) throw new Error(`„${raw}”: ${r.error}`);
  return r.url;
};

describe("normalizeWebUrl (site prestator, linkuri portofoliu)", () => {
  it("acceptă http(s) și completează schema lipsă cu https://", () => {
    expect(ok("https://contractez.ro/despre")).toBe("https://contractez.ro/despre");
    expect(ok("http://exemplu.ro")).toBe("http://exemplu.ro/");
    expect(ok("contractez.ro")).toBe("https://contractez.ro/");
    expect(ok("www.firma-mea.ro/portofoliu?x=1")).toBe("https://www.firma-mea.ro/portofoliu?x=1");
    expect(ok("//cdn.exemplu.com/a")).toBe("https://cdn.exemplu.com/a");
    expect(ok("site.ro:8080/a")).toBe("https://site.ro:8080/a");
    expect(ok("   ")).toBeNull();
  });

  it("refuză javascript:, data: și alte scheme sau gazde invalide", () => {
    for (const bad of [
      "javascript:alert(1)",
      "JavaScript:alert(document.cookie)",
      "data:text/html,<script>alert(1)</script>",
      "vbscript:msgbox(1)",
      "file:///etc/passwd",
      "ftp://exemplu.ro",
      "mailto:ana@exemplu.ro",
      "https://user:parola@exemplu.ro",
      "https://localhost",
      "https://exemplu",
      "exemplu ro",
      `https://exemplu.ro/${"a".repeat(400)}`,
    ]) {
      expect(normalizeWebUrl(bad).ok, bad).toBe(false);
    }
  });

  it("la afișare, linkurile vechi nesigure dispar", () => {
    expect(safeWebUrl("javascript:alert(1)")).toBeNull();
    expect(safeWebUrl("https://exemplu.ro")).toBe("https://exemplu.ro/");
    expect(safeWebUrl(null)).toBeNull();
  });

  it("schemele zod ale profilului și portofoliului folosesc aceeași regulă", () => {
    expect(portfolioSchema.parse({ title: "Lucrare", url: "exemplu.ro/lucrare" }).url).toBe("https://exemplu.ro/lucrare");
    expect(portfolioSchema.parse({ title: "Lucrare", url: "" }).url).toBeNull();
    expect(portfolioSchema.safeParse({ title: "Lucrare", url: "javascript:alert(1)" }).success).toBe(false);
    expect(portfolioSchema.safeParse({ title: "Lucrare", url: "data:text/html,x" }).success).toBe(false);

    const base = {
      headline: "Electrician autorizat",
      bio: "Lucrez de zece ani în instalații electrice rezidențiale și comerciale.",
      pricingModel: "hourly",
      remote: true,
      onSite: false,
      categoryIds: [1],
      issuesInvoice: false,
      legalEntity: "none",
    };
    expect(providerProfileSchema.parse({ ...base, websiteUrl: "firma.ro" }).websiteUrl).toBe("https://firma.ro/");
    expect(providerProfileSchema.parse({ ...base, websiteUrl: null }).websiteUrl).toBeNull();
    const bad = providerProfileSchema.safeParse({ ...base, websiteUrl: "javascript:alert(1)" });
    expect(bad.success).toBe(false);
    expect(bad.error?.issues[0]?.path).toEqual(["websiteUrl"]);
  });
});
