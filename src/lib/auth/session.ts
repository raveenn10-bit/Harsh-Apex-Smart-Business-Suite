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

/**
 * Fetch full UserSession directly from PostgreSQL database records.
 * Packages, features, role, and business are NEVER inferred from email strings.
 */
export async function buildUserSessionByEmail(email: string): Promise<UserSession | null> {
  const normalizedEmail = email.toLowerCase().trim();

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

  if (!profileRows || profileRows.length === 0) {
    return null;
  }

  const profile = profileRows[0];

  // 2. Fetch business workspace and package from DB
  const business = await getBusinessById(profile.business_id);
  if (!business) {
    return null;
  }

  // 3. Fetch all enabled features for this package from DB
  const features = await getPackageFeatures(business.package_id);

  // 4. Fetch all permissions for this role from DB
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

