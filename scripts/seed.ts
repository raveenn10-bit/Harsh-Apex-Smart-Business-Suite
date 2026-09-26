import fs from 'fs';
import path from 'path';
import { getPGlite } from '../src/lib/db/pglite-engine';

async function seed() {
  console.log('========================================================');
  console.log('   HARSH APEX SMART BUSINESS SUITE - DATABASE SEEDER   ');
  console.log('========================================================\n');

  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  const migrationFiles = [
    '01_initial_schema.sql',
    '02_rls_policies.sql',
    '03_seed_packages_roles.sql',
    '04_seed_demo_accounts.sql',
    '05_seed_demo_workspaces_data.sql',
    '06_storage_buckets.sql',
    '07_auth_users_and_triggers.sql',
  ];

  console.log('[1/3] Generating supabase/combined_migration.sql for Supabase Cloud SQL Editor...');
  let combinedSql = `-- ============================================================\n`;
  combinedSql += `-- HARSH APEX SMART BUSINESS SUITE - COMPLETE MASTER MIGRATION\n`;
  combinedSql += `-- Run this script in your Supabase SQL Editor to seed everything:\n`;
  combinedSql += `-- https://supabase.com/dashboard/project/onwecvbitivvznezdflw/sql\n`;
  combinedSql += `-- ============================================================\n\n`;

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      combinedSql += `\n-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n`;
      combinedSql += `-- START OF ${file}\n`;
      combinedSql += `-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n\n`;
      combinedSql += content;
      combinedSql += `\n\n-- END OF ${file}\n`;
    }
  }

  const combinedPath = path.join(process.cwd(), 'supabase', 'combined_migration.sql');
  fs.writeFileSync(combinedPath, combinedSql, 'utf-8');
  console.log(`[PASS] Written consolidated migration to ${combinedPath}`);

  console.log('\n[2/3] Seeding local PostgreSQL database engine...');
  const db = await getPGlite();
  console.log('[PASS] Local database initialized and migrations applied successfully.');

  console.log('\n[3/3] Verifying records in database...');
  const packages = await db.query('SELECT code, name FROM packages ORDER BY code');
  console.log(`- Packages (${packages.rows.length}):`, packages.rows.map((p: any) => p.code).join(', '));

  const businesses = await db.query('SELECT name, slug FROM businesses ORDER BY slug');
  console.log(`- Businesses (${businesses.rows.length}):`, businesses.rows.map((b: any) => b.slug).join(', '));

  const profiles = await db.query('SELECT full_name, email FROM profiles ORDER BY email');
  console.log(`- Profiles (${profiles.rows.length}):`, profiles.rows.map((u: any) => u.email).join(', '));

  console.log('\n========================================================');
  console.log('   DATABASE SEED & MIGRATION GENERATION COMPLETE!       ');
  console.log('========================================================\n');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
