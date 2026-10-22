import type postgres from "postgres";
import localities from "../../db/seed-data/localities.json";
import { categoryAttributeSeed, taxonomy } from "../../db/seed-data/taxonomy";
import { normalizeText, slugify } from "../lib/text";

type LocalityRow = [name: string, county: string, countyCode: string, lat: number, lng: number, population: number];

const POPULATION_OVERRIDES: Record<string, number> = {
  "municipiul bucuresti": 1_883_425,
};

/** Date de referință (categorii, competențe, localități). Idempotent: poate rula la fiecare deploy. */
export async function seedReferenceData(sql: postgres.Sql) {
  await sql.begin(async (tx) => {
    const curatedSkills: string[] = [];
    let catOrder = 0;
    for (const cat of taxonomy) {
      const [parent] = await tx<{ id: number }[]>`
        INSERT INTO categories (slug, name, description, icon, parent_id, sort_order, typical_work_mode)
        VALUES (${cat.slug}, ${cat.name}, ${cat.description}, ${cat.icon}, NULL, ${catOrder++}, ${cat.workMode})
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description,
          icon = EXCLUDED.icon, sort_order = EXCLUDED.sort_order, typical_work_mode = EXCLUDED.typical_work_mode
        RETURNING id`;
      let subOrder = 0;
      for (const sub of cat.subs) {
        const [child] = await tx<{ id: number }[]>`
          INSERT INTO categories (slug, name, parent_id, sort_order, typical_work_mode)
          VALUES (${sub.slug}, ${sub.name}, ${parent.id}, ${subOrder++}, ${cat.workMode})
          ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id,
            sort_order = EXCLUDED.sort_order, typical_work_mode = EXCLUDED.typical_work_mode
          RETURNING id`;
        for (const skill of sub.skills) {
          curatedSkills.push(slugify(skill));
          await tx`
            INSERT INTO skills (slug, name, category_id) VALUES (${slugify(skill)}, ${skill}, ${child.id})
            ON CONFLICT (slug) DO UPDATE SET category_id = EXCLUDED.category_id WHERE skills.category_id IS NULL`;
        }
        const attrs = categoryAttributeSeed[sub.slug];
        if (attrs) {
          await tx`DELETE FROM category_attributes WHERE category_id = ${child.id}`;
          let i = 0;
          for (const a of attrs) {
            await tx`
              INSERT INTO category_attributes (category_id, key, label, kind, options, unit, sort_order)
              VALUES (${child.id}, ${a.key}, ${a.label}, ${a.kind}, ${a.options ? JSON.stringify(a.options) : null}::jsonb, ${a.unit ?? null}, ${i++})`;
          }
        }
      }
    }
    // Doar competențele din taxonomie au categorie (sunt „curatoriate”). Cele scrise de prestatori erau salvate
    // înainte sub categoria lor și apăreau ca sugestii pentru toți: le trecem la necategorisite (vezi skillsForCategory).
    if (curatedSkills.length > 0) {
      await tx`UPDATE skills SET category_id = NULL WHERE category_id IS NOT NULL AND slug <> ALL(${tx.array(curatedSkills)}::text[])`;
    }
  });

  const [{ count }] = await sql<{ count: number }[]>`SELECT count(*)::int AS count FROM localities`;
  if (count === 0) {
    const rows = (localities as LocalityRow[]).map(([name, county, countyCode, lat, lng, population]) => ({
      name,
      county,
      county_code: countyCode,
      lat,
      lng,
      population: POPULATION_OVERRIDES[normalizeText(name)] ?? population,
      search_name: normalizeText(name),
    }));
    for (let i = 0; i < rows.length; i += 1000) {
      const chunk = rows.slice(i, i + 1000);
      await sql`INSERT INTO localities ${sql(chunk, "name", "county", "county_code", "lat", "lng", "population", "search_name")}`;
    }
    console.log(`Localități importate: ${rows.length}`);
  }
  const [{ cats }] = await sql<{ cats: number }[]>`SELECT count(*)::int AS cats FROM categories`;
  console.log(`Date de referință OK (${cats} categorii).`);
}
