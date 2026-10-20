import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pgClient?: postgres.Sql };

const client =
  globalForDb.pgClient ??
  postgres(env.DATABASE_URL, {
    max: env.NODE_ENV === "production" ? 15 : 5,
    idle_timeout: 30,
    onnotice: () => {},
  });

if (env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema, casing: "snake_case" });
export type DB = typeof db;
export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
export type DbOrTx = DB | Tx;
export const pg = client;
export { schema };
