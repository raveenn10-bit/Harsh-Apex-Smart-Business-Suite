-- ============================================================
-- HARSH APEX SMART BUSINESS SUITE - 02_RLS_POLICIES.SQL
-- Supabase Row Level Security (RLS) for Strict Multi-Tenant Isolation
-- ============================================================

-- Create auth schema fallback only if missing (e.g. local test/PGlite engines)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        CREATE SCHEMA auth;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'auth' AND p.proname = 'uid') THEN
        EXECUTE 'CREATE FUNCTION auth.uid() RETURNS UUID AS $f$ SELECT NULL::UUID; $f$ LANGUAGE sql STABLE;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'auth' AND p.proname = 'role') THEN
        EXECUTE 'CREATE FUNCTION auth.role() RETURNS TEXT AS $f$ SELECT ''authenticated''::TEXT; $f$ LANGUAGE sql STABLE;';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'auth' AND p.proname = 'jwt') THEN
        EXECUTE 'CREATE FUNCTION auth.jwt() RETURNS JSONB AS $f$ SELECT ''{"role": "authenticated"}''::JSONB; $f$ LANGUAGE sql STABLE;';
    END IF;
END $$;

-- Function to obtain current user's business_id from profiles
CREATE OR REPLACE FUNCTION get_auth_business_id()
RETURNS UUID AS $$
    SELECT business_id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function to check if current user is Super Admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles p
        JOIN roles r ON p.role_id = r.id
        WHERE p.user_id = auth.uid() AND r.code = 'SUPER_ADMIN'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1. PUBLIC READABLE METADATA TABLES (Packages, Features, Roles, Permissions)
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Packages are publicly readable" ON packages FOR SELECT USING (true);
CREATE POLICY "Super admin can manage packages" ON packages FOR ALL USING (is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Features are publicly readable" ON features FOR SELECT USING (true);
CREATE POLICY "Super admin can manage features" ON features FOR ALL USING (is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE package_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Package features are publicly readable" ON package_features FOR SELECT USING (true);
CREATE POLICY "Super admin can manage package features" ON package_features FOR ALL USING (is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Roles are readable by authenticated users" ON roles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Super admin can manage roles" ON roles FOR ALL USING (is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permissions are readable by authenticated users" ON permissions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Super admin can manage permissions" ON permissions FOR ALL USING (is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Role permissions are readable by authenticated users" ON role_permissions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Super admin can manage role permissions" ON role_permissions FOR ALL USING (is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

-- 2. BUSINESSES & SETTINGS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own business" ON businesses FOR SELECT
USING (id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Users can update their own business" ON businesses FOR UPDATE
USING (id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for business_settings select" ON business_settings FOR SELECT
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Tenant isolation for business_settings update" ON business_settings FOR UPDATE
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

-- 3. PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view profiles in their own business" ON profiles FOR SELECT
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE
USING (user_id = auth.uid() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role can insert profiles" ON profiles FOR INSERT
WITH CHECK (true);

-- 4. TENANT ENTITY MACRO POLICIES (Products, Categories, Suppliers, Inventory, Stock Movements)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for categories" ON categories FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for suppliers" ON suppliers FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for products" ON products FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for inventory" ON inventory FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for stock_movements" ON stock_movements FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

-- 5. CUSTOMERS & NOTES
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for customers" ON customers FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for customer_notes" ON customer_notes FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

-- 6. ORDERS & ORDER ITEMS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for orders" ON orders FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for order_items" ON order_items FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

-- 7. INVOICES, QUOTATIONS & PAYMENTS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for invoices" ON invoices FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for invoice_items" ON invoice_items FOR ALL
USING (
    EXISTS (SELECT 1 FROM invoices inv WHERE inv.id = invoice_items.invoice_id AND (inv.business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role'))
);

ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for quotations" ON quotations FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for quotation_items" ON quotation_items FOR ALL
USING (
    EXISTS (SELECT 1 FROM quotations q WHERE q.id = quotation_items.quotation_id AND (q.business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role'))
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for payments" ON payments FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

-- 8. EXPENSES
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for expense_categories" ON expense_categories FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for expenses" ON expenses FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

-- 9. EMPLOYEES & HR
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for employees" ON employees FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for attendance" ON attendance FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for leave_requests" ON leave_requests FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

-- 10. COMMUNICATIONS, LOGS & AUTOMATIONS
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for whatsapp_messages" ON whatsapp_messages FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for notifications" ON notifications FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for activity_logs" ON activity_logs FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for integrations" ON integrations FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for automations" ON automations FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

-- 11. LEADS (Public insert, Super Admin read/write)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit leads" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Super admin can view and manage leads" ON leads FOR ALL
USING (is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');
