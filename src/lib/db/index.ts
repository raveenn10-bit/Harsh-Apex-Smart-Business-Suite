import { query, execute, getPGlite } from './engine';
import { createAdminClient } from '../supabase/admin';

export { query, execute, getPGlite };


/**
 * Universal query function: works seamlessly whether using local PGlite
 * or remote Supabase PostgreSQL.
 */
export async function dbQuery<T = Record<string, unknown>>(
  sqlText: string,
  params: unknown[] = []
): Promise<T[]> {
  return query<T>(sqlText, params);
}

/**
 * Get tenant workspace information with full package details
 */
export async function getBusinessById(businessId: string) {
  const rows = await query<{
    id: string;
    name: string;
    slug: string;
    package_id: string;
    package_code: 'BASIC' | 'BUSINESS' | 'PREMIUM';
    package_name: string;
    logo_url: string | null;
    currency: string;
    currency_symbol: string;
    business_type: string;
    is_demo: boolean;
  }>(
    `SELECT b.*, p.code as package_code, p.name as package_name
     FROM businesses b
     JOIN packages p ON b.package_id = p.id
     WHERE b.id = $1 LIMIT 1`,
    [businessId]
  );
  return rows[0] || null;
}

/**
 * Get enabled features for a given package
 */
export async function getPackageFeatures(packageId: string): Promise<string[]> {
  const rows = await query<{ code: string }>(
    `SELECT f.code
     FROM features f
     JOIN package_features pf ON f.id = pf.feature_id
     WHERE pf.package_id = $1 AND pf.is_enabled = true`,
    [packageId]
  );
  return rows.map(r => r.code);
}

/**
 * Get role permissions for a given role
 */
export async function getRolePermissions(roleId: string): Promise<string[]> {
  const rows = await query<{ code: string }>(
    `SELECT p.code
     FROM permissions p
     JOIN role_permissions rp ON p.id = rp.permission_id
     WHERE rp.role_id = $1`,
    [roleId]
  );
  return rows.map(r => r.code);
}
