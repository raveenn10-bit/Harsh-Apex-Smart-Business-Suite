import fs from 'fs';
import path from 'path';

const files = [
  '01_initial_schema.sql',
  '02_rls_policies.sql',
  '03_seed_packages_roles.sql',
  '04_seed_demo_accounts.sql',
  '05_seed_demo_workspaces_data.sql',
  '06_storage_buckets.sql',
  '07_auth_users_and_triggers.sql'
];

let combined = '-- ============================================================\n';
combined += '-- HARSH APEX SMART BUSINESS SUITE - COMBINED MIGRATION SCRIPT\n';
combined += '-- Complete Multi-Tenant Database Architecture, RLS, Packages,\n';
combined += '-- Roles, Demo Data, Storage Buckets, and Supabase Auth Setup\n';
combined += '-- Brand: Harsh Apex Digital Solutions\n';
combined += '-- ============================================================\n\n';

for (const file of files) {
  const p = path.join(process.cwd(), 'supabase', 'migrations', file);
  combined += '\n-- >>>>>>>>>>>>>>>>>> BEGIN FILE: ' + file + ' <<<<<<<<<<<<<<<<<<\n\n';
  combined += fs.readFileSync(p, 'utf-8');
  combined += '\n\n-- >>>>>>>>>>>>>>>>>> END FILE: ' + file + ' <<<<<<<<<<<<<<<<<<\n\n';
}

fs.writeFileSync(path.join(process.cwd(), 'supabase', 'combined_migration.sql'), combined);
console.log('Successfully generated combined_migration.sql! Total bytes:', combined.length);
