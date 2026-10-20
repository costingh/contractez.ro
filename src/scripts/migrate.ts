import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL lipsește");
  const client = postgres(url, { max: 1, onnotice: () => {} });
  const db = drizzle(client);
  const folder = process.env.MIGRATIONS_DIR ?? "db/migrations";
  console.log(`Rulez migrările din ${folder}…`);
  await migrate(db, { migrationsFolder: folder });
  console.log("Migrări aplicate.");
  if (process.env.SEED_ON_MIGRATE !== "false") {
    const { seedReferenceData } = await import("./seed-reference");
    await seedReferenceData(client);
  }
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
