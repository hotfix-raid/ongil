import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __ongilDbPool: Pool | undefined;
}

function createPool(): Pool {
  return new Pool({
    host: process.env.SUPABASE_DB_HOST ?? "aws-0-ap-northeast-2.pooler.supabase.com",
    port: 5432,
    database: "postgres",
    user: process.env.SUPABASE_DB_USER ?? "postgres.trhyuntncdckzrqbkdwa",
    password: process.env.SUPABASE_DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
  });
}

export const pool: Pool =
  globalThis.__ongilDbPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalThis.__ongilDbPool = pool;
}

export default pool;
