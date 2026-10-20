import { describe, expect, it } from "vitest";
import { checkEligibility, distribute, scoreMatch, type ProjectForMatch, type ProviderForMatch } from "@/server/matching/score";

const project: ProjectForMatch = {
  categoryId: 10,
  rootCategoryId: 1,
  skillIds: [100, 101],
  keywords: [],
  budgetType: "fixed",
  budgetMin: 2000,
  budgetMax: 3000,
  estimatedHours: null,
  workMode: "on_site",
  radiusKm: 30,
};

const provider: ProviderForMatch = {
  categoryIds: [10],
  rootCategoryIds: [1],
  skillIds: [100, 101],
  searchText: "",
  hourlyRate: 100,
  minProjectBudget: 1500,
  remote: false,
  onSite: true,
  travelRadiusKm: 40,
  distanceKm: 5,
  ratingAvg: 4.8,
  ratingCount: 10,
  completedCount: 5,
  availability: "available",
  responseTimeMinutes: 60,
};

describe("matching", () => {
  it("un prestator perfect compatibil are scor mare și motive explicate", () => {
    const r = scoreMatch(project, provider);
    expect(r.eligible).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(90);
    expect(r.reasons.some((x) => x.label.includes("exact"))).toBe(true);
  });

  it("verifică simultan raza prestatorului și raza acceptată de proiect", () => {
    expect(checkEligibility(project, { ...provider, distanceKm: 35 })).toBe("În afara zonei de deplasare"); // > raza proiectului (30)
    expect(checkEligibility({ ...project, radiusKm: 100 }, { ...provider, distanceKm: 45 })).toBe("În afara zonei de deplasare"); // > raza prestatorului (40)
    expect(checkEligibility({ ...project, radiusKm: 100 }, { ...provider, distanceKm: 35 })).toBeNull();
  });

  it("proiectele remote cer prestatori care lucrează remote; distanța nu contează", () => {
    const remote = { ...project, workMode: "remote" as const };
    expect(checkEligibility(remote, provider)).toBe("Nu lucrează remote");
    expect(checkEligibility(remote, { ...provider, remote: true, distanceKm: 500 })).toBeNull();
  });

  it("exclude categoriile fără legătură și prestatorii indisponibili", () => {
    expect(checkEligibility(project, { ...provider, categoryIds: [99], rootCategoryIds: [9] })).toBe("Categorie diferită");
    expect(checkEligibility(project, { ...provider, availability: "unavailable" })).toBe("Indisponibil");
  });

  it("bugetul sub minimul prestatorului scade scorul", () => {
    const good = scoreMatch(project, provider).score;
    const bad = scoreMatch(project, { ...provider, minProjectBudget: 10_000 }).score;
    expect(bad).toBeLessThan(good);
  });

  it("subcategoria soră primește mai puține puncte decât potrivirea exactă", () => {
    const exact = scoreMatch(project, provider).score;
    const sibling = scoreMatch(project, { ...provider, categoryIds: [11] }).score;
    expect(sibling).toBeLessThan(exact);
  });

  it("distribuția rezervă locuri pentru profiluri noi", () => {
    const veterans = Array.from({ length: 10 }, (_, i) => ({ id: `v${i}`, score: 95 - i, isNewcomer: false, notifiedToday: 0 }));
    const newcomers = Array.from({ length: 5 }, (_, i) => ({ id: `n${i}`, score: 60 - i, isNewcomer: true, notifiedToday: 0 }));
    const picked = distribute([...veterans, ...newcomers], 10, 0.2);
    expect(picked).toHaveLength(10);
    expect(picked.filter((p) => p.isNewcomer)).toHaveLength(2);
  });

  it("penalizează prestatorii deja suprasolicitați azi", () => {
    const a = { id: "a", score: 80, isNewcomer: false, notifiedToday: 30 };
    const b = { id: "b", score: 75, isNewcomer: false, notifiedToday: 0 };
    expect(distribute([a, b], 1, 0)[0].id).toBe("b");
  });
});
