import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';

// Helper to manually parse .env.local without external dotenv package
function loadEnvLocal() {
  const envLocalPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const lines = fs.readFileSync(envLocalPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const equalsIdx = trimmed.indexOf('=');
      if (equalsIdx !== -1) {
        const key = trimmed.substring(0, equalsIdx).trim();
        const value = trimmed.substring(equalsIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnvLocal();

interface DemoUser {
  email: string;
  password: string;
  fullName: string;
  workspace: string;
  tier: string;
}

const DEMO_USERS: DemoUser[] = [
  {
    email: 'basic1@demo.harshapex.com.lk',
    password: 'BasicDemo@1',
    fullName: 'Kasun Perera',
    workspace: 'Apex Mart Colombo',
    tier: 'BASIC',
  },
  {
    email: 'basic2@demo.harshapex.com.lk',
    password: 'BasicDemo@2',
    fullName: 'Nadeesha Silva',
    workspace: 'Apex Express Kandy',
    tier: 'BASIC',
  },
  {
    email: 'business1@demo.harshapex.com.lk',
    password: 'BusinessDemo@1',
    fullName: 'Rohan Jayasinghe',
    workspace: 'Harsh Apex Tech Galle',
    tier: 'BUSINESS',
  },
  {
    email: 'business2@demo.harshapex.com.lk',
    password: 'BusinessDemo@2',
    fullName: 'Dilini Fernando',
    workspace: 'Apex Logistics Negombo',
    tier: 'BUSINESS',
  },
  {
    email: 'premium1@demo.harshapex.com.lk',
    password: 'PremiumDemo@1',
    fullName: 'Harshana Wickramasinghe',
    workspace: 'Apex Enterprise Holdings',
    tier: 'PREMIUM',
  },
  {
    email: 'premium2@demo.harshapex.com.lk',
    password: 'PremiumDemo@2',
    fullName: 'Tharindu Rathnayake',
    workspace: 'Apex Global Industrial',
    tier: 'PREMIUM',
  },
  {
    email: 'admin@harshapex.com.lk',
    password: 'ApexAdmin@2026',
    fullName: 'Harsh Apex Super Admin',
    workspace: 'Apex Enterprise Holdings (Global)',
    tier: 'SUPER_ADMIN',
  },
];

async function seedAuthUsers() {
  console.log('====================================================');
  console.log('HARSH APEX SMART BUSINESS SUITE - SUPABASE AUTH SEED');
  console.log('====================================================\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://onwecvbitivvznezdflw.supabase.co';
  const serviceRoleKey = process.argv[2] || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (serviceRoleKey) {
    console.log('✓ Found SUPABASE_SERVICE_ROLE_KEY. Using Supabase Auth Admin API (auto email confirm)...\n');
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    for (const u of DEMO_USERS) {
      process.stdout.write(`Creating user ${u.email}... `);
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.fullName },
      });

      if (error) {
        if (error.message.toLowerCase().includes('already') || error.message.toLowerCase().includes('exists')) {
          console.log('⚠️ Already exists (skipped)');
        } else {
          console.log(`❌ Error: ${error.message}`);
        }
      } else {
        console.log(`✓ Created (ID: ${data.user.id})`);
      }
    }
  } else {
    console.log('ℹ️ SUPABASE_SERVICE_ROLE_KEY not supplied.');
    console.log('Using Supabase Public Client (signUp API)...\n');
    const supabase = createClient(supabaseUrl, anonKey || '');

    for (const u of DEMO_USERS) {
      process.stdout.write(`Signing up ${u.email}... `);
      const { data, error } = await supabase.auth.signUp({
        email: u.email,
        password: u.password,
        options: {
          data: { full_name: u.fullName },
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes('already') || error.message.toLowerCase().includes('exists')) {
          console.log('⚠️ Already registered');
        } else {
          console.log(`❌ ${error.message}`);
        }
      } else {
        console.log(`✓ Registered (User: ${data.user?.id || 'pending'})`);
      }
    }

    console.log('\nTIP: To automatically confirm demo accounts without email verification, run:');
    console.log('  npx tsx scripts/seed-supabase-auth-users.ts <YOUR_SUPABASE_SERVICE_ROLE_KEY>');
    console.log('You can find the Service Role Key at:');
    console.log('  https://supabase.com/dashboard/project/onwecvbitivvznezdflw/settings/api\n');
  }

  console.log('====================================================');
  console.log('DEMO ACCOUNTS DIRECTORY');
  console.log('====================================================');
  DEMO_USERS.forEach(u => {
    console.log(`[${u.tier.padEnd(11)}] ${u.email.padEnd(35)} Pass: ${u.password.padEnd(16)} Workspace: ${u.workspace}`);
  });
  console.log('====================================================\n');
}

seedAuthUsers().catch(err => {
  console.error('Fatal error seeding auth users:', err);
  process.exit(1);
});
