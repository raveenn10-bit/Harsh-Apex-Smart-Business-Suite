import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

// Supabase Migrations Runner for Harsh Apex Smart Business Suite
async function runMigrations() {
  const dbUrl = process.argv[2] || process.env.DATABASE_URL;

  console.log('====================================================');
  console.log('HARSH APEX SMART BUSINESS SUITE — SUPABASE MIGRATION');
  console.log('====================================================\n');

  if (!dbUrl) {
    console.error('❌ Error: No DATABASE_URL provided.');
    console.log('\nUsage:');
    console.log('  npx tsx scripts/apply-supabase-migrations.ts <DATABASE_URL>');
    console.log('or set DATABASE_URL in your .env.local file:');
    console.log('  DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres\n');
    console.log('Alternatively, you can copy the full SQL from:');
    console.log('  supabase/combined_migration.sql');
    console.log('and paste it into the Supabase Dashboard SQL Editor at:');
    console.log('  https://supabase.com/dashboard/project/onwecvbitivvznezdflw/sql/new\n');
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Connecting to Supabase PostgreSQL database...');
    await client.connect();
    console.log('✓ Successfully connected to PostgreSQL server!\n');

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
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ Warning: Migration file not found: ${file}`);
        continue;
      }

      console.log(`Executing migration: ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf-8');
      await client.query(sql);
      console.log(`✓ Migration applied: ${file}`);
    }

    console.log('\n====================================================');
    console.log('VERIFYING DATABASE ARCHITECTURE & RECORD COUNTS');
    console.log('====================================================\n');

    // 1. Verify tables
    const tableRes = await client.query<{ count: string }>(
      `SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';`
    );
    console.log(`✓ Public tables created: ${tableRes.rows[0].count} tables`);

    // 2. Verify Packages
    const pkgRes = await client.query<{ code: string; name: string }>(
      `SELECT code, name FROM packages ORDER BY price_monthly ASC;`
    );
    console.log(`✓ Packages verified (${pkgRes.rowCount}): ${pkgRes.rows.map(r => r.code).join(', ')}`);

    // 3. Verify Roles
    const roleRes = await client.query<{ code: string }>(
      `SELECT code FROM roles ORDER BY code ASC;`
    );
    console.log(`✓ Roles verified (${roleRes.rowCount}): ${roleRes.rows.map(r => r.code).join(', ')}`);

    // 4. Verify Demo Businesses
    const bizRes = await client.query<{ name: string; slug: string }>(
      `SELECT name, slug FROM businesses WHERE is_demo = true ORDER BY slug ASC;`
    );
    console.log(`✓ Demo Businesses verified (${bizRes.rowCount}):`);
    bizRes.rows.forEach(b => console.log(`   - ${b.name} (${b.slug})`));

    // 5. Verify Demo Profiles
    const profRes = await client.query<{ email: string; full_name: string }>(
      `SELECT email, full_name FROM profiles ORDER BY email ASC;`
    );
    console.log(`✓ Demo User Profiles verified (${profRes.rowCount}):`);
    profRes.rows.forEach(p => console.log(`   - ${p.email} (${p.full_name})`));

    // 6. Verify Products & Inventory
    const prodRes = await client.query<{ count: string }>(`SELECT count(*) FROM products;`);
    const invRes = await client.query<{ count: string }>(`SELECT count(*) FROM inventory;`);
    console.log(`✓ Products created: ${prodRes.rows[0].count} items`);
    console.log(`✓ Inventory records: ${invRes.rows[0].count} records`);

    // 7. Verify Orders & Invoices
    const ordRes = await client.query<{ count: string }>(`SELECT count(*) FROM orders;`);
    const invcRes = await client.query<{ count: string }>(`SELECT count(*) FROM invoices;`);
    console.log(`✓ Orders created: ${ordRes.rows[0].count} orders`);
    console.log(`✓ Invoices created: ${invcRes.rows[0].count} invoices`);

    // 8. Verify Storage Buckets
    const bucketRes = await client.query<{ id: string; name: string; public: boolean }>(
      `SELECT id, name, public FROM storage.buckets WHERE id IN ('product-images', 'customer-avatars', 'employee-avatars', 'business-logos', 'invoice-assets', 'demo-assets');`
    );
    console.log(`✓ Storage Buckets verified (${bucketRes.rowCount}):`);
    bucketRes.rows.forEach(b => console.log(`   - ${b.id} (public: ${b.public})`));

    console.log('\n🎉 ALL SUPABASE MIGRATIONS AND SEED DATA APPLIED SUCCESSFULLY!\n');
  } catch (err) {
    console.error('\n❌ Migration execution failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
