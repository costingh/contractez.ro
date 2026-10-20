import type { CategoryOption } from "@/components/shared/category-select";
import { getCatalog } from "./taxonomy";

/** Categoriile serializate pentru componentele client. */
export async function categoryOptions(): Promise<CategoryOption[]> {
  const c = await getCatalog();
  return c.tree.map((t) => ({ id: t.id, name: t.name, children: t.children.map((ch) => ({ id: ch.id, name: ch.name })) }));
}
