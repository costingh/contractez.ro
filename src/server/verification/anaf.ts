import { and, eq, isNotNull, lt, ne, sql } from "drizzle-orm";
import { normalizeText } from "@/lib/text";
import { db } from "../db";
import { users, type CompanyVerification } from "../db/schema";
import { DomainError } from "../errors";
import { notify } from "../notifications";
import { refreshProviderSearchText } from "../providers/service";
import { getRedis } from "../redis";

/*
 * Verificare firmă prin serviciul web public ANAF (gratuit, fără autentificare):
 * https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva
 * Ce confirmă: firma există, este activă (nu e inactivă/radiată), plătitor TVA, e-Factura, CAEN.
 * Ce NU confirmă: că utilizatorul chiar reprezintă firma. De aceea badge-ul spune „Firmă verificată ANAF”,
 * un CUI poate fi confirmat pe un singur cont, iar utilizatorii pot raporta folosirea abuzivă.
 */

const ANAF_URL = "https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva";
const CACHE_SECONDS = 24 * 3_600;

type AnafFound = {
  date_generale: {
    cui: number;
    denumire: string;
    stare_inregistrare: string;
    forma_juridica: string;
    forma_organizare: string;
    nrRegCom: string;
    cod_CAEN: string;
    data_inregistrare: string;
    statusRO_e_Factura: boolean;
  };
  inregistrare_scop_Tva: { scpTVA: boolean };
  stare_inactiv: { statusInactivi: boolean; dataRadiere: string };
  adresa_sediu_social?: { sdenumire_Judet?: string; sdenumire_Localitate?: string };
};

export function normalizeCui(raw: string): string | null {
  const digits = raw.trim().toUpperCase().replace(/^RO/, "").replace(/\s/g, "");
  if (!/^\d{2,10}$/.test(digits)) return null;
  return isValidCui(digits) ? digits : null;
}

/** Cifra de control a CUI-ului românesc (algoritmul oficial, cheia 753217532). */
export function isValidCui(cui: string): boolean {
  if (!/^\d{2,10}$/.test(cui)) return false;
  const key = "753217532";
  const digits = cui.split("").map(Number);
  const control = digits.pop()!;
  const padded = Array(9 - digits.length).fill(0).concat(digits);
  const sum = padded.reduce((acc, d, i) => acc + d * Number(key[i]), 0);
  let c = (sum * 10) % 11;
  if (c === 10) c = 0;
  return c === control;
}

function legalEntityFrom(form: string): "pfa" | "ii" | "srl" | "other" {
  const f = normalizeText(form);
  if (f.includes("autorizat")) return "pfa";
  if (f.includes("individual") || f.includes("familial")) return "ii";
  if (f.includes("raspundere limitata")) return "srl";
  return "other";
}

