-- ============================================================
-- HARSH APEX SMART BUSINESS SUITE - COMPLETE MASTER MIGRATION
-- Run this script in your Supabase SQL Editor to seed everything:
-- https://supabase.com/dashboard/project/onwecvbitivvznezdflw/sql
-- ============================================================


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF 01_initial_schema.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ============================================================
-- HARSH APEX SMART BUSINESS SUITE - 01_INITIAL_SCHEMA.SQL
-- Multi-Tenant Database Architecture with business_id Isolation
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PACKAGES TABLE
CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- 'BASIC', 'BUSINESS', 'PREMIUM'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly NUMERIC(12, 2) DEFAULT 0,
    price_annual NUMERIC(12, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FEATURES TABLE
CREATE TABLE IF NOT EXISTS features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL, -- e.g. 'pos', 'crm', 'ai_assistant'
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'sales', 'inventory', 'finance', 'hr', 'ai'
    description TEXT,
    min_package VARCHAR(50) NOT NULL, -- 'BASIC', 'BUSINESS', 'PREMIUM'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PACKAGE_FEATURES TABLE
CREATE TABLE IF NOT EXISTS package_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (package_id, feature_id)
);

-- 4. BUSINESSES TABLE (Tenants)
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    package_id UUID NOT NULL REFERENCES packages(id),
    logo_url TEXT,
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    currency VARCHAR(10) DEFAULT 'LKR',
    currency_symbol VARCHAR(10) DEFAULT 'Rs. ',
    business_type VARCHAR(100) DEFAULT 'Retail & Services',
    is_active BOOLEAN DEFAULT true,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BUSINESS_SETTINGS TABLE
CREATE TABLE IF NOT EXISTS business_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID UNIQUE NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    invoice_prefix VARCHAR(20) DEFAULT 'HA-INV-',
    next_invoice_number INTEGER DEFAULT 1,
    quotation_prefix VARCHAR(20) DEFAULT 'HA-QTN-',
    next_quotation_number INTEGER DEFAULT 1,
    receipt_header TEXT DEFAULT 'Thank you for choosing Harsh Apex Solutions',
    receipt_footer TEXT DEFAULT 'Goods sold are not returnable without original receipt.',
    enable_tax BOOLEAN DEFAULT false,
    tax_rate NUMERIC(5, 2) DEFAULT 0,
    primary_brand_color VARCHAR(20) DEFAULT '#1e40af',
    whatsapp_auto_send BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ROLES TABLE
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- 'OWNER', 'ADMIN', 'MANAGER', 'CASHIER', 'STAFF'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL, -- 'view_dashboard', 'use_pos', etc.
    name VARCHAR(150) NOT NULL,
    module VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ROLE_PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (role_id, permission_id)
);

-- 9. PROFILES TABLE (Users in Tenants)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE, -- References auth.users(id) in Supabase Auth
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (business_id, slug)
);

-- 11. SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(150),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    barcode VARCHAR(100),
    description TEXT,
    cost_price NUMERIC(12, 2) DEFAULT 0 NOT NULL,
    selling_price NUMERIC(12, 2) DEFAULT 0 NOT NULL,
    stock_quantity INTEGER DEFAULT 0 NOT NULL,
    min_stock_level INTEGER DEFAULT 5 NOT NULL,
    image_url TEXT,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'archived', 'out_of_stock'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (business_id, sku)
);

-- 13. INVENTORY TABLE
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 0 NOT NULL,
    reserved_quantity INTEGER DEFAULT 0 NOT NULL,
    location VARCHAR(100) DEFAULT 'Main Store',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (business_id, product_id)
);

-- 14. STOCK_MOVEMENTS TABLE
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    movement_type VARCHAR(50) NOT NULL, -- 'STOCK_IN', 'STOCK_OUT', 'SALE', 'RETURN', 'ADJUSTMENT'
    quantity INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    reference_id VARCHAR(100), -- order_id or receipt number
    notes TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    avatar_url TEXT,
    total_purchases NUMERIC(14, 2) DEFAULT 0 NOT NULL,
    total_orders INTEGER DEFAULT 0 NOT NULL,
    outstanding_balance NUMERIC(14, 2) DEFAULT 0 NOT NULL,
    last_purchase_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. CUSTOMER_NOTES TABLE
CREATE TABLE IF NOT EXISTS customer_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    order_number VARCHAR(100) NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'completed', -- 'pending', 'completed', 'cancelled'
    payment_status VARCHAR(50) DEFAULT 'paid', -- 'paid', 'unpaid', 'partially_paid'
    payment_method VARCHAR(50) DEFAULT 'cash', -- 'cash', 'card', 'bank_transfer'
    subtotal NUMERIC(14, 2) DEFAULT 0 NOT NULL,
    discount_amount NUMERIC(14, 2) DEFAULT 0 NOT NULL,
    tax_amount NUMERIC(14, 2) DEFAULT 0 NOT NULL,
    total_amount NUMERIC(14, 2) DEFAULT 0 NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (business_id, order_number)
);

-- 18. ORDER_ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    cost_price NUMERIC(12, 2) DEFAULT 0 NOT NULL,
    discount_amount NUMERIC(12, 2) DEFAULT 0 NOT NULL,
    total_price NUMERIC(14, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. INVOICES TABLE
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100) NOT NULL,
    issue_date DATE DEFAULT CURRENT_DATE NOT NULL,
    due_date DATE DEFAULT (CURRENT_DATE + INTERVAL '14 days') NOT NULL,
    subtotal NUMERIC(14, 2) DEFAULT 0 NOT NULL,
    discount_amount NUMERIC(14, 2) DEFAULT 0 NOT NULL,
    tax_amount NUMERIC(14, 2) DEFAULT 0 NOT NULL,
    total_amount NUMERIC(14, 2) DEFAULT 0 NOT NULL,
    paid_amount NUMERIC(14, 2) DEFAULT 0 NOT NULL,
    balance_amount NUMERIC(14, 2) DEFAULT 0 NOT NULL,
    status VARCHAR(50) DEFAULT 'paid', -- 'draft', 'unpaid', 'paid', 'overdue'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (business_id, invoice_number)
);

