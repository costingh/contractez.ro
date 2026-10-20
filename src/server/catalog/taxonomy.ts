import { asc, eq, isNull } from "drizzle-orm";
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
  loadedAt: number;
};

let cached: Catalog | null = null;
const TTL = 5 * 60_000;

/** Taxonomia se schimbă rar: o păstrăm în memorie 5 minute. */
export async function getCatalog(): Promise<Catalog> {
  if (cached && Date.now() - cached.loadedAt < TTL) return cached;
  const [cats, sk] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
    db.select().from(skills).orderBy(asc(skills.name)),
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
export function expandCategory(catalog: Catalog, categoryId: number): number[] {
  const node = catalog.tree.find((t) => t.id === categoryId);
  return node ? [node.id, ...node.children.map((c) => c.id)] : [categoryId];
}

export function skillsForCategory(catalog: Catalog, categoryId: number): Skill[] {
  const ids = new Set(expandCategory(catalog, categoryId));
  return catalog.skills.filter((s) => s.categoryId !== null && ids.has(s.categoryId));
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
