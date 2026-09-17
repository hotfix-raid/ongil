import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __ongilDbPool: Pool | undefined;
}

function createPool(): Pool {
  const pool = new Pool({
    host: process.env.SUPABASE_DB_HOST ?? "aws-0-ap-northeast-2.pooler.supabase.com",
    // Transaction-mode pooler (6543). Session mode (5432) caps clients at pool_size (15),
    // which serverless instances exhaust quickly → EMAXCONNSESSION 500s.
    port: Number(process.env.SUPABASE_DB_PORT ?? 6543),
    database: "postgres",
    user: process.env.SUPABASE_DB_USER ?? "postgres.trhyuntncdckzrqbkdwa",
    password: process.env.SUPABASE_DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 10_000,
  });
  // An idle client dropped by the pooler emits 'error'; unhandled, it crashes the function.
  pool.on("error", (e) => console.error("Idle DB client error", e));
  return pool;
}

export const pool: Pool =
  globalThis.__ongilDbPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalThis.__ongilDbPool = pool;
}

export default pool;