/** Interogare ANAF cu cache (24h) și respectarea limitei de ~1 cerere/secundă. */
export async function lookupCui(cui: string): Promise<CompanyVerification | null> {
  const redis = getRedis();
  const cacheKey = `anaf:cui:${cui}`;
  try {
    const hit = await redis.get(cacheKey);
    if (hit) return hit === "null" ? null : (JSON.parse(hit) as CompanyVerification);
  } catch {
    /* fără cache */
  }

  // Lacăt global de 1 secundă între cereri (cerința ANAF).
  for (let i = 0; i < 10; i++) {
    const ok = await redis.set("anaf:lock", "1", "PX", 1_100, "NX").catch(() => "OK");
    if (ok === "OK") break;
    await new Promise((r) => setTimeout(r, 400));
  }

  const today = new Date().toISOString().slice(0, 10);
  let res: Response;
  try {
    res = await fetch(ANAF_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify([{ cui: Number(cui), data: today }]),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new DomainError("anaf_down", "Serviciul ANAF nu răspunde momentan. Încearcă din nou în câteva minute.");
  }
  if (!res.ok) throw new DomainError("anaf_down", `Serviciul ANAF a răspuns cu eroare (${res.status}). Încearcă mai târziu.`);
  const body = (await res.json()) as { found?: AnafFound[]; notFound?: unknown[] };
  const f = body.found?.[0];
  if (!f) {
    await redis.set(cacheKey, "null", "EX", 3_600).catch(() => {});
    return null;
  }
  const g = f.date_generale;
  const radiat = Boolean(f.stare_inactiv?.dataRadiere) || /radier|radiat/i.test(g.stare_inregistrare);
  const result: CompanyVerification = {
    cui,
    name: g.denumire.trim(),
    legalForm: g.forma_juridica || g.forma_organizare || "",
    regCom: g.nrRegCom || null,
    caen: g.cod_CAEN || null,
    vatPayer: Boolean(f.inregistrare_scop_Tva?.scpTVA),
    eInvoice: Boolean(g.statusRO_e_Factura),
    registeredAt: g.data_inregistrare || null,
    county: f.adresa_sediu_social?.sdenumire_Judet ?? null,
    locality: f.adresa_sediu_social?.sdenumire_Localitate ?? null,
    active: !radiat && !f.stare_inactiv?.statusInactivi,
    checkedAt: new Date().toISOString(),
  };
  await redis.set(cacheKey, JSON.stringify(result), "EX", CACHE_SECONDS).catch(() => {});
  return result;
}

/** Verifică CUI-ul declarat de utilizator și, dacă e valid, acordă badge-ul. */
export async function verifyCompany(userId: string, rawCui?: string) {
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  if (!u) throw new DomainError("not_found", "Utilizator inexistent");
  const cui = normalizeCui(rawCui ?? u.companyCui ?? "");
  if (!cui) throw new DomainError("cui_invalid", "CUI invalid. Verifică cifrele (fără spații; prefixul RO este opțional).");

  const [taken] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.companyCui, cui), isNotNull(users.companyVerifiedAt), ne(users.id, userId)));
  if (taken) {
    throw new DomainError("cui_taken", "Acest CUI este deja confirmat pe alt cont. Dacă firma îți aparține, scrie-ne din pagina de contact.");
  }

  const info = await lookupCui(cui);
  if (!info) throw new DomainError("cui_not_found", "ANAF nu are date pentru acest CUI.");
  if (!info.active) {
    await db.update(users).set({ companyCui: cui, companyVerifiedAt: null, companyVerification: info }).where(eq(users.id, userId));
    throw new DomainError("cui_inactive", `Firma ${info.name} apare ca inactivă sau radiată în evidențele ANAF.`);
  }

  await db
    .update(users)
    .set({
      companyCui: cui,
      companyName: info.name,
      legalEntity: legalEntityFrom(info.legalForm),
      issuesInvoice: true,
      companyVerifiedAt: new Date(),
      companyVerification: info,
    })
    .where(eq(users.id, userId));
  if (u.isProvider) await refreshProviderSearchText(userId);
  return info;
}

export async function removeCompanyVerification(userId: string) {
  await db.update(users).set({ companyVerifiedAt: null }).where(eq(users.id, userId));
}

/** Reverificare periodică (worker): firmele devenite inactive pierd badge-ul. Max 50 / rulare. */
export async function recheckVerifiedCompanies() {
  const due = await db
    .select({ id: users.id, cui: users.companyCui })
    .from(users)
    .where(
      and(
        isNotNull(users.companyVerifiedAt),
        lt(sql`(${users.companyVerification}->>'checkedAt')::timestamptz`, sql`now() - interval '30 days'`),
      ),
    )
    .limit(50);
  let revoked = 0;
  for (const row of due) {
    if (!row.cui) continue;
    try {
      await getRedis().del(`anaf:cui:${row.cui}`);
      const info = await lookupCui(row.cui);
      if (!info || !info.active) {
        revoked++;
        await db.update(users).set({ companyVerifiedAt: null, companyVerification: info ?? undefined }).where(eq(users.id, row.id));
        await notify({
          userId: row.id,
          type: "company.unverified",
          title: "Verificarea ANAF a firmei a expirat",
          body: "Firma nu mai apare activă în evidențele ANAF, așa că am scos badge-ul. Poți reverifica din profil.",
          link: "/profil#firma",
          dedupeKey: `company-unverified:${row.id}:${new Date().toISOString().slice(0, 10)}`,
        });
      } else {
        await db.update(users).set({ companyVerification: info, companyName: info.name }).where(eq(users.id, row.id));
      }
    } catch (err) {
      console.error("[anaf] recheck", row.cui, (err as Error).message);
    }
  }
  return { checked: due.length, revoked };
}
