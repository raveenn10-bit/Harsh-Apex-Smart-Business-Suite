import { query } from '../src/lib/db';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';

// Helper to manually parse .env.local
function loadEnv() {
  const envLocalPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const lines = fs.readFileSync(envLocalPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq !== -1) {
        const k = trimmed.substring(0, eq).trim();
        const v = trimmed.substring(eq + 1).trim();
        if (!process.env[k]) process.env[k] = v;
      }
    }
  }
}
loadEnv();

async function check() {
  console.log('====================================================');
  console.log('CHECKING DATABASE USER PROFILES & SUPABASE USERS');
  console.log('====================================================\n');

  // 1. Check Profiles in Database
  try {
    const profiles = await query<{
      id: string;
      email: string;
      full_name: string;
      role_code: string;
      business_name: string;
      package_code: string;
    }>(
      `SELECT p.id, p.email, p.full_name, r.code as role_code, b.name as business_name, pkg.code as package_code
       FROM profiles p
       JOIN businesses b ON p.business_id = b.id
       JOIN packages pkg ON b.package_id = pkg.id
       JOIN roles r ON p.role_id = r.id
       ORDER BY p.email ASC;`
    );

    console.log(`✓ Profiles in Application Database (${profiles.length} found):`);
    profiles.forEach(p => {
      console.log(`  - [${p.package_code.padEnd(8)}] ${p.email.padEnd(35)} | Role: ${p.role_code.padEnd(11)} | Business: ${p.business_name}`);
    });
  } catch (err: any) {
    console.error('Error querying profiles:', err.message);
  }

  // 2. Check Supabase Cloud Connection & Auth Status
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('\n----------------------------------------------------');
  console.log('SUPABASE CLOUD AUTHENTICATION CONFIGURATION');
  console.log('----------------------------------------------------');
  console.log(`Supabase URL      : ${supabaseUrl}`);
  console.log(`Anon Key Present  : ${!!anonKey} (${anonKey?.slice(0, 15)}...)`);
  console.log(`Service Key Present: ${!!serviceKey}`);

  if (serviceKey) {
    try {
      const supabaseAdmin = createClient(supabaseUrl!, serviceKey);
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error) {
        console.log(`Supabase Auth Admin Error: ${error.message}`);
      } else {
        console.log(`✓ Supabase Cloud Auth Users (${data.users.length} registered in GoTrue):`);
        data.users.forEach(u => console.log(`  - ${u.email} (confirmed: ${!!u.email_confirmed_at})`));
      }
    } catch (err: any) {
      console.log('Could not list GoTrue users via service key:', err.message);
    }
  } else {
    console.log('\nNote: To check or manage auth.users directly via GoTrue Admin API from script,');
    console.log('add SUPABASE_SERVICE_ROLE_KEY to .env.local.');
  }

  console.log('\n====================================================\n');
  process.exit(0);
}

check();