-- 20. INVOICE_ITEMS TABLE
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    total_price NUMERIC(14, 2) NOT NULL
);

-- 21. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    amount NUMERIC(14, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'cash', 'card', 'bank_transfer'
    payment_reference VARCHAR(100),
    notes TEXT,
    payment_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. QUOTATIONS TABLE
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    quotation_number VARCHAR(100) NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    issue_date DATE DEFAULT CURRENT_DATE NOT NULL,
    valid_until DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days') NOT NULL,
    subtotal NUMERIC(14, 2) DEFAULT 0 NOT NULL,
    discount_amount NUMERIC(14, 2) DEFAULT 0 NOT NULL,
    tax_amount NUMERIC(14, 2) DEFAULT 0 NOT NULL,
    total_amount NUMERIC(14, 2) DEFAULT 0 NOT NULL,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'sent', 'accepted', 'rejected', 'expired'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (business_id, quotation_number)
);

-- 23. QUOTATION_ITEMS TABLE
CREATE TABLE IF NOT EXISTS quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    total_price NUMERIC(14, 2) NOT NULL
);

-- 24. EXPENSE_CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (business_id, name)
);

-- 25. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
    expense_number VARCHAR(100) NOT NULL,
    expense_date DATE DEFAULT CURRENT_DATE NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    receipt_url TEXT,
    notes TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (business_id, expense_number)
);

-- 26. EMPLOYEES TABLE
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    employee_id_number VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    position VARCHAR(100) NOT NULL,
    department VARCHAR(100) DEFAULT 'General',
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    salary NUMERIC(14, 2) DEFAULT 0,
    join_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'on_leave', 'terminated'
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (business_id, employee_id_number)
);

-- 27. ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'present', -- 'present', 'absent', 'late', 'half_day'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (business_id, employee_id, work_date)
);

-- 28. LEAVE_REQUESTS TABLE
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL, -- 'annual', 'casual', 'medical'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 29. WHATSAPP_MESSAGES TABLE
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    recipient_phone VARCHAR(50) NOT NULL,
    recipient_name VARCHAR(150),
    template_name VARCHAR(100) NOT NULL,
    message_body TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'sent', -- 'queued', 'sent', 'delivered', 'read', 'failed'
    external_id VARCHAR(100),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 30. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- 'info', 'warning', 'success', 'danger'
    is_read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 31. ACTIVITY_LOGS TABLE
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 32. INTEGRATIONS TABLE
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    provider VARCHAR(100) NOT NULL, -- 'website_ecommerce', 'whatsapp', 'payment_gateway'
    status VARCHAR(50) DEFAULT 'connected', -- 'connected', 'disconnected', 'error'
    config JSONB DEFAULT '{}'::jsonb,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (business_id, provider)
);

-- 33. AUTOMATIONS TABLE
CREATE TABLE IF NOT EXISTS automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    trigger_event VARCHAR(100) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 34. LEADS TABLE (Super Admin / Global)
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(200) NOT NULL,
    business_name VARCHAR(200) NOT NULL,
    whatsapp_number VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    business_type VARCHAR(100),
    interested_package VARCHAR(50) NOT NULL, -- 'Basic', 'Business', 'Premium', 'Not Sure'
    message TEXT,
    status VARCHAR(50) DEFAULT 'new', -- 'new', 'contacted', 'converted', 'closed'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE & FAST TENANT LOOKUPS
