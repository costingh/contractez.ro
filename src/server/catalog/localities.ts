import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { localities } from "../db/schema";
import { normalizeText } from "@/lib/text";

export type LocalityOption = { id: number; name: string; county: string; countyCode: string; lat: number; lng: number };

const cols = {
  id: localities.id,
  name: localities.name,
  county: localities.county,
  countyCode: localities.countyCode,
  lat: localities.lat,
  lng: localities.lng,
};

/** Autocomplete localități: potrivire pe prefix + similaritate, ordonat după populație. */
export async function searchLocalities(query: string, limit = 10): Promise<LocalityOption[]> {
  const q = normalizeText(query);
  if (q.length < 2) {
    return db.select(cols).from(localities).orderBy(desc(localities.population)).limit(limit);
  }
  return db
    .select(cols)
    .from(localities)
    .where(sql`${localities.searchName} LIKE ${q + "%"} OR ${localities.searchName} % ${q}`)
    .orderBy(
      sql`(${localities.searchName} LIKE ${q + "%"}) DESC`,
      desc(localities.population),
      sql`similarity(${localities.searchName}, ${q}) DESC`,
    )
    .limit(limit);
}

export async function getLocality(id: number): Promise<LocalityOption | null> {
  const [row] = await db.select(cols).from(localities).where(eq(localities.id, id)).limit(1);
  return row ?? null;
}

/** Găsește o localitate după nume (folosit de AI la importul unei cereri). */
export async function findLocalityByName(name: string, countyCode?: string): Promise<LocalityOption | null> {
  const q = normalizeText(name).replace(/^(municipiul|orasul|comuna|sat(ul)?)\s+/, "");
  if (!q) return null;
  if (q === "bucuresti") {
    const [b] = await db.select(cols).from(localities).where(eq(localities.searchName, "municipiul bucuresti")).limit(1);
    if (b) return b;
  }
  const [row] = await db
    .select(cols)
    .from(localities)
    .where(
      and(
        sql`(${localities.searchName} = ${q} OR ${localities.searchName} % ${q})`,
        countyCode ? eq(localities.countyCode, countyCode.toUpperCase()) : undefined,
      ),
    )
    .orderBy(sql`(${localities.searchName} = ${q}) DESC`, desc(localities.population))
    .limit(1);
  return row ?? null;
}
