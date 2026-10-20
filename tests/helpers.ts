import { randomUUID } from "node:crypto";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";

export async function createTestUser(overrides: Partial<typeof users.$inferInsert> = {}) {
  const [u] = await db
    .insert(users)
    .values({
      email: `t-${randomUUID()}@example.com`,
      passwordHash: "x",
      name: "Test User",
      emailVerifiedAt: new Date(),
      onboardedAt: new Date(),
      ...overrides,
    })
    .returning();
  return u;
}
