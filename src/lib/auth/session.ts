import { cookies } from 'next/headers';
import { query, getBusinessById, getPackageFeatures, getRolePermissions } from '../db';
import { UserSession, RoleCode, PackageCode } from '@/types/database';

// Demo Credentials Registry (for demo login verification)
export const DEMO_CREDENTIALS: Record<string, { password: string; role: RoleCode; defaultWorkspace: string }> = {
  'basic1@demo.harshapex.com.lk': {
    password: 'BasicDemo@1',
    role: 'OWNER',
    defaultWorkspace: 'a1000000-0000-0000-0000-000000000001',
  },
  'basic2@demo.harshapex.com.lk': {
    password: 'BasicDemo@2',
    role: 'OWNER',
    defaultWorkspace: 'a2000000-0000-0000-0000-000000000002',
  },
  'business1@demo.harshapex.com.lk': {
    password: 'BusinessDemo@1',
    role: 'OWNER',
    defaultWorkspace: 'a3000000-0000-0000-0000-000000000003',
  },
  'business2@demo.harshapex.com.lk': {
    password: 'BusinessDemo@2',
    role: 'OWNER',
    defaultWorkspace: 'a4000000-0000-0000-0000-000000000004',
  },
  'premium1@demo.harshapex.com.lk': {
    password: 'PremiumDemo@1',
    role: 'OWNER',
    defaultWorkspace: 'a5000000-0000-0000-0000-000000000005',
  },
  'premium2@demo.harshapex.com.lk': {
    password: 'PremiumDemo@2',
    role: 'OWNER',
    defaultWorkspace: 'a6000000-0000-0000-0000-000000000006',
  },
  'admin@harshapex.com.lk': {
    password: 'ApexAdmin@2026',
    role: 'SUPER_ADMIN',
    defaultWorkspace: 'a5000000-0000-0000-0000-000000000005',
  },
};

// ─── Deterministic Demo Session Fallbacks ───────────────────────────────────
// Guarantees all 6 demo accounts + super admin always log in cleanly, even if
// database is cold, migrating, or on read-only serverless environment.

const BASIC_FEATURES = [
  'dashboard',
  'pos',
  'products',
  'inventory_basic',
  'customers',
  'invoices',
  'reports_basic',
];

const BUSINESS_FEATURES = [
  ...BASIC_FEATURES,
  'inventory_advanced',
  'crm',
  'quotations',
  'expenses',
  'finance',
  'staff',
  'whatsapp',
  'reports_advanced',
];

const PREMIUM_FEATURES = [
  ...BUSINESS_FEATURES,
  'hr_advanced',
  'ai_assistant',
  'website_integration',
  'automation',
  'advanced_analytics',
  'activity_logs',
];

const OWNER_PERMISSIONS = [
  'view_dashboard',
  'use_pos',
  'manage_products',
  'manage_inventory',
  'view_reports',
  'manage_customers',
  'manage_quotations',
  'manage_expenses',
  'manage_staff',
  'manage_settings',
];

const SUPER_ADMIN_PERMISSIONS = [
  ...OWNER_PERMISSIONS,
  'manage_super_admin',
];

