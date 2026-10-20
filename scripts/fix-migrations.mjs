// drizzle-kit pune tipurile custom între ghilimele ("geography(Point, 4326)"), ceea ce
// Postgres interpretează ca identificator. Scoatem ghilimelele după fiecare `db:generate`.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = "db/migrations";
for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql"))) {
  const path = join(dir, file);
  const before = readFileSync(path, "utf8");
  const after = before
    .replaceAll('"geography(Point, 4326)"', "geography(Point, 4326)")
    .replaceAll('"tsvector"', "tsvector");
  if (after !== before) {
    writeFileSync(path, after);
    console.log(`fixed ${file}`);
  }
}
