import { asc, eq, isNull, sql } from "drizzle-orm";
import { db } from "../db";
import { categories, categoryAttributes, skills, type Category, type Skill } from "../db/schema";

export type CategoryNode = Category & { children: Category[] };

type Catalog = {
  tree: CategoryNode[];
  byId: Map<number, Category>;
  bySlug: Map<string, Category>;
  skills: Skill[];
  skillsById: Map<number, Skill>;
  skillsBySlug: Map<string, Skill>;
  /**
   * Competențe adăugate de utilizatori (fără categorie) folosite de cel puțin `COMMUNITY_SKILL_MIN_PROVIDERS`
   * prestatori distincți → categoria în care apar cel mai des. Doar acestea (plus cele din taxonomie) se sugerează.
   */
  communitySkillCategory: Map<number, number>;
  loadedAt: number;
};

/** De câți prestatori distincți trebuie folosită o competență scrisă de utilizatori ca să fie sugerată altora. */
export const COMMUNITY_SKILL_MIN_PROVIDERS = 3;

let cached: Catalog | null = null;
const TTL = 5 * 60_000;

/** Taxonomia se schimbă rar: o păstrăm în memorie 5 minute. */
export async function getCatalog(): Promise<Catalog> {
  if (cached && Date.now() - cached.loadedAt < TTL) return cached;
  const [cats, sk, community] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
    db.select().from(skills).orderBy(asc(skills.name)),
    communitySkillCategories(),
  ]);
  const byId = new Map(cats.map((c) => [c.id, c]));
  const bySlug = new Map(cats.map((c) => [c.slug, c]));
  const tree: CategoryNode[] = cats
    .filter((c) => c.parentId === null)
    .map((c) => ({ ...c, children: cats.filter((x) => x.parentId === c.id) }));
  cached = {
    tree,
    byId,
    bySlug,
    skills: sk,
    skillsById: new Map(sk.map((s) => [s.id, s])),
    skillsBySlug: new Map(sk.map((s) => [s.slug, s])),
    communitySkillCategory: community,
    loadedAt: Date.now(),
  };
  return cached;
}

/** Categoria principală pentru o (sub)categorie. */
export function rootOf(catalog: Catalog, categoryId: number): Category | undefined {
  const c = catalog.byId.get(categoryId);
  if (!c) return undefined;
  return c.parentId ? catalog.byId.get(c.parentId) : c;
}

export function categoryPath(catalog: Catalog, categoryId: number): string {
  const c = catalog.byId.get(categoryId);
  if (!c) return "";
  const parent = c.parentId ? catalog.byId.get(c.parentId) : undefined;
  return parent ? `${parent.name} › ${c.name}` : c.name;
}

/** Id-urile categoriei și ale tuturor subcategoriilor (pentru filtre pe categoria principală). */
export function expandCategory(catalog: Pick<Catalog, "tree">, categoryId: number): number[] {
  const node = catalog.tree.find((t) => t.id === categoryId);
  return node ? [node.id, ...node.children.map((c) => c.id)] : [categoryId];
}

/** Golește cache-ul taxonomiei (teste, scripturi). */
export function invalidateCatalog() {
  cached = null;
}

/**
 * Competențele necategorisite (scrise de prestatori sau venite din proiecte) folosite de cel puțin
 * `COMMUNITY_SKILL_MIN_PROVIDERS` prestatori distincți, cu categoria în care le folosesc cei mai mulți.
 */
export async function communitySkillCategories(minProviders = COMMUNITY_SKILL_MIN_PROVIDERS): Promise<Map<number, number>> {
  const rows = (await db.execute(sql`
    WITH popular AS (
      SELECT ps.skill_id
      FROM provider_skills ps
      JOIN skills s ON s.id = ps.skill_id AND s.category_id IS NULL
      GROUP BY ps.skill_id
      HAVING count(DISTINCT ps.provider_id) >= ${minProviders}
    )
    SELECT DISTINCT ON (ps.skill_id) ps.skill_id, pc.category_id
    FROM popular p
    JOIN provider_skills ps ON ps.skill_id = p.skill_id
    JOIN provider_categories pc ON pc.provider_id = ps.provider_id
    GROUP BY ps.skill_id, pc.category_id
    ORDER BY ps.skill_id, count(DISTINCT ps.provider_id) DESC, pc.category_id`)) as unknown as { skill_id: number; category_id: number }[];
  return new Map(rows.map((r) => [Number(r.skill_id), Number(r.category_id)]));
}

/**
 * Competențele sugerate pentru o categorie: cele din taxonomie (au categorie) și cele adăugate de utilizatori
 * doar după ce le folosesc mai mulți prestatori (`communitySkillCategory`). O competență scrisă de un singur
 * prestator nu ajunge în sugestiile altora.
 */
export function skillsForCategory(catalog: Pick<Catalog, "tree" | "skills" | "communitySkillCategory">, categoryId: number): Skill[] {
  const ids = new Set(expandCategory(catalog, categoryId));
  return catalog.skills.filter((s) => {
    const cat = s.categoryId ?? catalog.communitySkillCategory.get(s.id) ?? null;
    return cat !== null && ids.has(cat);
  });
}

export async function getCategoryAttributes(categoryId: number) {
  return db
    .select()
    .from(categoryAttributes)
    .where(eq(categoryAttributes.categoryId, categoryId))
    .orderBy(asc(categoryAttributes.sortOrder));
}

export async function topLevelCategories() {
  return db.select().from(categories).where(isNull(categories.parentId)).orderBy(asc(categories.sortOrder));
}
