import { describe, expect, it } from "vitest";
import { isValidCui, normalizeCui } from "@/server/verification/anaf";

describe("CUI", () => {
  it("validează cifra de control", () => {
    expect(isValidCui("14399840")).toBe(true);
    expect(isValidCui("18547290")).toBe(true);
    expect(isValidCui("14399841")).toBe(false);
    expect(isValidCui("1")).toBe(false);
  });
  it("normalizează prefixul RO și spațiile", () => {
    expect(normalizeCui("RO14399840")).toBe("14399840");
    expect(normalizeCui(" ro 14399840 ")).toBe("14399840");
    expect(normalizeCui("RO12345678")).toBeNull();
    expect(normalizeCui("abc")).toBeNull();
  });
});
