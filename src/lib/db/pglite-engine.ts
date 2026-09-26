import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import { BUNDLED_MIGRATIONS } from './migrations-bundle';

let pgliteInstance: PGlite | null = null;
let initPromise: Promise<PGlite> | null = null;

export async function getPGlite(): Promise<PGlite> {
  if (pgliteInstance) return pgliteInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // Persistent directory or in-memory fallback for serverless
    const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
    let pg: PGlite;
    try {
      const dataDir = isServerless ? path.join('/tmp', '.db_pglite') : path.join(process.cwd(), '.db_pglite');
      pg = new PGlite(dataDir);
    } catch {
      pg = new PGlite();
    }

    try {
      // Check if schema already initialized
      const check = await pg.query<{ tbl: string | null }>("SELECT to_regclass('public.businesses') as tbl;");
      const exists = check.rows[0]?.tbl;

      if (!exists) {
        console.log('[PGlite] Initializing fresh PostgreSQL schema and demo seed data from bundle...');
        for (const migration of BUNDLED_MIGRATIONS) {
          try {
            await pg.exec(migration.sql);
            console.log(`[PGlite] Applied bundled migration: ${migration.name}`);
          } catch (err: unknown) {
            const error = err as Error;
            console.warn(`[PGlite] Warning in ${migration.name}: ${error.message}`);
          }
        }
      }
    } catch (err) {
      console.warn('[PGlite] Initialization warning:', err instanceof Error ? err.message : String(err));
    }

    pgliteInstance = pg;
    return pg;
  })();

  return initPromise;
}

export async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  try {
    const pg = await getPGlite();
    const res = await pg.query<T>(sql, params);
    return res.rows;
  } catch (err) {
    console.warn('[PGlite query warning]:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

export async function execute(sql: string): Promise<void> {
  try {
    const pg = await getPGlite();
    await pg.exec(sql);
  } catch (err) {
    console.warn('[PGlite execute warning]:', err instanceof Error ? err.message : String(err));
  }
}

