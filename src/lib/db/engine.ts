/**
 * Dual-engine query layer:
 * - LOCAL / DEV: PGlite (embedded PostgreSQL — no external DB needed)
 * - PRODUCTION / VERCEL: Supabase PostgreSQL via `pg` pool (DATABASE_URL)
 */

function isProductionDB(): boolean {
  return !!(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql'));
}

type DbEngine = {
  query: <T>(sql: string, params: unknown[]) => Promise<T[]>;
  execute: (sql: string) => Promise<void>;
};

let cachedEngine: DbEngine | null = null;

async function getEngine(): Promise<DbEngine> {
  if (cachedEngine) return cachedEngine;

  if (isProductionDB()) {
    const m = await import('./pg-engine');
    cachedEngine = { query: m.query, execute: m.execute };
  } else {
    const m = await import('./pglite-engine');
    cachedEngine = { query: m.query, execute: m.execute };
  }

  return cachedEngine;
}

export async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  const engine = await getEngine();
  return engine.query<T>(sql, params);
}

export async function execute(sql: string): Promise<void> {
  const engine = await getEngine();
  return engine.execute(sql);
}

// Keep getPGlite export for legacy references (only used locally)
export async function getPGlite() {
  const { getPGlite: _getPGlite } = await import('./pglite-engine');
  return _getPGlite();
}
