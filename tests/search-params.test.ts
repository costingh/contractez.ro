import { describe, expect, it } from "vitest";
import { AI_QUERY_MAX, cleanAiQuery, flattenParams } from "@/components/public-search/params";
import { stripControlChars } from "@/lib/text";
import { parseProjectFilters, searchProjects } from "@/server/search/projects";
import { parseProviderFilters, searchProviders } from "@/server/search/providers";

describe("parametrii de căutare din URL", () => {
  it("elimină caracterele de control (raportul QA: ?q=%00 dădea 500)", () => {
    expect(stripControlChars("ab\u0000c\u0007d\u007f")).toBe("abcd");
    expect(stripControlChars("rând\nnou\ttab")).toBe("rând nou tab");
    expect(stripControlChars("Brașov, țiglă")).toBe("Brașov, țiglă");
    expect(flattenParams({ q: "\u0000", cat: ["1", "2\u0000"], ai: undefined })).toEqual({ q: "", cat: "1,2", ai: undefined });
  });

  it("căutarea AI e curățată și limitată la 300 de caractere", () => {
    expect(cleanAiQuery("  electrician\u0000   în   Cluj  ")).toBe("electrician în Cluj");
    expect(cleanAiQuery("ab")).toBeNull();
    expect(cleanAiQuery(undefined)).toBeNull();
    expect(cleanAiQuery("x".repeat(5_000))?.length).toBe(AI_QUERY_MAX);
  });

  it("filtrele proiectelor și prestatorilor nu mai trimit \\u0000 în Postgres", async () => {
    const pf = parseProjectFilters({ q: "\u0000" });
    expect(pf.q).toBe("");
    await expect(searchProjects(parseProjectFilters({ q: "site\u0000web" }))).resolves.toBeTruthy();
    const vf = parseProviderFilters({ q: "\u0000", lang: "\u0000" });
    expect(vf.q).toBe("");
    await expect(searchProviders(parseProviderFilters({ q: "ins\u0000talator", lang: "e\u0000n" }))).resolves.toBeTruthy();
  });
});
