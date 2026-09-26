import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
import path from 'path';

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
        console.log('[PGlite] Initializing fresh PostgreSQL schema and seed data...');
        const migrationFiles = [
          '01_initial_schema.sql',
          '02_rls_policies.sql',
          '03_seed_packages_roles.sql',
          '04_seed_demo_accounts.sql',
          '05_seed_demo_workspaces_data.sql',
          '06_storage_buckets.sql',
          '07_auth_users_and_triggers.sql',
        ];

        for (const file of migrationFiles) {
          const filePath = path.join(process.cwd(), 'supabase', 'migrations', file);
          if (fs.existsSync(filePath)) {
            let sql = fs.readFileSync(filePath, 'utf-8');
            // Remove create extension commands if PGlite doesn't ship external extensions
            sql = sql.replace(/CREATE EXTENSION IF NOT EXISTS "uuid-ossp";/gi, '-- uuid-ossp built-in')
                     .replace(/CREATE EXTENSION IF NOT EXISTS "pgcrypto";/gi, '-- pgcrypto built-in');
            
            try {
              await pg.exec(sql);
              console.log(`[PGlite] Applied migration: ${file}`);
            } catch (err: unknown) {
              const error = err as Error;
              console.warn(`[PGlite] Warning in ${file}: ${error.message}`);
            }
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

