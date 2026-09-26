-- ============================================================
-- HARSH APEX SMART BUSINESS SUITE - 03_SEED_PACKAGES_ROLES.SQL
-- Seed Packages, Features, Package-Features, Roles, Permissions
-- (All UUIDs strictly use valid hex [0-9a-f])
-- ============================================================

-- 1. SEED PACKAGES
INSERT INTO packages (id, code, name, description, price_monthly, price_annual) VALUES
('b1000000-0000-0000-0000-000000000001', 'BASIC', 'Harsh Apex Basic Suite', 'Essential smart business solution for small retailers & startups', 4500.00, 48000.00),
('b2000000-0000-0000-0000-000000000002', 'BUSINESS', 'Harsh Apex Business Suite', 'Complete business engine with CRM, advanced inventory & financial tools', 9500.00, 102000.00),
('b3000000-0000-0000-0000-000000000003', 'PREMIUM', 'Harsh Apex Premium Enterprise', 'Ultimate enterprise suite with AI business intelligence, advanced HR & automation', 18500.00, 198000.00)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_annual = EXCLUDED.price_annual;

-- 2. SEED FEATURES
INSERT INTO features (id, code, name, category, description, min_package) VALUES
('f0000001-0000-0000-0000-000000000001', 'dashboard', 'Dashboard Overview', 'core', 'Business performance KPI dashboard', 'BASIC'),
('f0000002-0000-0000-0000-000000000002', 'pos', 'Point of Sale (POS)', 'sales', 'Fast checkout, barcode scanner, multi-tender billing', 'BASIC'),
('f0000003-0000-0000-0000-000000000003', 'products', 'Product Catalog', 'inventory', 'Product items, pricing, SKUs, barcode tracking', 'BASIC'),
('f0000004-0000-0000-0000-000000000004', 'inventory_basic', 'Basic Inventory', 'inventory', 'Stock counts, stock in/out, low stock thresholds', 'BASIC'),
('f0000005-0000-0000-0000-000000000005', 'customers', 'Customer Directory', 'crm', 'Customer contact list and basic transaction history', 'BASIC'),
('f0000006-0000-0000-0000-000000000006', 'invoices', 'Invoice Management', 'sales', 'Generate, print and download sales invoices', 'BASIC'),
('f0000007-0000-0000-0000-000000000007', 'reports_basic', 'Basic Reports', 'analytics', 'Daily sales, monthly sales, product breakdown', 'BASIC'),
('f0000008-0000-0000-0000-000000000008', 'inventory_advanced', 'Advanced Inventory & Suppliers', 'inventory', 'Supplier directory, stock movements audit, adjustments, returns', 'BUSINESS'),
('f0000009-0000-0000-0000-000000000009', 'crm', 'Advanced CRM & Notes', 'crm', 'Customer dossiers, notes, timeline, balance tracking', 'BUSINESS'),
('f0000010-0000-0000-0000-000000000010', 'quotations', 'Quotations & Estimates', 'sales', 'Formal quotation creation and 1-click invoice conversion', 'BUSINESS'),
('f0000011-0000-0000-0000-000000000011', 'expenses', 'Expense Tracking', 'finance', 'Categorized expense records and receipt attachments', 'BUSINESS'),
('f0000012-0000-0000-0000-000000000012', 'finance', 'Finance & Profitability', 'finance', 'Gross/Net profit margins, cash flow, outstanding receivables', 'BUSINESS'),
('f0000013-0000-0000-0000-000000000013', 'staff', 'Staff Management', 'hr', 'Employee profiles, roles, contact and basic records', 'BUSINESS'),
('f0000014-0000-0000-0000-000000000014', 'whatsapp', 'WhatsApp Notifications Demo', 'marketing', 'Automated customer receipts & order alerts simulator', 'BUSINESS'),
('f0000015-0000-0000-0000-000000000015', 'reports_advanced', 'Advanced Reports & Exports', 'analytics', 'Custom date range reports, inventory valuation, CSV/PDF exports', 'BUSINESS'),
('f0000016-0000-0000-0000-000000000016', 'hr_advanced', 'Advanced HR, Attendance & Payroll', 'hr', 'Daily attendance clocking, leave request approvals, salary ledger', 'PREMIUM'),
('f0000017-0000-0000-0000-000000000017', 'ai_assistant', 'Harsh Apex AI Business Assistant', 'ai', 'Natural language business analyst & forecasting assistant', 'PREMIUM'),
('f0000018-0000-0000-0000-000000000018', 'website_integration', 'E-commerce & Website Sync', 'integrations', 'Bi-directional e-commerce store sync, webhooks, order bridge', 'PREMIUM'),
('f0000019-0000-0000-0000-000000000019', 'automation', 'Automation Center', 'automations', 'Event-action triggers for automated notifications & workflow tasks', 'PREMIUM'),
('f0000020-0000-0000-0000-000000000020', 'advanced_analytics', 'Advanced Intelligence Analytics', 'analytics', 'Predictive demand, staff KPI matrices, retention curves', 'PREMIUM'),
('f0000021-0000-0000-0000-000000000021', 'activity_logs', 'Enterprise Audit Logs', 'security', 'Immutable audit trail of actions taken by tenant members', 'PREMIUM')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    min_package = EXCLUDED.min_package;

