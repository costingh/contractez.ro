import { describe, expect, it } from "vitest";
import { AI_EXPLANATIONS, aiExplanation } from "@/components/public-search/ai-explanation";
import { GENERIC_LOGIN_ERROR, LOGIN_ERRORS, loginErrorCode, loginErrorMessage } from "@/lib/auth-errors";
import { formatBytes } from "@/lib/format";

describe("erorile de pe /autentificare vin din coduri, nu din text în URL", () => {
  it("codurile cunoscute au mesaje fixe în română", () => {
    expect(loginErrorMessage("google_cancelled")).toBe("Ai anulat autentificarea cu Google.");
    expect(loginErrorMessage("rate_limited")).toBe(LOGIN_ERRORS.rate_limited);
    expect(loginErrorMessage("banned")).toContain("suspendat");
  });

  it("textul arbitrar sau codurile necunoscute primesc mesajul generic", () => {
    expect(loginErrorMessage("Contul tău a fost blocat. Sună la 0700 000 000")).toBe(GENERIC_LOGIN_ERROR);
    expect(loginErrorMessage("toString")).toBe(GENERIC_LOGIN_ERROR);
    expect(loginErrorMessage("__proto__")).toBe(GENERIC_LOGIN_ERROR);
    expect(loginErrorMessage("")).toBeNull();
    expect(loginErrorMessage(undefined)).toBeNull();
  });

  it("codurile DomainError din fluxul Google se păstrează, restul devin `google_failed`", () => {
    expect(loginErrorCode("google_state")).toBe("google_state");
    expect(loginErrorCode("google_email")).toBe("google_email");
    expect(loginErrorCode("ceva_nou")).toBe("google_failed");
    expect(loginErrorCode(null, "google_off")).toBe("google_off");
  });

  it("callback-ul Google redirecționează cu un cod, nu cu un mesaj", async () => {
    const { NextRequest } = await import("next/server");
    const { GET } = await import("@/app/api/auth/google/callback/route");
    const redirectTarget = async (qs: string) => {
      try {
        await GET(new NextRequest(`http://localhost:3000/api/auth/google/callback?${qs}`));
      } catch (err) {
        return String((err as { digest?: string }).digest ?? "");
      }
      throw new Error("ar fi trebuit să redirecționeze");
    };
    expect(await redirectTarget("error=access_denied")).toContain("/autentificare?eroare=google_cancelled;");
    expect(await redirectTarget("error=altceva")).toContain("/autentificare?eroare=google_denied;");
  });
});

describe("explicația căutării AI (`?aiexp=`) vine dintr-o listă fixă", () => {
  it("doar codurile cunoscute afișează text; textul arbitrar e ignorat", () => {
    expect(aiExplanation("ai")).toBe(AI_EXPLANATIONS.ai);
    expect(aiExplanation("simplu")).toBe(AI_EXPLANATIONS.simplu);
    expect(aiExplanation("Ofertă specială: sună la 0700 000 000")).toBeNull();
    expect(aiExplanation("constructor")).toBeNull();
    expect(aiExplanation(undefined)).toBeNull();
  });
});

describe("dimensiunea atașamentelor", () => {
  it("fișierele mici nu mai apar ca „0 KB”", () => {
    expect(formatBytes(300)).toBe("<1 KB");
    expect(formatBytes(1)).toBe("<1 KB");
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(2.5 * 1024 * 1024)).toBe("2,5 MB");
    expect(formatBytes(null)).toBeNull();
  });
});