export const FALLBACK_DEMO_SESSIONS: Record<string, UserSession> = {
  'basic1@demo.harshapex.com.lk': {
    user_id: 'c1000000-0000-0000-0000-000000000001',
    profile_id: 'c1000000-0000-0000-0000-000000000001',
    email: 'basic1@demo.harshapex.com.lk',
    full_name: 'Kasun Perera',
    avatar_url: '/demo-assets/avatars/user-basic1.webp',
    role: 'OWNER',
    business_id: 'a1000000-0000-0000-0000-000000000001',
    business_name: 'DEMO_BASIC_01 - Apex Mart Colombo',
    business_slug: 'demo-basic-01',
    package_code: 'BASIC',
    package_name: 'Harsh Apex Basic Suite',
    currency: 'LKR',
    currency_symbol: 'Rs. ',
    features: BASIC_FEATURES,
    permissions: OWNER_PERMISSIONS,
  },
  'basic2@demo.harshapex.com.lk': {
    user_id: 'c2000000-0000-0000-0000-000000000002',
    profile_id: 'c2000000-0000-0000-0000-000000000002',
    email: 'basic2@demo.harshapex.com.lk',
    full_name: 'Nadeesha Silva',
    avatar_url: '/demo-assets/avatars/user-basic2.webp',
    role: 'OWNER',
    business_id: 'a2000000-0000-0000-0000-000000000002',
    business_name: 'DEMO_BASIC_02 - Apex Express Kandy',
    business_slug: 'demo-basic-02',
    package_code: 'BASIC',
    package_name: 'Harsh Apex Basic Suite',
    currency: 'LKR',
    currency_symbol: 'Rs. ',
    features: BASIC_FEATURES,
    permissions: OWNER_PERMISSIONS,
  },
  'business1@demo.harshapex.com.lk': {
    user_id: 'c3000000-0000-0000-0000-000000000003',
    profile_id: 'c3000000-0000-0000-0000-000000000003',
    email: 'business1@demo.harshapex.com.lk',
    full_name: 'Rohan Jayasinghe',
    avatar_url: '/demo-assets/avatars/user-business1.webp',
    role: 'OWNER',
    business_id: 'a3000000-0000-0000-0000-000000000003',
    business_name: 'DEMO_BUSINESS_01 - Harsh Apex Tech Galle',
    business_slug: 'demo-business-01',
    package_code: 'BUSINESS',
    package_name: 'Harsh Apex Business Suite',
    currency: 'LKR',
    currency_symbol: 'Rs. ',
    features: BUSINESS_FEATURES,
    permissions: OWNER_PERMISSIONS,
  },
  'business2@demo.harshapex.com.lk': {
    user_id: 'c4000000-0000-0000-0000-000000000004',
    profile_id: 'c4000000-0000-0000-0000-000000000004',
    email: 'business2@demo.harshapex.com.lk',
    full_name: 'Dilini Fernando',
    avatar_url: '/demo-assets/avatars/user-business2.webp',
    role: 'OWNER',
    business_id: 'a4000000-0000-0000-0000-000000000004',
    business_name: 'DEMO_BUSINESS_02 - Apex Logistics Negombo',
    business_slug: 'demo-business-02',
    package_code: 'BUSINESS',
    package_name: 'Harsh Apex Business Suite',
    currency: 'LKR',
    currency_symbol: 'Rs. ',
    features: BUSINESS_FEATURES,
    permissions: OWNER_PERMISSIONS,
  },
  'premium1@demo.harshapex.com.lk': {
    user_id: 'c5000000-0000-0000-0000-000000000005',
    profile_id: 'c5000000-0000-0000-0000-000000000005',
    email: 'premium1@demo.harshapex.com.lk',
    full_name: 'Harshana Wickramasinghe',
    avatar_url: '/demo-assets/avatars/user-premium1.webp',
    role: 'OWNER',
    business_id: 'a5000000-0000-0000-0000-000000000005',
    business_name: 'DEMO_PREMIUM_01 - Apex Enterprise Holdings',
    business_slug: 'demo-premium-01',
    package_code: 'PREMIUM',
    package_name: 'Harsh Apex Premium Enterprise',
    currency: 'LKR',
    currency_symbol: 'Rs. ',
    features: PREMIUM_FEATURES,
    permissions: OWNER_PERMISSIONS,
  },
  'premium2@demo.harshapex.com.lk': {
    user_id: 'c6000000-0000-0000-0000-000000000006',
    profile_id: 'c6000000-0000-0000-0000-000000000006',
    email: 'premium2@demo.harshapex.com.lk',
    full_name: 'Tharindu Rathnayake',
    avatar_url: '/demo-assets/avatars/user-premium2.webp',
    role: 'OWNER',
    business_id: 'a6000000-0000-0000-0000-000000000006',
    business_name: 'DEMO_PREMIUM_02 - Apex Global Industrial',
    business_slug: 'demo-premium-02',
    package_code: 'PREMIUM',
    package_name: 'Harsh Apex Premium Enterprise',
    currency: 'LKR',
    currency_symbol: 'Rs. ',
    features: PREMIUM_FEATURES,
    permissions: OWNER_PERMISSIONS,
  },
  'admin@harshapex.com.lk': {
    user_id: 'c9000000-0000-0000-0000-000000000009',
    profile_id: 'c9000000-0000-0000-0000-000000000009',
    email: 'admin@harshapex.com.lk',
    full_name: 'Harsh Apex Super Admin',
    avatar_url: '/demo-assets/avatars/user-admin.webp',
    role: 'SUPER_ADMIN',
    business_id: 'a5000000-0000-0000-0000-000000000005',
    business_name: 'DEMO_PREMIUM_01 - Apex Enterprise Holdings',
    business_slug: 'demo-premium-01',
    package_code: 'PREMIUM',
    package_name: 'Harsh Apex Premium Enterprise',
    currency: 'LKR',
    currency_symbol: 'Rs. ',
    features: PREMIUM_FEATURES,
    permissions: SUPER_ADMIN_PERMISSIONS,
  },
};

/**
 * Fetch full UserSession directly from PostgreSQL database records.
 * Falls back to deterministic demo sessions if database is unreachable or cold.
 */
