import { UserSession } from '@/types/database';

/**
 * Checks whether an authenticated user session has access to a specific feature flag.
 * Evaluates the real database package features attached to the user's workspace.
 */
export function hasFeature(session: UserSession | null | undefined, featureCode: string): boolean {
  if (!session) return false;
  // Super admin has access to everything
  if (session.role === 'SUPER_ADMIN') return true;
  return session.features.includes(featureCode);
}

/**
 * Checks whether an authenticated user has a specific operational role permission.
 * Package dictates what modules the tenant owns; Role dictates what actions the user can perform.
 */
export function hasPermission(session: UserSession | null | undefined, permissionCode: string): boolean {
  if (!session) return false;
  if (session.role === 'SUPER_ADMIN' || session.role === 'OWNER') return true;
  return session.permissions.includes(permissionCode);
}

/**
 * Returns required package tier for a feature code if locked.
 */
export function getRequiredPackageForFeature(featureCode: string): 'BASIC' | 'BUSINESS' | 'PREMIUM' {
  const businessFeatures = [
    'inventory_advanced',
    'crm',
    'quotations',
    'expenses',
    'finance',
    'staff',
    'whatsapp',
    'reports_advanced',
  ];

  const premiumFeatures = [
    'hr_advanced',
    'ai_assistant',
    'website_integration',
    'automation',
    'advanced_analytics',
    'activity_logs',
  ];

  if (premiumFeatures.includes(featureCode)) return 'PREMIUM';
  if (businessFeatures.includes(featureCode)) return 'BUSINESS';
  return 'BASIC';
}
