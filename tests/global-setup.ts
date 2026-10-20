import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { seedReferenceData } from "../src/scripts/seed-reference";

export default async function setup() {
  const base = process.env.DATABASE_URL ?? "postgres://prestio:prestio@localhost:5442/prestio";
  const testUrl = process.env.TEST_DATABASE_URL ?? base.replace(/\/[^/]+$/, "/prestio_test");
  const admin = postgres(base, { max: 1, onnotice: () => {} });
  const dbName = new URL(testUrl).pathname.slice(1);
  await admin.unsafe(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`);
  await admin.unsafe(`CREATE DATABASE ${dbName}`);
  await admin.end();

  const client = postgres(testUrl, { max: 1, onnotice: () => {} });
  await migrate(drizzle(client), { migrationsFolder: "db/migrations" });
  await seedReferenceData(client);
  await client.end();
}