export async function buildUserSessionByEmail(email: string): Promise<UserSession | null> {
  const normalizedEmail = email.toLowerCase().trim();

  try {
    // 1. Fetch user profile + role + business from DB
    const profileRows = await query<{
      id: string;
      user_id: string | null;
      full_name: string;
      email: string;
      avatar_url: string | null;
      role_id: string;
      role_code: RoleCode;
      business_id: string;
    }>(
      `SELECT p.id, p.user_id, p.full_name, p.email, p.avatar_url, p.role_id, p.business_id,
              r.code as role_code
       FROM profiles p
       JOIN roles r ON p.role_id = r.id
       WHERE LOWER(p.email) = $1 LIMIT 1`,
      [normalizedEmail]
    );

    if (profileRows && profileRows.length > 0) {
      const profile = profileRows[0];
      const business = await getBusinessById(profile.business_id);
      if (business) {
        const features = await getPackageFeatures(business.package_id);
        const permissions = await getRolePermissions(profile.role_id);
        return {
          user_id: profile.user_id || profile.id,
          profile_id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          role: profile.role_code,
          business_id: business.id,
          business_name: business.name,
          business_slug: business.slug,
          package_code: business.package_code,
          package_name: business.package_name,
          currency: business.currency,
          currency_symbol: business.currency_symbol,
          features,
          permissions,
        };
      }
    }
  } catch (err) {
    console.warn('[Session DB Lookup Warning]:', err instanceof Error ? err.message : String(err));
  }

  // Guaranteed fallback for demo users: ensures 100% login reliability on Vercel/serverless
  if (FALLBACK_DEMO_SESSIONS[normalizedEmail]) {
    return FALLBACK_DEMO_SESSIONS[normalizedEmail];
  }

  return null;
}

/**
 * Validates login credentials and returns session if valid
 */
export async function authenticateUser(email: string, password: string): Promise<UserSession | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const demoEntry = DEMO_CREDENTIALS[normalizedEmail];

  if (!demoEntry) {
    return null;
  }

  if (demoEntry.password !== password) {
    return null;
  }

  return buildUserSessionByEmail(normalizedEmail);
}

const SESSION_COOKIE_NAME = 'harsh_apex_session';

/**
 * Retrieves the currently logged in session in Server Components and Route Handlers
 */
export async function getCurrentSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return null;
    }

    const email = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
    return await buildUserSessionByEmail(email);
  } catch {
    return null;
  }
}

/**
 * Sets session cookie for authenticated user
 */
export async function setSessionCookie(email: string) {
  const cookieStore = await cookies();
  const encoded = Buffer.from(email.toLowerCase().trim()).toString('base64');
  cookieStore.set(SESSION_COOKIE_NAME, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_APP_URL?.startsWith('http://localhost') && !process.env.NEXT_PUBLIC_APP_URL?.startsWith('http://127.0.0.1'),
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Clears session cookie on logout
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Reusable server-side helper: Retrieves the authenticated user profile
 */
export async function getCurrentUser() {
  const session = await getCurrentSession();
  if (!session) return null;
  return {
    id: session.user_id,
    profile_id: session.profile_id,
    email: session.email,
    full_name: session.full_name,
    avatar_url: session.avatar_url,
    role: session.role,
    business_id: session.business_id,
  };
}

/**
 * Reusable server-side helper: Retrieves the authenticated business workspace
 */
export async function getCurrentBusiness() {
  const session = await getCurrentSession();
  if (!session) return null;
  return {
    id: session.business_id,
    name: session.business_name,
    slug: session.business_slug,
    package_code: session.package_code,
    package_name: session.package_name,
    currency: session.currency,
    currency_symbol: session.currency_symbol,
    features: session.features,
  };
}

/**
 * Reusable server-side helper: Checks if current session has a feature
 */
export async function hasFeature(featureCode: string): Promise<boolean> {
  const session = await getCurrentSession();
  if (!session) return false;
  if (session.role === 'SUPER_ADMIN') return true;
  return session.features.includes(featureCode);
}

/**
 * Reusable server-side helper: Checks if current session has a permission
 */
export async function hasPermission(permissionCode: string): Promise<boolean> {
  const session = await getCurrentSession();
  if (!session) return false;
  if (session.role === 'SUPER_ADMIN' || session.role === 'OWNER') return true;
  return session.permissions.includes(permissionCode);
}

/**
 * Reusable server-side helper: Enforces a required feature flag
 */
export async function requireFeature(featureCode: string) {
  const allowed = await hasFeature(featureCode);
  if (!allowed) {
    throw new Error(`Forbidden: feature '${featureCode}' requires an upgrade`);
  }
}

/**
 * Reusable server-side helper: Enforces a required operational role permission
 */
export async function requirePermission(permissionCode: string) {
  const allowed = await hasPermission(permissionCode);
  if (!allowed) {
    throw new Error(`Forbidden: insufficient permission '${permissionCode}'`);
  }
}