-- 3. MAP PACKAGE FEATURES
-- BASIC: Features 1-7
INSERT INTO package_features (package_id, feature_id, is_enabled)
SELECT 'b1000000-0000-0000-0000-000000000001', id, true
FROM features
WHERE min_package = 'BASIC'
ON CONFLICT (package_id, feature_id) DO NOTHING;

-- BUSINESS: BASIC features + BUSINESS features (1-15)
INSERT INTO package_features (package_id, feature_id, is_enabled)
SELECT 'b2000000-0000-0000-0000-000000000002', id, true
FROM features
WHERE min_package IN ('BASIC', 'BUSINESS')
ON CONFLICT (package_id, feature_id) DO NOTHING;

-- PREMIUM: ALL features (1-21)
INSERT INTO package_features (package_id, feature_id, is_enabled)
SELECT 'b3000000-0000-0000-0000-000000000003', id, true
FROM features
ON CONFLICT (package_id, feature_id) DO NOTHING;

-- 4. SEED ROLES (Valid hex IDs: d0000001...)
INSERT INTO roles (id, code, name, description) VALUES
('d0000001-0000-0000-0000-000000000001', 'OWNER', 'Business Owner', 'Full control over the business workspace and subscription'),
('d0000002-0000-0000-0000-000000000002', 'ADMIN', 'Administrator', 'Manages day-to-day operations, staff, products, and reports'),
('d0000003-0000-0000-0000-000000000003', 'MANAGER', 'Store Manager', 'Oversees inventory, quotations, staff attendance, and sales'),
('d0000004-0000-0000-0000-000000000004', 'CASHIER', 'POS Cashier', 'Point of sale operations, order fulfillment, and receipts'),
('d0000005-0000-0000-0000-000000000005', 'STAFF', 'General Staff', 'Standard operational views and attendance tracking'),
('d0000006-0000-0000-0000-000000000006', 'SUPER_ADMIN', 'Harsh Apex Super Admin', 'Platform administrator with global tenant management')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- 5. SEED PERMISSIONS (Valid hex IDs: e0000001...)
INSERT INTO permissions (id, code, name, module) VALUES
('e0000001-0000-0000-0000-000000000001', 'view_dashboard', 'View Dashboard Metrics', 'dashboard'),
('e0000002-0000-0000-0000-000000000002', 'use_pos', 'Operate Point of Sale', 'pos'),
('e0000003-0000-0000-0000-000000000003', 'manage_products', 'Create and Edit Products', 'products'),
('e0000004-0000-0000-0000-000000000004', 'manage_inventory', 'Manage Stock and Adjustments', 'inventory'),
('e0000005-0000-0000-0000-000000000005', 'view_reports', 'Access Financial Reports', 'reports'),
('e0000006-0000-0000-0000-000000000006', 'manage_customers', 'Manage Customer Database', 'customers'),
('e0000007-0000-0000-0000-000000000007', 'manage_quotations', 'Create and Send Quotations', 'quotations'),
('e0000008-0000-0000-0000-000000000008', 'manage_expenses', 'Track and Approve Expenses', 'expenses'),
('e0000009-0000-0000-0000-000000000009', 'manage_staff', 'Manage Staff and Salaries', 'hr'),
('e0000010-0000-0000-0000-000000000010', 'manage_settings', 'Modify Business Settings', 'settings'),
('e0000011-0000-0000-0000-000000000011', 'manage_super_admin', 'Access Super Admin Control Plane', 'super_admin')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    module = EXCLUDED.module;

-- 6. MAP ROLE PERMISSIONS
-- OWNER has all tenant permissions (1-10)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'd0000001-0000-0000-0000-000000000001', id FROM permissions WHERE code != 'manage_super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ADMIN has permissions 1-9
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'd0000002-0000-0000-0000-000000000002', id FROM permissions WHERE code IN ('view_dashboard', 'use_pos', 'manage_products', 'manage_inventory', 'view_reports', 'manage_customers', 'manage_quotations', 'manage_expenses', 'manage_staff')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- MANAGER has 1-7
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'd0000003-0000-0000-0000-000000000003', id FROM permissions WHERE code IN ('view_dashboard', 'use_pos', 'manage_products', 'manage_inventory', 'view_reports', 'manage_customers', 'manage_quotations')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- CASHIER has POS, Customers, Dashboard
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'd0000004-0000-0000-0000-000000000004', id FROM permissions WHERE code IN ('view_dashboard', 'use_pos', 'manage_customers')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- SUPER_ADMIN has manage_super_admin + all
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'd0000006-0000-0000-0000-000000000006', id FROM permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;
