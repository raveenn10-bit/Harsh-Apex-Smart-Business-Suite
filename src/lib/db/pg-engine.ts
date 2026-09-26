/**
 * Production PostgreSQL engine using `pg` connection pool.
 * Used when DATABASE_URL environment variable is set (Vercel / Supabase production).
 *
 * DATABASE_URL format:
 *   postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
 *
 * Use the Supabase "Transaction Mode" pooler URL (port 6543) for serverless.
 */
import { Pool } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Please add your Supabase PostgreSQL connection string in Vercel Environment Variables.'
    );
  }

  pool = new Pool({
    connectionString,
    // Vercel serverless: keep connection count low
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    // Required for Supabase pooler (Transaction mode)
    ssl: { rejectUnauthorized: false },
  });

  pool.on('error', (err) => {
    console.error('[pg-engine] Unexpected pool error:', err.message);
  });

  return pool;
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const client = getPool();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await client.query<any>(sql, params as never);
  return result.rows as T[];
}


export async function execute(sql: string): Promise<void> {
  const client = getPool();
  await client.query(sql);
}
