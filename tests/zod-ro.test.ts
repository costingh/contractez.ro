import { describe, expect, it } from "vitest";
import { z } from "zod";
import { toActionError } from "@/lib/action";
import { roCount } from "@/lib/zod-ro";
import { basicsSchema } from "@/server/onboarding";
import { portfolioSchema } from "@/server/providers/service";
import { reviewSchema } from "@/server/trust/service";

const firstMessage = (schema: z.ZodType, value: unknown) => {
  const r = schema.safeParse(value);
  if (r.success) throw new Error("ar fi trebuit să eșueze");
  return r.error.issues[0].message;
};

describe("mesajele Zod în română (global)", () => {
  it("cazurile găsite de QA nu mai ajung în engleză la utilizator", () => {
    // Titlu de portofoliu „a   ” (după trim: 1 caracter, minim 3).
    expect(firstMessage(portfolioSchema, { title: "a   " })).toBe("Trebuie să aibă cel puțin 3 caractere.");
    // Nume de 90 de caractere la onboarding (maxim 80).
    expect(firstMessage(basicsSchema, { name: "a".repeat(90), isClient: true, isProvider: false })).toBe("Poate avea cel mult 80 de caractere.");
    // Rating peste 5.
    expect(firstMessage(reviewSchema, { rating: 6 })).toBe("Valoarea poate fi cel mult 5.");
  });

  it("acoperă tipurile uzuale de erori", () => {
    expect(firstMessage(z.string().min(1), "")).toBe("Câmpul este obligatoriu.");
    expect(firstMessage(z.object({ a: z.string() }), {})).toBe("Câmpul este obligatoriu.");
    expect(firstMessage(z.number(), "abc")).toBe("Introdu un număr valid.");
    expect(firstMessage(z.string().email(), "nu-e-email")).toBe("Adresa de email nu este validă.");
    expect(firstMessage(z.string().url(), "nu e link")).toBe("Linkul nu este valid (ex: https://exemplu.ro).");
    expect(firstMessage(z.enum(["a", "b"]), "c")).toBe("Alege una dintre opțiunile disponibile.");
    expect(firstMessage(z.number().int().min(1), 0)).toBe("Valoarea trebuie să fie cel puțin 1.");
    expect(firstMessage(z.array(z.string()).max(2), ["a", "b", "c"])).toBe("Poți alege cel mult 2 elemente.");
    expect(firstMessage(z.string().refine(() => false), "x")).toBe("Valoare invalidă.");
    for (const msg of [firstMessage(z.string().min(3), "a"), firstMessage(z.number().max(5), 9), firstMessage(z.boolean(), "x")]) {
      expect(msg).not.toMatch(/Too (small|big)|expected|Invalid/i);
    }
  });

  it("mesajele scrise explicit în scheme au prioritate", () => {
    expect(firstMessage(z.string().trim().min(2, "Scrie-ți numele"), " ")).toBe("Scrie-ți numele");
    expect(firstMessage(z.string().refine(() => false, "Mesaj propriu"), "x")).toBe("Mesaj propriu");
  });

  it("toActionError întoarce mesajul în română", () => {
    const r = basicsSchema.safeParse({ name: "a".repeat(90), isClient: true, isProvider: false });
    expect(r.success).toBe(false);
    const res = toActionError(r.error);
    expect(res.error).toBe("Poate avea cel mult 80 de caractere.");
    expect(res.fieldErrors?.name).toBe("Poate avea cel mult 80 de caractere.");
  });

  it("pluralul românesc: 1 caracter, 5 caractere, 20 de caractere, 101 caractere", () => {
    expect(roCount(1, "caracter", "caractere")).toBe("1 caracter");
    expect(roCount(5, "caracter", "caractere")).toBe("5 caractere");
    expect(roCount(19, "caracter", "caractere")).toBe("19 caractere");
    expect(roCount(20, "caracter", "caractere")).toBe("20 de caractere");
    expect(roCount(101, "caracter", "caractere")).toBe("101 caractere");
    expect(roCount(120, "caracter", "caractere")).toBe("120 de caractere");
  });
});
