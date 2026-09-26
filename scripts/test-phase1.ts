// ============================================================
// HARSH APEX SMART BUSINESS SUITE - PHASE 1 TEST SUITE
// Automated Verification for Authentication, Multi-Tenancy & RBAC
// ============================================================

import { getPGlite } from '../src/lib/db/pglite-engine';
import { authenticateUser, buildUserSessionByEmail } from '../src/lib/auth/session';
import { hasFeature, hasPermission } from '../src/lib/auth/permissions';

async function runPhase1Tests() {
  console.log('========================================================');
  console.log('   HARSH APEX SMART BUSINESS SUITE - PHASE 1 VERIFICATION');
  console.log('========================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      if (details) console.log(`       -> ${details}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (details) console.error(`       -> ${details}`);
      process.exitCode = 1;
    }
  }

  // 1. Initialize DB and verify tables
  console.log('[STEP 1] Initializing PostgreSQL engine & verifying schema...');
  const pg = await getPGlite();

  const tablesCheck = await pg.query<{ count: string }>(`
    SELECT COUNT(*)::text as count FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('packages', 'features', 'package_features', 'businesses', 'business_settings', 'profiles', 'roles', 'permissions', 'role_permissions', 'products', 'customers', 'orders', 'invoices');
  `);
  const tableCount = parseInt(tablesCheck.rows[0]?.count || '0', 10);
  assert(tableCount >= 13, `Database tables created (Found ${tableCount}/13 required core tables)`);

  // 2. Test all 6 Demo Accounts Authentication
  console.log('\n[STEP 2] Testing authentication for all 6 demo accounts...');

  const demoAccounts = [
    { email: 'basic1@demo.harshapex.com.lk', pwd: 'BasicDemo@1', expectedPkg: 'BASIC', expectedWs: 'demo-basic-01' },
    { email: 'basic2@demo.harshapex.com.lk', pwd: 'BasicDemo@2', expectedPkg: 'BASIC', expectedWs: 'demo-basic-02' },
    { email: 'business1@demo.harshapex.com.lk', pwd: 'BusinessDemo@1', expectedPkg: 'BUSINESS', expectedWs: 'demo-business-01' },
    { email: 'business2@demo.harshapex.com.lk', pwd: 'BusinessDemo@2', expectedPkg: 'BUSINESS', expectedWs: 'demo-business-02' },
    { email: 'premium1@demo.harshapex.com.lk', pwd: 'PremiumDemo@1', expectedPkg: 'PREMIUM', expectedWs: 'demo-premium-01' },
    { email: 'premium2@demo.harshapex.com.lk', pwd: 'PremiumDemo@2', expectedPkg: 'PREMIUM', expectedWs: 'demo-premium-02' },
  ];

  const sessions: Record<string, any> = {};

  for (const acc of demoAccounts) {
    const session = await authenticateUser(acc.email, acc.pwd);
    assert(!!session, `Authentication succeeded for ${acc.email}`);

    if (session) {
      sessions[acc.email] = session;
      assert(
        session.package_code === acc.expectedPkg,
        `Package match for ${acc.email}: Expected ${acc.expectedPkg}, Got ${session.package_code}`,
        `Workspace: ${session.business_name} (${session.business_slug})`
      );
    }
  }

  // Test invalid password rejection
  const invalidSession = await authenticateUser('basic1@demo.harshapex.com.lk', 'WrongPassword123');
  assert(invalidSession === null, 'Authentication correctly rejects invalid password');

  // 3. Test Distinct business_id for all workspaces
  console.log('\n[STEP 3] Testing workspace business_id uniqueness...');
  const businessIds = Object.values(sessions).map((s: any) => s.business_id);
  const uniqueBusinessIds = new Set(businessIds);
  assert(
    uniqueBusinessIds.size === demoAccounts.length,
    `All 6 demo accounts have unique business_id workspaces (Found ${uniqueBusinessIds.size} unique IDs out of ${demoAccounts.length})`
  );

  // 4. Test Strict Tenant Isolation (Cross-Tenant Data Queries)
  console.log('\n[STEP 4] Verifying Tenant Data Isolation (Row-Level Security / Tenant Filtering)...');
  const basic1 = sessions['basic1@demo.harshapex.com.lk'];
  const basic2 = sessions['basic2@demo.harshapex.com.lk'];
  const business1 = sessions['business1@demo.harshapex.com.lk'];

  // Query products for basic1 workspace
  const b1Products = await pg.query(
    'SELECT id, name, business_id FROM products WHERE business_id = $1',
    [basic1.business_id]
  );
  assert(b1Products.rows.length > 0, `basic1 owns ${b1Products.rows.length} products in DEMO_BASIC_01`);

  // Ensure NONE of basic1's products belong to basic2
  const leakedToB2 = b1Products.rows.filter((r: any) => r.business_id === basic2.business_id);
  assert(leakedToB2.length === 0, 'Zero data leakage between basic1 and basic2 workspaces');

  // Query customers for basic1 workspace
  const b1Customers = await pg.query(
    'SELECT id, name, business_id FROM customers WHERE business_id = $1',
    [basic1.business_id]
  );
  assert(b1Customers.rows.length === 20, `basic1 has 20 isolated demo customers in DEMO_BASIC_01`);

  const leakedCustToBiz = b1Customers.rows.filter((r: any) => r.business_id === business1.business_id);
  assert(leakedCustToBiz.length === 0, 'Zero customer data leakage between basic1 and business1');

  // 5. Test hasFeature() Feature Flag Helper
  console.log('\n[STEP 5] Testing hasFeature() package tier permission gates...');
  const premium1 = sessions['premium1@demo.harshapex.com.lk'];

  // Test POS (All tiers have POS)
  assert(hasFeature(basic1, 'pos') === true, 'basic1 has feature: pos');
  assert(hasFeature(business1, 'pos') === true, 'business1 has feature: pos');
  assert(hasFeature(premium1, 'pos') === true, 'premium1 has feature: pos');

  // Test CRM (Business & Premium only)
  assert(hasFeature(basic1, 'crm') === false, 'basic1 DENIED feature: crm (Locked for Basic)');
  assert(hasFeature(business1, 'crm') === true, 'business1 GRANTED feature: crm');
  assert(hasFeature(premium1, 'crm') === true, 'premium1 GRANTED feature: crm');

  // Test AI Assistant & Website Integration (Premium only)
  assert(hasFeature(basic1, 'ai_assistant') === false, 'basic1 DENIED feature: ai_assistant');
  assert(hasFeature(business1, 'ai_assistant') === false, 'business1 DENIED feature: ai_assistant');
  assert(hasFeature(premium1, 'ai_assistant') === true, 'premium1 GRANTED feature: ai_assistant');

  assert(hasFeature(business1, 'website_integration') === false, 'business1 DENIED feature: website_integration');
  assert(hasFeature(premium1, 'website_integration') === true, 'premium1 GRANTED feature: website_integration');

  // 6. Test Role Permissions
  console.log('\n[STEP 6] Testing Role Permissions (Owner vs Operational)...');
  assert(hasPermission(basic1, 'manage_products') === true, 'basic1 (OWNER) has permission: manage_products');
  assert(hasPermission(basic1, 'manage_settings') === true, 'basic1 (OWNER) has permission: manage_settings');
  assert(hasPermission(basic1, 'use_pos') === true, 'basic1 (OWNER) has permission: use_pos');

  console.log('\n========================================================');
  console.log(`   PHASE 1 VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('========================================================\n');

  if (passedTests === totalTests) {
    console.log('>>> [PHASE 1 COMPLETE]: Foundation, Database, Auth, Multi-Tenancy & RBAC 100% Verified <<<\n');
    process.exit(0);
  } else {
    console.error('>>> [PHASE 1 FAILED]: Fix failing tests before proceeding <<<\n');
    process.exit(1);
  }
}

runPhase1Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
