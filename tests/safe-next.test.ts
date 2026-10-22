import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/safe-next";

describe("safeNext", () => {
  it("păstrează căile interne", () => {
    expect(safeNext("/panou")).toBe("/panou");
    expect(safeNext("/proiecte/nou?cat=3#x")).toBe("/proiecte/nou?cat=3#x");
  });
  it("respinge redirecționări externe (raportul QA)", () => {
    for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example/x", "/%5Cevil", "\\\\evil", "javascript:alert(1)", "/\tevil", null, undefined, ""]) {
      const r = safeNext(bad as string);
      expect(r === null || (r.startsWith("/") && !r.startsWith("//")), String(bad)).toBe(true);
    }
    expect(safeNext("/\\evil.example/x")).toBeNull();
    expect(safeNext("https://evil.example")).toBeNull();
    expect(safeNext("//evil.example")).toBeNull();
  });
});
