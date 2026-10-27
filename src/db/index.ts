import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

let pool: Pool | null = null;

function getPool(connectionString: string): Pool {
  if (!pool) {
    pool = new Pool({ connectionString });
  }
  return pool;
}

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return null;
  }
  return drizzle(getPool(url), { schema });
}

export type DbClient = NonNullable<ReturnType<typeof getDb>>;