CREATE INDEX IF NOT EXISTS idx_businesses_package ON businesses(package_id);
CREATE INDEX IF NOT EXISTS idx_profiles_business ON profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_products_business ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_inventory_business_product ON inventory(business_id, product_id);
CREATE INDEX IF NOT EXISTS idx_customers_business ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_business ON orders(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(business_id, created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_business ON invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_business ON payments(business_id);
CREATE INDEX IF NOT EXISTS idx_expenses_business ON expenses(business_id);
CREATE INDEX IF NOT EXISTS idx_employees_business ON employees(business_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_business ON whatsapp_messages(business_id);
CREATE INDEX IF NOT EXISTS idx_activity_business ON activity_logs(business_id);


-- END OF 01_initial_schema.sql

-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF 02_rls_policies.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ============================================================
-- HARSH APEX SMART BUSINESS SUITE - 02_RLS_POLICIES.SQL
-- Supabase Row Level Security (RLS) for Strict Multi-Tenant Isolation
-- ============================================================

-- Create auth schema fallback for local PostgreSQL engines (PGlite/local test)
CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$ SELECT 'c1000000-0000-0000-0000-000000000001'::UUID; $$ LANGUAGE sql;
CREATE OR REPLACE FUNCTION auth.role() RETURNS TEXT AS $$ SELECT 'authenticated'::TEXT; $$ LANGUAGE sql;
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS JSONB AS $$ SELECT '{"role": "authenticated"}'::JSONB; $$ LANGUAGE sql;

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


-- END OF 02_rls_policies.sql

-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF 03_seed_packages_roles.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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


-- END OF 03_seed_packages_roles.sql

-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF 04_seed_demo_accounts.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ============================================================
-- HARSH APEX SMART BUSINESS SUITE - 04_SEED_DEMO_ACCOUNTS.SQL
-- Seed the 6 Demo Businesses & User Profiles
-- (All UUIDs strictly use valid hex [0-9a-f])
-- ============================================================

-- Fix IDs for reproducible references
-- BASIC WORKSPACES: a1000000... & a2000000...
-- BUSINESS WORKSPACES: a3000000... & a4000000...
-- PREMIUM WORKSPACES: a5000000... & a6000000...

-- 1. INSERT THE 6 DEMO BUSINESSES
INSERT INTO businesses (id, name, slug, package_id, logo_url, phone, whatsapp, email, address, currency, currency_symbol, business_type, is_demo) VALUES
('a1000000-0000-0000-0000-000000000001', 'DEMO_BASIC_01 - Apex Mart Colombo', 'demo-basic-01', 'b1000000-0000-0000-0000-000000000001', '/logo.png', '+94 11 234 5671', '+94 77 123 4561', 'basic1@demo.harshapex.com.lk', '45 Galle Road, Colombo 03, Sri Lanka', 'LKR', 'Rs. ', 'Retail Grocery & Essentials', true),
('a2000000-0000-0000-0000-000000000002', 'DEMO_BASIC_02 - Apex Express Kandy', 'demo-basic-02', 'b1000000-0000-0000-0000-000000000001', '/logo.png', '+94 81 234 5672', '+94 77 123 4562', 'basic2@demo.harshapex.com.lk', '12 Peradeniya Road, Kandy, Sri Lanka', 'LKR', 'Rs. ', 'Corner Store & Pharmacy', true),
('a3000000-0000-0000-0000-000000000003', 'DEMO_BUSINESS_01 - Harsh Apex Tech Galle', 'demo-business-01', 'b2000000-0000-0000-0000-000000000002', '/logo.png', '+94 91 234 5673', '+94 77 123 4563', 'business1@demo.harshapex.com.lk', '88 Main Street, Galle Fort, Sri Lanka', 'LKR', 'Rs. ', 'Electronics & Smart Appliances', true),
('a4000000-0000-0000-0000-000000000004', 'DEMO_BUSINESS_02 - Apex Logistics Negombo', 'demo-business-02', 'b2000000-0000-0000-0000-000000000002', '/logo.png', '+94 31 234 5674', '+94 77 123 4564', 'business2@demo.harshapex.com.lk', '302 Colombo Road, Negombo, Sri Lanka', 'LKR', 'Rs. ', 'Wholesale & B2B Distribution', true),
('a5000000-0000-0000-0000-000000000005', 'DEMO_PREMIUM_01 - Apex Enterprise Holdings', 'demo-premium-01', 'b3000000-0000-0000-0000-000000000003', '/logo.png', '+94 11 987 6545', '+94 77 987 6545', 'premium1@demo.harshapex.com.lk', 'World Trade Center Level 28, Colombo 01, Sri Lanka', 'LKR', 'Rs. ', 'Omnichannel Enterprise & Superstore', true),
('a6000000-0000-0000-0000-000000000006', 'DEMO_PREMIUM_02 - Apex Global Industrial', 'demo-premium-02', 'b3000000-0000-0000-0000-000000000003', '/logo.png', '+94 21 234 5676', '+94 77 123 4566', 'premium2@demo.harshapex.com.lk', '100 Beach Road, Jaffna, Sri Lanka', 'LKR', 'Rs. ', 'Multi-Branch Industrial Distribution', true)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    package_id = EXCLUDED.package_id,
    phone = EXCLUDED.phone,
    whatsapp = EXCLUDED.whatsapp,
    address = EXCLUDED.address;

-- 2. SEED BUSINESS SETTINGS FOR ALL 6 BUSINESSES
INSERT INTO business_settings (business_id, invoice_prefix, next_invoice_number, quotation_prefix, next_quotation_number, receipt_header, receipt_footer, enable_tax, tax_rate, primary_brand_color)
VALUES
('a1000000-0000-0000-0000-000000000001', 'HA-INV-', 1001, 'HA-QTN-', 101, 'Harsh Apex Mart Colombo - Thank You for Shopping With Us!', 'Keep your receipt for returns within 7 days.', false, 0, '#1e40af'),
('a2000000-0000-0000-0000-000000000002', 'HA-INV-', 2001, 'HA-QTN-', 201, 'Apex Express Kandy - Fresh Goods & Daily Essentials', 'Please visit again soon.', false, 0, '#0284c7'),
('a3000000-0000-0000-0000-000000000003', 'HA-INV-', 3001, 'HA-QTN-', 301, 'Harsh Apex Tech Galle - Sri Lanka Official Tech Partner', 'Warranty applies as per manufacturer terms.', true, 2.5, '#2563eb'),
('a4000000-0000-0000-0000-000000000004', 'HA-INV-', 4001, 'HA-QTN-', 401, 'Apex Logistics Negombo - Islandwide Commercial Supply', 'Net 30 payment terms for corporate accounts.', true, 2.5, '#0d9488'),
('a5000000-0000-0000-0000-000000000005', 'HA-INV-', 5001, 'HA-QTN-', 501, 'Apex Enterprise Holdings - Harsh Apex Premier Corporate', 'Certified ISO 9001:2015 Quality Guaranteed.', true, 5.0, '#1e3a8a'),
('a6000000-0000-0000-0000-000000000006', 'HA-INV-', 6001, 'HA-QTN-', 601, 'Apex Global Industrial - Premium Engineering & Hardware', 'Technical support available 24/7.', true, 5.0, '#4338ca')
ON CONFLICT (business_id) DO NOTHING;

-- 3. SEED USER PROFILES (MAPPED TO WORKSPACES, USING VALID HEX ROLE 'd0000001...')
INSERT INTO profiles (id, user_id, business_id, role_id, full_name, email, phone, avatar_url, is_active)
VALUES
-- basic1 (OWNER of DEMO_BASIC_01)
('c1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'Kasun Perera', 'basic1@demo.harshapex.com.lk', '+94 77 123 4561', '/demo-assets/avatars/user-basic1.webp', true),

-- basic2 (OWNER of DEMO_BASIC_02)
('c2000000-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000001', 'Nadeesha Silva', 'basic2@demo.harshapex.com.lk', '+94 77 123 4562', '/demo-assets/avatars/user-basic2.webp', true),

-- business1 (OWNER of DEMO_BUSINESS_01)
('c3000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-000000000003', 'a3000000-0000-0000-0000-000000000003', 'd0000001-0000-0000-0000-000000000001', 'Rohan Jayasinghe', 'business1@demo.harshapex.com.lk', '+94 77 123 4563', '/demo-assets/avatars/user-business1.webp', true),

-- business2 (OWNER of DEMO_BUSINESS_02)
('c4000000-0000-0000-0000-000000000004', 'c4000000-0000-0000-0000-000000000004', 'a4000000-0000-0000-0000-000000000004', 'd0000001-0000-0000-0000-000000000001', 'Dilini Fernando', 'business2@demo.harshapex.com.lk', '+94 77 123 4564', '/demo-assets/avatars/user-business2.webp', true),

-- premium1 (OWNER of DEMO_PREMIUM_01)
('c5000000-0000-0000-0000-000000000005', 'c5000000-0000-0000-0000-000000000005', 'a5000000-0000-0000-0000-000000000005', 'd0000001-0000-0000-0000-000000000001', 'Harshana Wickramasinghe', 'premium1@demo.harshapex.com.lk', '+94 77 987 6545', '/demo-assets/avatars/user-premium1.webp', true),

-- premium2 (OWNER of DEMO_PREMIUM_02)
('c6000000-0000-0000-0000-000000000006', 'c6000000-0000-0000-0000-000000000006', 'a6000000-0000-0000-0000-000000000006', 'd0000001-0000-0000-0000-000000000001', 'Tharindu Rathnayake', 'premium2@demo.harshapex.com.lk', '+94 77 123 4566', '/demo-assets/avatars/user-premium2.webp', true),

-- super admin user (Apex Platform Operations)
('c9000000-0000-0000-0000-000000000009', 'c9000000-0000-0000-0000-000000000009', 'a5000000-0000-0000-0000-000000000005', 'd0000006-0000-0000-0000-000000000006', 'Harsh Apex Super Admin', 'admin@harshapex.com.lk', '+94 11 777 8899', '/demo-assets/avatars/user-admin.webp', true)
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    business_id = EXCLUDED.business_id,
    role_id = EXCLUDED.role_id;


-- END OF 04_seed_demo_accounts.sql

-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF 05_seed_demo_workspaces_data.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ============================================================
-- HARSH APEX SMART BUSINESS SUITE - 05_SEED_DEMO_WORKSPACES_DATA.SQL
-- Realistic Sri Lankan Fictional Sample Data for Demo Workspaces
-- (All UUIDs strictly use valid hex [0-9a-f])
-- ============================================================

-- Variables for Demo Businesses:
-- DEMO_BASIC_01: 'a1000000-0000-0000-0000-000000000001'
-- DEMO_BUSINESS_01: 'a3000000-0000-0000-0000-000000000003'
-- DEMO_PREMIUM_01: 'a5000000-0000-0000-0000-000000000005'

-- 1. CATEGORIES (For DEMO_BASIC_01)
INSERT INTO categories (id, business_id, name, slug, description, image_url) VALUES
('ca000001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Dairy & Eggs', 'dairy-eggs', 'Fresh milk, butter, cheese, and farm eggs', '/demo-assets/categories/dairy.webp'),
('ca000002-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Bakery & Bread', 'bakery-bread', 'Artisan breads, buns, pastries, and biscuits', '/demo-assets/categories/bakery.webp'),
('ca000003-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Beverages & Tea', 'beverages-tea', 'Ceylon tea, roasted coffee, juices, and soft drinks', '/demo-assets/categories/beverages.webp'),
('ca000004-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Rice & Grains', 'rice-grains', 'Samba, Keeri Samba, Red Rice, Basmati, dhal, and pulses', '/demo-assets/categories/grains.webp'),
('ca000005-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Spices & Condiments', 'spices-condiments', 'Pure Ceylon cinnamon, black pepper, curry powder, sauces', '/demo-assets/categories/spices.webp'),
('ca000006-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Snacks & Confectionery', 'snacks-confectionery', 'Chocolates, potato crisps, traditional Sri Lankan sweets', '/demo-assets/categories/snacks.webp'),
('ca000007-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Household & Cleaning', 'household-cleaning', 'Detergents, floor cleaners, kitchen paper, sanitizers', '/demo-assets/categories/household.webp'),
('ca000008-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Personal Care', 'personal-care', 'Soaps, shampoos, dental care, lotions', '/demo-assets/categories/personal-care.webp'),
('ca000009-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Stationery & Office', 'stationery-office', 'Notebooks, pens, paper reams, office clips', '/demo-assets/categories/stationery.webp'),
('ca000010-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Fresh Fruits & Veg', 'fresh-produce', 'Island fresh vegetables, bananas, mangoes, pineapples', '/demo-assets/categories/fruits.webp')
ON CONFLICT (business_id, slug) DO NOTHING;

-- Clone categories to DEMO_BUSINESS_01 and DEMO_PREMIUM_01
INSERT INTO categories (id, business_id, name, slug, description, image_url)
SELECT gen_random_uuid(), 'a3000000-0000-0000-0000-000000000003', name, slug, description, image_url
FROM categories WHERE business_id = 'a1000000-0000-0000-0000-000000000001'
ON CONFLICT DO NOTHING;

INSERT INTO categories (id, business_id, name, slug, description, image_url)
SELECT gen_random_uuid(), 'a5000000-0000-0000-0000-000000000005', name, slug, description, image_url
FROM categories WHERE business_id = 'a1000000-0000-0000-0000-000000000001'
ON CONFLICT DO NOTHING;

-- 2. PRODUCTS FOR DEMO_BASIC_01 (30 Realistic Products)
INSERT INTO products (id, business_id, category_id, name, sku, barcode, description, cost_price, selling_price, stock_quantity, min_stock_level, image_url, status) VALUES
('da000001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000003-0000-0000-0000-000000000001', 'Pure Ceylon BOPF Tea 500g', 'SKU-TEA-001', '793573100011', 'Premium high-grown Nuwara Eliya BOPF black tea', 1200.00, 1650.00, 45, 10, '/demo-assets/basic/products/product-001.webp', 'active'),
('da000002-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000004-0000-0000-0000-000000000001', 'Araliya Keeri Samba Rice 5kg', 'SKU-RICE-001', '793573100028', 'Finest polished Sri Lankan aromatic keeri samba', 1350.00, 1680.00, 80, 15, '/demo-assets/basic/products/product-002.webp', 'active'),
('da000003-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000004-0000-0000-0000-000000000001', 'Red Raw Kakulu Rice 5kg', 'SKU-RICE-002', '793573100035', 'Nutritious unpolished red rice rich in fiber', 950.00, 1250.00, 60, 10, '/demo-assets/basic/products/product-003.webp', 'active'),
('da000004-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000001-0000-0000-0000-000000000001', 'Pelwatte Fresh Milk 1L', 'SKU-MILK-001', '793573100042', '100% Sri Lankan full cream homogenized pasteurized milk', 420.00, 520.00, 32, 8, '/demo-assets/basic/products/product-004.webp', 'active'),
('da000005-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000001-0000-0000-0000-000000000001', 'Highland Salted Butter 200g', 'SKU-BUTR-001', '793573100059', 'Pure creamy highland butter from Ambewela dairy farm', 680.00, 850.00, 18, 5, '/demo-assets/basic/products/product-005.webp', 'active'),
('da000006-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000002-0000-0000-0000-000000000001', 'Munchee Super Cream Cracker 490g', 'SKU-BISC-001', '793573100066', 'Crispy, baked golden classic Sri Lankan crackers', 380.00, 480.00, 55, 12, '/demo-assets/basic/products/product-006.webp', 'active'),
('da000007-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000002-0000-0000-0000-000000000001', 'Maliban Chocolate Biscuit 400g', 'SKU-BISC-002', '793573100073', 'Rich real chocolate cream filled sandwich biscuits', 410.00, 520.00, 40, 10, '/demo-assets/basic/products/product-007.webp', 'active'),
('da000008-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000005-0000-0000-0000-000000000001', 'Organic Ceylon Cinnamon Quills 100g', 'SKU-SPIC-001', '793573100080', 'Alba grade true Ceylon cinnamon quills', 850.00, 1200.00, 25, 5, '/demo-assets/basic/products/product-008.webp', 'active'),
('da000009-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000005-0000-0000-0000-000000000001', 'Roasted Curry Powder 250g', 'SKU-SPIC-002', '793573100097', 'Aromatic roasted Sri Lankan meat and fish curry mix', 320.00, 450.00, 50, 10, '/demo-assets/basic/products/product-009.webp', 'active'),
('da000010-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000003-0000-0000-0000-000000000001', 'Harischandra Pure Ground Coffee 200g', 'SKU-COFF-001', '793573100103', 'Freshly ground Sri Lankan robusta coffee', 460.00, 620.00, 30, 8, '/demo-assets/basic/products/product-010.webp', 'active'),
('da000011-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000008-0000-0000-0000-000000000001', 'Kohomba Herbal Ayurvedic Soap 100g', 'SKU-SOAP-001', '793573100110', 'Natural neem and herbal clarifying bath bar', 120.00, 165.00, 95, 20, '/demo-assets/basic/products/product-011.webp', 'active'),
('da000012-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000008-0000-0000-0000-000000000001', 'Siddhalepa Herbal Toothpaste 100g', 'SKU-DENT-001', '793573100127', 'Ayurvedic gum protection with clove oil & herbs', 210.00, 280.00, 60, 15, '/demo-assets/basic/products/product-012.webp', 'active'),
('da000013-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000007-0000-0000-0000-000000000001', 'Sunlight Washing Powder 1kg', 'SKU-DETG-001', '793573100134', 'Active floral stain remover laundry powder', 480.00, 620.00, 42, 10, '/demo-assets/basic/products/product-013.webp', 'active'),
('da000014-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000007-0000-0000-0000-000000000001', 'Vim Dishwash Liquid 500ml', 'SKU-DISH-001', '793573100141', 'Lemon degreasing kitchen dishwash gel', 310.00, 420.00, 35, 10, '/demo-assets/basic/products/product-014.webp', 'active'),
('da000015-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000006-0000-0000-0000-000000000001', 'Edinborough Tomato Ketchup 400g', 'SKU-SAUC-001', '793573100158', 'Farm fresh tomato dipping sauce', 340.00, 460.00, 28, 8, '/demo-assets/basic/products/product-015.webp', 'active'),
('da000016-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000004-0000-0000-0000-000000000001', 'Australian Red Split Dhal 1kg', 'SKU-DHAL-001', '793573100165', 'Grade A cleaned premium red split lentils', 390.00, 490.00, 110, 25, '/demo-assets/basic/products/product-016.webp', 'active'),
('da000017-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000004-0000-0000-0000-000000000001', 'Prima All-Purpose Wheat Flour 1kg', 'SKU-FLOR-001', '793573100172', 'Enriched fortified white wheat flour', 240.00, 310.00, 75, 20, '/demo-assets/basic/products/product-017.webp', 'active'),
('da000018-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000004-0000-0000-0000-000000000001', 'Brown Sugar Pelwatte 1kg', 'SKU-SUGR-001', '793573100189', 'Unrefined natural pure cane brown sugar', 360.00, 450.00, 65, 15, '/demo-assets/basic/products/product-018.webp', 'active'),
('da000019-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000005-0000-0000-0000-000000000001', 'Pure Coconut Oil Bottle 750ml', 'SKU-OIL-001', '793573100196', 'Cold-pressed traditional cooking coconut oil', 780.00, 990.00, 3, 10, '/demo-assets/basic/products/product-019.webp', 'active'),
('da000020-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000003-0000-0000-0000-000000000001', 'Elephant House Ginger Beer (EGB) 1L', 'SKU-BEVG-001', '793573100202', 'Iconic natural ginger carbonated soda bottle', 290.00, 390.00, 40, 10, '/demo-assets/basic/products/product-020.webp', 'active'),
('da000021-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000003-0000-0000-0000-000000000001', 'Kist Mixed Fruit Nectar 1L', 'SKU-BEVG-002', '793573100219', 'Tropical mango, passion fruit & banana nectar', 390.00, 520.00, 22, 6, '/demo-assets/basic/products/product-021.webp', 'active'),
('da000022-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000009-0000-0000-0000-000000000001', 'Atlas CR Single Ruled Book 120 Pgs', 'SKU-STAT-001', '793573100226', 'Hardcover school and office exercise book', 160.00, 240.00, 120, 20, '/demo-assets/basic/products/product-022.webp', 'active'),
('da000023-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000009-0000-0000-0000-000000000001', 'Atlas Chooty Ballpoint Pen Box (10pcs)', 'SKU-STAT-002', '793573100233', 'Smooth blue ink fine tip writing pens', 220.00, 320.00, 45, 10, '/demo-assets/basic/products/product-023.webp', 'active'),
('da000024-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000009-0000-0000-0000-000000000001', 'Double A A4 Copier Paper 80GSM (500 Sheets)', 'SKU-STAT-003', '793573100240', 'Bright white multipurpose premium print paper', 1850.00, 2350.00, 2, 8, '/demo-assets/basic/products/product-024.webp', 'active'),
('da000025-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000006-0000-0000-0000-000000000001', 'Kandos Milk Chocolate Bar 100g', 'SKU-CHOC-001', '793573100257', 'Smooth melt Sri Lankan creamy milk chocolate', 280.00, 380.00, 50, 10, '/demo-assets/basic/products/product-025.webp', 'active'),
('da000026-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000001-0000-0000-0000-000000000001', 'Kotmale Vanilla Flavoured Yoghurt (Cup)', 'SKU-YOGH-001', '793573100264', 'Rich creamy probiotic breakfast yoghurt cup', 70.00, 95.00, 85, 20, '/demo-assets/basic/products/product-026.webp', 'active'),
('da000027-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000005-0000-0000-0000-000000000001', 'MD Mango Chutney Jar 450g', 'SKU-CHUT-001', '793573100271', 'Sweet and spicy traditional Sri Lankan mango chutney', 450.00, 620.00, 20, 5, '/demo-assets/basic/products/product-027.webp', 'active'),
('da000028-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000007-0000-0000-0000-000000000001', 'Dettol Antiseptic Liquid 250ml', 'SKU-DETT-001', '793573100288', 'Antibacterial surface and first-aid disinfectant', 580.00, 750.00, 28, 6, '/demo-assets/basic/products/product-028.webp', 'active'),
('da000029-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000006-0000-0000-0000-000000000001', 'Ritzbury Cashew Nut Chocolate 100g', 'SKU-CHOC-002', '793573100295', 'Roasted whole crunchy cashew nut bar', 330.00, 450.00, 36, 8, '/demo-assets/basic/products/product-029.webp', 'active'),
('da000030-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca000003-0000-0000-0000-000000000001', 'Milo Energy Chocolate Malt Powder 400g', 'SKU-MILO-001', '793573100301', 'Nutrient enriched active chocolate malt beverage', 740.00, 950.00, 1, 10, '/demo-assets/basic/products/product-030.webp', 'active')
ON CONFLICT (business_id, sku) DO UPDATE SET
    name = EXCLUDED.name,
    selling_price = EXCLUDED.selling_price,
    stock_quantity = EXCLUDED.stock_quantity;

-- 3. INVENTORY SYNC FOR PRODUCTS
INSERT INTO inventory (business_id, product_id, quantity, reserved_quantity, location)
SELECT business_id, id, stock_quantity, 0, 'Central Warehouse'
FROM products WHERE business_id = 'a1000000-0000-0000-0000-000000000001'
ON CONFLICT (business_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- 4. CUSTOMERS FOR DEMO_BASIC_01 (20 Fictional Sri Lankan Customers)
INSERT INTO customers (id, business_id, name, phone, email, address, total_purchases, total_orders, outstanding_balance, last_purchase_at) VALUES
('cc000001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Sunil Jayawardena', '+94 77 234 5678', 'sunil.j@gmail.com', '142 Havelock Road, Colombo 05', 48500.00, 12, 0.00, NOW() - INTERVAL '1 day'),
('cc000002-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Kumari Alwis', '+94 71 876 5432', 'kumari.alwis@yahoo.com', '56 Rajagiriya Road, Kotte', 32400.00, 8, 0.00, NOW() - INTERVAL '2 days'),
('cc000003-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Mohamed Rizwan', '+94 76 543 2198', 'm.rizwan.trading@gmail.com', '88 Keyzer Street, Pettah, Colombo 11', 125000.00, 24, 15000.00, NOW() - INTERVAL '3 days'),
('cc000004-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Priyantha Gunasekara', '+94 77 654 3210', 'priyantha.guna@outlook.com', '23 Temple Road, Nugegoda', 19800.00, 5, 0.00, NOW() - INTERVAL '4 days'),
('cc000005-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Chamari Dissanayake', '+94 72 345 6789', 'chamari.d@gmail.com', '77 Stanley Tillakaratne Mawatha, Nugegoda', 62300.00, 15, 0.00, NOW() - INTERVAL '1 day'),
('cc000006-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Siva Subramaniam', '+94 77 889 9001', 'siva.subra@gmail.com', '12 Sea Street, Colombo 11', 89400.00, 19, 4500.00, NOW() - INTERVAL '5 days'),
('cc000007-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Anushka Bandara', '+94 75 112 2334', 'anushka.b@hotmail.com', '98 High Level Road, Maharagama', 27600.00, 6, 0.00, NOW() - INTERVAL '6 days'),
('cc000008-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Malik Mansoor', '+94 77 998 8776', 'malik.mansoor@gmail.com', '34 Wekande Road, Colombo 02', 54200.00, 11, 0.00, NOW() - INTERVAL '7 days'),
('cc000009-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Kavindi Senaratne', '+94 71 445 5667', 'kavindi.sena@gmail.com', '5 Anderson Road, Dehiwala', 15400.00, 4, 0.00, NOW() - INTERVAL '2 days'),
('cc000010-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Dinesh Samarawickrama', '+94 70 334 4556', 'dinesh.sam@gmail.com', '19 Galle Road, Mount Lavinia', 71200.00, 14, 0.00, NOW() - INTERVAL '3 days'),
('cc000011-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Shalini Weerasinghe', '+94 77 667 7889', 'shalini.w@gmail.com', '40 Duplication Road, Colombo 04', 38900.00, 9, 0.00, NOW() - INTERVAL '4 days'),
('cc000012-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Ruwan Edirisinghe', '+94 76 778 8990', 'ruwan.ediri@yahoo.com', '62 Baseline Road, Dematagoda', 23100.00, 7, 0.00, NOW() - INTERVAL '5 days'),
('cc000013-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Thilini Fonseka', '+94 71 223 3445', 'thilini.fonseka@gmail.com', '110 Hospital Road, Kalubowila', 49000.00, 10, 0.00, NOW() - INTERVAL '1 day'),
('cc000014-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Asanka Karunaratne', '+94 78 556 6778', 'asanka.k@gmail.com', '85 Sri Saranankara Road, Dehiwala', 18300.00, 4, 0.00, NOW() - INTERVAL '8 days'),
('cc000015-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Fathima Zeenath', '+94 77 443 3221', 'zeenath.fathima@gmail.com', '27 Maligawatta Place, Colombo 10', 92500.00, 18, 0.00, NOW() - INTERVAL '3 days'),
('cc000016-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Pradeep Kumara', '+94 70 889 9002', 'pradeep.kumara@gmail.com', '14 Negombo Road, Peliyagoda', 34800.00, 8, 2200.00, NOW() - INTERVAL '6 days'),
('cc000017-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Hiruni Rathnayake', '+94 77 119 9228', 'hiruni.rathna@gmail.com', '73 Nawala Road, Rajagiriya', 58700.00, 13, 0.00, NOW() - INTERVAL '2 days'),
('cc000018-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Mahesh Wickramasinghe', '+94 76 123 9876', 'mahesh.wick@gmail.com', '29 Jubilee Post, Mirihana', 41200.00, 10, 0.00, NOW() - INTERVAL '4 days'),
('cc000019-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Nimanthi Abeysekera', '+94 71 990 0112', 'nimanthi.a@gmail.com', '91 Pagoda Road, Nugegoda', 26400.00, 6, 0.00, NOW() - INTERVAL '5 days'),
('cc000020-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Roshan Liyanage', '+94 77 554 4332', 'roshan.liya@gmail.com', '52 Old Kesbewa Road, Nugegoda', 67800.00, 14, 0.00, NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- 5. EMPLOYEES (6 Employees for DEMO_BASIC_01)
INSERT INTO employees (id, business_id, employee_id_number, name, email, phone, position, department, salary, join_date, status, avatar_url) VALUES
('ee000001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'EMP-001', 'Kasun Perera', 'kasun.p@harshapex.lk', '+94 77 123 4561', 'Owner & Director', 'Executive', 180000.00, '2022-01-15', 'active', '/demo-assets/employees/emp-1.webp'),
('ee000002-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'EMP-002', 'Buddhika Senanayake', 'buddhika.s@harshapex.lk', '+94 77 223 3441', 'Store General Manager', 'Operations', 125000.00, '2022-04-01', 'active', '/demo-assets/employees/emp-2.webp'),
('ee000003-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'EMP-003', 'Sanduni Wijeratne', 'sanduni.w@harshapex.lk', '+94 71 334 4552', 'Senior Cashier & Sales Lead', 'Sales', 75000.00, '2022-08-15', 'active', '/demo-assets/employees/emp-3.webp'),
('ee000004-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'EMP-004', 'Nuwan Jayalath', 'nuwan.j@harshapex.lk', '+94 76 445 5663', 'Inventory & Stock Supervisor', 'Logistics', 80000.00, '2023-01-10', 'active', '/demo-assets/employees/emp-4.webp'),
('ee000005-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'EMP-005', 'Kavinda Maduranga', 'kavinda.m@harshapex.lk', '+94 70 556 6774', 'Junior Cashier', 'Sales', 60000.00, '2023-06-01', 'active', '/demo-assets/employees/emp-5.webp'),
('ee000006-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'EMP-006', 'Dharshani Mendis', 'dharshani.m@harshapex.lk', '+94 77 667 7885', 'Accountant & Compliance', 'Finance', 95000.00, '2023-03-20', 'active', '/demo-assets/employees/emp-6.webp')
ON CONFLICT (business_id, employee_id_number) DO NOTHING;

-- 6. EXPENSE CATEGORIES
INSERT INTO expense_categories (id, business_id, name, description) VALUES
('ec000001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Store Rent & Rates', 'Monthly commercial lease and municipal rates'),
('ec000002-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Electricity & Water Utilities', 'CEB power bills and NWSDB commercial water rates'),
('ec000003-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Staff Salaries & Overtime', 'Monthly payroll disbursements'),
('ec000004-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Logistics & Fuel', 'Delivery van fuel and transport charges'),
('ec000005-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Store Maintenance & IT', 'POS rolls, barcode scanners, and AC servicing')
ON CONFLICT (business_id, name) DO NOTHING;

-- 7. EXPENSES
INSERT INTO expenses (id, business_id, category_id, expense_number, expense_date, description, amount, payment_method, notes) VALUES
('ea000001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ec000001-0000-0000-0000-000000000001', 'EXP-2026-001', CURRENT_DATE - INTERVAL '15 days', 'Colombo Store Monthly Lease', 85000.00, 'bank_transfer', 'Paid to landlord directly'),
('ea000002-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ec000002-0000-0000-0000-000000000001', 'EXP-2026-002', CURRENT_DATE - INTERVAL '10 days', 'CEB Commercial Electricity Bill', 24500.00, 'bank_transfer', 'High cooling usage this billing cycle'),
('ea000003-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ec000004-0000-0000-0000-000000000001', 'EXP-2026-003', CURRENT_DATE - INTERVAL '5 days', 'Delivery Van Diesel & Maintenance', 14200.00, 'card', 'Islandwide store replenishment'),
('ea000004-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ec000005-0000-0000-0000-000000000001', 'EXP-2026-004', CURRENT_DATE - INTERVAL '2 days', 'Thermal Receipt Paper Rolls (50 pack)', 6500.00, 'cash', 'Purchased from Pettah stationers')
ON CONFLICT (business_id, expense_number) DO NOTHING;

-- 8. ORDERS, ITEMS, INVOICES & PAYMENTS
INSERT INTO orders (id, business_id, order_number, customer_id, status, payment_status, payment_method, subtotal, discount_amount, tax_amount, total_amount, notes, created_at) VALUES
('aa000001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-2026-1001', 'cc000001-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 4580.00, 0, 0, 4580.00, 'Counter checkout', NOW() - INTERVAL '3 hours'),
('aa000002-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-2026-1002', 'cc000002-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 7240.00, 240.00, 0, 7000.00, 'Family grocery run', NOW() - INTERVAL '5 hours'),
('aa000003-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-2026-1003', 'cc000003-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 15200.00, 200.00, 0, 15000.00, 'Bulk tea and spices', NOW() - INTERVAL '1 day'),
('aa000004-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-2026-1004', 'cc000005-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 3150.00, 0, 0, 3150.00, 'Weekend essentials', NOW() - INTERVAL '1 day'),
('aa000005-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-2026-1005', 'cc000006-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 8900.00, 0, 0, 8900.00, 'Office pantry supplies', NOW() - INTERVAL '2 days')
ON CONFLICT (business_id, order_number) DO NOTHING;

-- Order Items
INSERT INTO order_items (id, business_id, order_id, product_id, quantity, unit_price, cost_price, discount_amount, total_price) VALUES
('bb000001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000001', 'da000001-0000-0000-0000-000000000001', 2, 1650.00, 1200.00, 0, 3300.00),
('bb000002-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000001', 'da000003-0000-0000-0000-000000000001', 1, 1250.00, 950.00, 0, 1250.00),
('bb000003-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa000002-0000-0000-0000-000000000001', 'da000002-0000-0000-0000-000000000001', 3, 1680.00, 1350.00, 0, 5040.00),
('bb000004-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa000002-0000-0000-0000-000000000001', 'da000008-0000-0000-0000-000000000001', 1, 1200.00, 850.00, 0, 1200.00)
ON CONFLICT DO NOTHING;

-- Invoices
INSERT INTO invoices (id, business_id, order_id, customer_id, invoice_number, issue_date, due_date, subtotal, discount_amount, tax_amount, total_amount, paid_amount, balance_amount, status, notes) VALUES
('ba000001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000001', 'cc000001-0000-0000-0000-000000000001', 'HA-INV-01001', CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', 4580.00, 0, 0, 4580.00, 4580.00, 0, 'paid', 'POS Instant Receipt'),
('ba000002-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa000002-0000-0000-0000-000000000001', 'cc000002-0000-0000-0000-000000000001', 'HA-INV-01002', CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', 7240.00, 240.00, 0, 7000.00, 7000.00, 0, 'paid', 'POS Card Receipt'),
('ba000003-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa000003-0000-0000-0000-000000000001', 'cc000003-0000-0000-0000-000000000001', 'HA-INV-01003', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '13 days', 15200.00, 200.00, 0, 15000.00, 15000.00, 0, 'paid', 'Wholesale Tea Supply')
ON CONFLICT (business_id, invoice_number) DO NOTHING;

-- Payments
INSERT INTO payments (id, business_id, invoice_id, order_id, customer_id, amount, payment_method, payment_reference, payment_date) VALUES
('fa000001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ba000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000001', 'cc000001-0000-0000-0000-000000000001', 4580.00, 'cash', 'CASH-TENDER-01', NOW() - INTERVAL '3 hours'),
('fa000002-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ba000002-0000-0000-0000-000000000001', 'aa000002-0000-0000-0000-000000000001', 'cc000002-0000-0000-0000-000000000001', 7000.00, 'card', 'VISA-APEX-9012', NOW() - INTERVAL '5 hours'),
('fa000003-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ba000003-0000-0000-0000-000000000001', 'aa000003-0000-0000-0000-000000000001', 'cc000003-0000-0000-0000-000000000001', 15000.00, 'bank_transfer', 'BOC-TX-883921', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;


-- END OF 05_seed_demo_workspaces_data.sql
