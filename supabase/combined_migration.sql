-- ============================================================
-- HARSH APEX SMART BUSINESS SUITE - COMBINED MIGRATION SCRIPT
-- Complete Multi-Tenant Database Architecture, RLS, Packages,
-- Roles, Demo Data, Storage Buckets, and Supabase Auth Setup
-- Brand: Harsh Apex Digital Solutions
-- ============================================================


-- >>>>>>>>>>>>>>>>>> BEGIN FILE: 01_initial_schema.sql <<<<<<<<<<<<<<<<<<

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


-- >>>>>>>>>>>>>>>>>> END FILE: 01_initial_schema.sql <<<<<<<<<<<<<<<<<<


-- >>>>>>>>>>>>>>>>>> BEGIN FILE: 02_rls_policies.sql <<<<<<<<<<<<<<<<<<

-- ============================================================
-- HARSH APEX SMART BUSINESS SUITE - 02_RLS_POLICIES.SQL
-- Supabase Row Level Security (RLS) for Strict Multi-Tenant Isolation
-- ============================================================

-- Safe fallback setup for auth schema (used when running on raw local/PGlite engines)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        BEGIN
            CREATE SCHEMA auth;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'auth' AND p.proname = 'uid') THEN
        BEGIN
            EXECUTE 'CREATE FUNCTION auth.uid() RETURNS UUID AS $f$ SELECT NULL::UUID; $f$ LANGUAGE sql STABLE;';
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'auth' AND p.proname = 'role') THEN
        BEGIN
            EXECUTE 'CREATE FUNCTION auth.role() RETURNS TEXT AS $f$ SELECT ''authenticated''::TEXT; $f$ LANGUAGE sql STABLE;';
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'auth' AND p.proname = 'jwt') THEN
        BEGIN
            EXECUTE 'CREATE FUNCTION auth.jwt() RETURNS JSONB AS $f$ SELECT ''{"role": "authenticated"}''::JSONB; $f$ LANGUAGE sql STABLE;';
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Function to obtain current user's business_id from profiles
CREATE OR REPLACE FUNCTION public.get_auth_business_id()
RETURNS UUID AS $$
    SELECT business_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Also create without schema prefix for backward compatibility
CREATE OR REPLACE FUNCTION get_auth_business_id()
RETURNS UUID AS $$
    SELECT business_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function to check if current user is Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.roles r ON p.role_id = r.id
        WHERE p.user_id = auth.uid() AND r.code = 'SUPER_ADMIN'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Also create without schema prefix for backward compatibility
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.roles r ON p.role_id = r.id
        WHERE p.user_id = auth.uid() AND r.code = 'SUPER_ADMIN'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1. PUBLIC READABLE METADATA TABLES (Packages, Features, Roles, Permissions)
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Packages are publicly readable" ON packages;
CREATE POLICY "Packages are publicly readable" ON packages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Super admin can manage packages" ON packages;
CREATE POLICY "Super admin can manage packages" ON packages FOR ALL USING (is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE features ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Features are publicly readable" ON features;
CREATE POLICY "Features are publicly readable" ON features FOR SELECT USING (true);
DROP POLICY IF EXISTS "Super admin can manage features" ON features;
CREATE POLICY "Super admin can manage features" ON features FOR ALL USING (is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE package_features ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Package features are publicly readable" ON package_features;
CREATE POLICY "Package features are publicly readable" ON package_features FOR SELECT USING (true);
DROP POLICY IF EXISTS "Super admin can manage package features" ON package_features;
CREATE POLICY "Super admin can manage package features" ON package_features FOR ALL USING (is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Roles are readable by authenticated users" ON roles;
CREATE POLICY "Roles are readable by authenticated users" ON roles FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Super admin can manage roles" ON roles;
CREATE POLICY "Super admin can manage roles" ON roles FOR ALL USING (is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permissions are readable by authenticated users" ON permissions;
CREATE POLICY "Permissions are readable by authenticated users" ON permissions FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Super admin can manage permissions" ON permissions;
CREATE POLICY "Super admin can manage permissions" ON permissions FOR ALL USING (is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Role permissions are readable by authenticated users" ON role_permissions;
CREATE POLICY "Role permissions are readable by authenticated users" ON role_permissions FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Super admin can manage role permissions" ON role_permissions;
CREATE POLICY "Super admin can manage role permissions" ON role_permissions FOR ALL USING (is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

-- 2. BUSINESSES & SETTINGS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own business" ON businesses;
CREATE POLICY "Users can view their own business" ON businesses FOR SELECT
USING (id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Users can update their own business" ON businesses;
CREATE POLICY "Users can update their own business" ON businesses FOR UPDATE
USING (id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for business_settings select" ON business_settings;
CREATE POLICY "Tenant isolation for business_settings select" ON business_settings FOR SELECT
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Tenant isolation for business_settings update" ON business_settings;
CREATE POLICY "Tenant isolation for business_settings update" ON business_settings FOR UPDATE
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

-- 3. PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view profiles in their own business" ON profiles;
CREATE POLICY "Users can view profiles in their own business" ON profiles FOR SELECT
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE
USING (user_id = auth.uid() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
CREATE POLICY "Service role can insert profiles" ON profiles FOR INSERT
WITH CHECK (true);

-- 4. TENANT ENTITY MACRO POLICIES (Products, Categories, Suppliers, Inventory, Stock Movements)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for categories" ON categories;
CREATE POLICY "Tenant isolation for categories" ON categories FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for suppliers" ON suppliers;
CREATE POLICY "Tenant isolation for suppliers" ON suppliers FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for products" ON products;
CREATE POLICY "Tenant isolation for products" ON products FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for inventory" ON inventory;
CREATE POLICY "Tenant isolation for inventory" ON inventory FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for stock_movements" ON stock_movements;
CREATE POLICY "Tenant isolation for stock_movements" ON stock_movements FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

-- 5. CUSTOMERS & NOTES
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for customers" ON customers;
CREATE POLICY "Tenant isolation for customers" ON customers FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for customer_notes" ON customer_notes;
CREATE POLICY "Tenant isolation for customer_notes" ON customer_notes FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

-- 6. ORDERS & ORDER ITEMS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for orders" ON orders;
CREATE POLICY "Tenant isolation for orders" ON orders FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for order_items" ON order_items;
CREATE POLICY "Tenant isolation for order_items" ON order_items FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

-- 7. INVOICES, QUOTATIONS & PAYMENTS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for invoices" ON invoices;
CREATE POLICY "Tenant isolation for invoices" ON invoices FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for invoice_items" ON invoice_items;
CREATE POLICY "Tenant isolation for invoice_items" ON invoice_items FOR ALL
USING (
    EXISTS (SELECT 1 FROM invoices inv WHERE inv.id = invoice_items.invoice_id AND (inv.business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role'))
);

ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for quotations" ON quotations;
CREATE POLICY "Tenant isolation for quotations" ON quotations FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for quotation_items" ON quotation_items;
CREATE POLICY "Tenant isolation for quotation_items" ON quotation_items FOR ALL
USING (
    EXISTS (SELECT 1 FROM quotations q WHERE q.id = quotation_items.quotation_id AND (q.business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role'))
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for payments" ON payments;
CREATE POLICY "Tenant isolation for payments" ON payments FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

-- 8. EXPENSES
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for expense_categories" ON expense_categories;
CREATE POLICY "Tenant isolation for expense_categories" ON expense_categories FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for expenses" ON expenses;
CREATE POLICY "Tenant isolation for expenses" ON expenses FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

-- 9. EMPLOYEES & HR
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for employees" ON employees;
CREATE POLICY "Tenant isolation for employees" ON employees FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for attendance" ON attendance;
CREATE POLICY "Tenant isolation for attendance" ON attendance FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for leave_requests" ON leave_requests;
CREATE POLICY "Tenant isolation for leave_requests" ON leave_requests FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

-- 10. COMMUNICATIONS, LOGS & AUTOMATIONS
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for whatsapp_messages" ON whatsapp_messages;
CREATE POLICY "Tenant isolation for whatsapp_messages" ON whatsapp_messages FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for notifications" ON notifications;
CREATE POLICY "Tenant isolation for notifications" ON notifications FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for activity_logs" ON activity_logs;
CREATE POLICY "Tenant isolation for activity_logs" ON activity_logs FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for integrations" ON integrations;
CREATE POLICY "Tenant isolation for integrations" ON integrations FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for automations" ON automations;
CREATE POLICY "Tenant isolation for automations" ON automations FOR ALL
USING (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (business_id = get_auth_business_id() OR is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');

-- 11. LEADS (Public insert, Super Admin read/write)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit leads" ON leads;
CREATE POLICY "Anyone can submit leads" ON leads FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Super admin can view and manage leads" ON leads;
CREATE POLICY "Super admin can view and manage leads" ON leads FOR ALL
USING (is_super_admin() OR auth.jwt() ->> 'role' = 'service_role');


-- >>>>>>>>>>>>>>>>>> END FILE: 02_rls_policies.sql <<<<<<<<<<<<<<<<<<


-- >>>>>>>>>>>>>>>>>> BEGIN FILE: 03_seed_packages_roles.sql <<<<<<<<<<<<<<<<<<

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


-- >>>>>>>>>>>>>>>>>> END FILE: 03_seed_packages_roles.sql <<<<<<<<<<<<<<<<<<


-- >>>>>>>>>>>>>>>>>> BEGIN FILE: 04_seed_demo_accounts.sql <<<<<<<<<<<<<<<<<<

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


-- >>>>>>>>>>>>>>>>>> END FILE: 04_seed_demo_accounts.sql <<<<<<<<<<<<<<<<<<


-- >>>>>>>>>>>>>>>>>> BEGIN FILE: 05_seed_demo_workspaces_data.sql <<<<<<<<<<<<<<<<<<

-- ============================================================
-- HARSH APEX SMART BUSINESS SUITE - 05_SEED_DEMO_WORKSPACES_DATA.SQL
-- Realistic Sri Lankan Sample Data for ALL 6 Demo Workspaces
-- Seeded per workspace: 10 Categories, 30 Products, 20 Customers,
-- 40 Orders, 15 Invoices, 10 Expenses, 6 Employees
-- ============================================================


-- ============================================================
-- WORKSPACE B1: DEMO_BASIC_01 - Apex Mart Colombo (Colombo)
-- ============================================================

-- 1. CATEGORIES FOR B1
INSERT INTO categories (id, business_id, name, slug, description, image_url) VALUES
('ca100001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Beverages & Refreshments', 'cat-b1-1', 'Beverages & Refreshments for Colombo branch', '/demo-assets/categories/cat-1.webp'),
('ca100002-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Rice, Grains & Pulses', 'cat-b1-2', 'Rice, Grains & Pulses for Colombo branch', '/demo-assets/categories/cat-2.webp'),
('ca100003-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Spices, Herbs & Seasoning', 'cat-b1-3', 'Spices, Herbs & Seasoning for Colombo branch', '/demo-assets/categories/cat-3.webp'),
('ca100004-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Bakery & Confectionery', 'cat-b1-4', 'Bakery & Confectionery for Colombo branch', '/demo-assets/categories/cat-4.webp'),
('ca100005-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Dairy, Eggs & Butter', 'cat-b1-5', 'Dairy, Eggs & Butter for Colombo branch', '/demo-assets/categories/cat-5.webp'),
('ca100006-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Snacks & Crisps', 'cat-b1-6', 'Snacks & Crisps for Colombo branch', '/demo-assets/categories/cat-6.webp'),
('ca100007-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Household Cleaning & Laundry', 'cat-b1-7', 'Household Cleaning & Laundry for Colombo branch', '/demo-assets/categories/cat-7.webp'),
('ca100008-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Personal Care & Toiletries', 'cat-b1-8', 'Personal Care & Toiletries for Colombo branch', '/demo-assets/categories/cat-8.webp'),
('ca100009-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Stationery & Office Supplies', 'cat-b1-9', 'Stationery & Office Supplies for Colombo branch', '/demo-assets/categories/cat-9.webp'),
('ca10000a-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Fresh Produce & Essentials', 'cat-b1-10', 'Fresh Produce & Essentials for Colombo branch', '/demo-assets/categories/cat-10.webp')
ON CONFLICT (business_id, slug) DO NOTHING;

-- 2. PRODUCTS FOR B1 (30 Products)
INSERT INTO products (id, business_id, category_id, name, sku, barcode, description, cost_price, selling_price, stock_quantity, min_stock_level, image_url, status) VALUES
('da100001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca100001-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B1 #1', 'SKU-B1-001', '79357100001', 'Commercial Grade Item 1 for DEMO_BASIC_01 - Apex Mart Colombo', 295.00, 400.00, 22, 8, '/demo-assets/products/prod-2.webp', 'active'),
('da100002-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca100002-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B1 #2', 'SKU-B1-002', '79357100002', 'Commercial Grade Item 2 for DEMO_BASIC_01 - Apex Mart Colombo', 340.00, 460.00, 29, 8, '/demo-assets/products/prod-3.webp', 'active'),
('da100003-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca100003-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B1 #3', 'SKU-B1-003', '79357100003', 'Commercial Grade Item 3 for DEMO_BASIC_01 - Apex Mart Colombo', 385.00, 520.00, 36, 8, '/demo-assets/products/prod-4.webp', 'active'),
('da100004-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca100004-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B1 #4', 'SKU-B1-004', '79357100004', 'Commercial Grade Item 4 for DEMO_BASIC_01 - Apex Mart Colombo', 430.00, 580.00, 43, 8, '/demo-assets/products/prod-5.webp', 'active'),
('da100005-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca100005-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B1 #5', 'SKU-B1-005', '79357100005', 'Commercial Grade Item 5 for DEMO_BASIC_01 - Apex Mart Colombo', 475.00, 640.00, 50, 8, '/demo-assets/products/prod-6.webp', 'active'),
('da100006-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca100006-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B1 #6', 'SKU-B1-006', '79357100006', 'Commercial Grade Item 6 for DEMO_BASIC_01 - Apex Mart Colombo', 520.00, 700.00, 57, 8, '/demo-assets/products/prod-7.webp', 'active'),
('da100007-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca100007-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B1 #7', 'SKU-B1-007', '79357100007', 'Commercial Grade Item 7 for DEMO_BASIC_01 - Apex Mart Colombo', 565.00, 760.00, 64, 8, '/demo-assets/products/prod-8.webp', 'active'),
('da100008-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca100008-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B1 #8', 'SKU-B1-008', '79357100008', 'Commercial Grade Item 8 for DEMO_BASIC_01 - Apex Mart Colombo', 610.00, 820.00, 71, 8, '/demo-assets/products/prod-9.webp', 'active'),
('da100009-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca100009-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B1 #9', 'SKU-B1-009', '79357100009', 'Commercial Grade Item 9 for DEMO_BASIC_01 - Apex Mart Colombo', 655.00, 880.00, 78, 8, '/demo-assets/products/prod-10.webp', 'active'),
('da10000a-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca10000a-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B1 #10', 'SKU-B1-010', '79357100010', 'Commercial Grade Item 10 for DEMO_BASIC_01 - Apex Mart Colombo', 700.00, 950.00, 20, 8, '/demo-assets/products/prod-1.webp', 'active'),
('da10000b-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca100001-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B1 #11', 'SKU-B1-011', '79357100011', 'Commercial Grade Item 11 for DEMO_BASIC_01 - Apex Mart Colombo', 745.00, 1010.00, 27, 8, '/demo-assets/products/prod-2.webp', 'active'),
('da10000c-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca100002-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B1 #12', 'SKU-B1-012', '79357100012', 'Commercial Grade Item 12 for DEMO_BASIC_01 - Apex Mart Colombo', 790.00, 1070.00, 34, 8, '/demo-assets/products/prod-3.webp', 'active'),
('da10000d-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca100003-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B1 #13', 'SKU-B1-013', '79357100013', 'Commercial Grade Item 13 for DEMO_BASIC_01 - Apex Mart Colombo', 835.00, 1130.00, 41, 8, '/demo-assets/products/prod-4.webp', 'active'),
('da10000e-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca100004-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B1 #14', 'SKU-B1-014', '79357100014', 'Commercial Grade Item 14 for DEMO_BASIC_01 - Apex Mart Colombo', 880.00, 1190.00, 48, 8, '/demo-assets/products/prod-5.webp', 'active'),
('da10000f-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca100005-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B1 #15', 'SKU-B1-015', '79357100015', 'Commercial Grade Item 15 for DEMO_BASIC_01 - Apex Mart Colombo', 925.00, 1250.00, 55, 8, '/demo-assets/products/prod-6.webp', 'active'),
('da100010-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca100006-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B1 #16', 'SKU-B1-016', '79357100016', 'Commercial Grade Item 16 for DEMO_BASIC_01 - Apex Mart Colombo', 970.00, 1310.00, 62, 8, '/demo-assets/products/prod-7.webp', 'active'),
('da100011-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca100007-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B1 #17', 'SKU-B1-017', '79357100017', 'Commercial Grade Item 17 for DEMO_BASIC_01 - Apex Mart Colombo', 1015.00, 1370.00, 69, 8, '/demo-assets/products/prod-8.webp', 'active'),
('da100012-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca100008-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B1 #18', 'SKU-B1-018', '79357100018', 'Commercial Grade Item 18 for DEMO_BASIC_01 - Apex Mart Colombo', 1060.00, 1430.00, 76, 8, '/demo-assets/products/prod-9.webp', 'active'),
('da100013-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca100009-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B1 #19', 'SKU-B1-019', '79357100019', 'Commercial Grade Item 19 for DEMO_BASIC_01 - Apex Mart Colombo', 1105.00, 1490.00, 18, 8, '/demo-assets/products/prod-10.webp', 'active'),
('da100014-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca10000a-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B1 #20', 'SKU-B1-020', '79357100020', 'Commercial Grade Item 20 for DEMO_BASIC_01 - Apex Mart Colombo', 1150.00, 1550.00, 25, 8, '/demo-assets/products/prod-1.webp', 'active'),
('da100015-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca100001-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B1 #21', 'SKU-B1-021', '79357100021', 'Commercial Grade Item 21 for DEMO_BASIC_01 - Apex Mart Colombo', 1195.00, 1610.00, 32, 8, '/demo-assets/products/prod-2.webp', 'active'),
('da100016-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca100002-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B1 #22', 'SKU-B1-022', '79357100022', 'Commercial Grade Item 22 for DEMO_BASIC_01 - Apex Mart Colombo', 1240.00, 1670.00, 39, 8, '/demo-assets/products/prod-3.webp', 'active'),
('da100017-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca100003-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B1 #23', 'SKU-B1-023', '79357100023', 'Commercial Grade Item 23 for DEMO_BASIC_01 - Apex Mart Colombo', 1285.00, 1730.00, 46, 8, '/demo-assets/products/prod-4.webp', 'active'),
('da100018-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca100004-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B1 #24', 'SKU-B1-024', '79357100024', 'Commercial Grade Item 24 for DEMO_BASIC_01 - Apex Mart Colombo', 1330.00, 1800.00, 53, 8, '/demo-assets/products/prod-5.webp', 'active'),
('da100019-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca100005-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B1 #25', 'SKU-B1-025', '79357100025', 'Commercial Grade Item 25 for DEMO_BASIC_01 - Apex Mart Colombo', 1375.00, 1860.00, 60, 8, '/demo-assets/products/prod-6.webp', 'active'),
('da10001a-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca100006-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B1 #26', 'SKU-B1-026', '79357100026', 'Commercial Grade Item 26 for DEMO_BASIC_01 - Apex Mart Colombo', 1420.00, 1920.00, 67, 8, '/demo-assets/products/prod-7.webp', 'active'),
('da10001b-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca100007-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B1 #27', 'SKU-B1-027', '79357100027', 'Commercial Grade Item 27 for DEMO_BASIC_01 - Apex Mart Colombo', 1465.00, 1980.00, 74, 8, '/demo-assets/products/prod-8.webp', 'active'),
('da10001c-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca100008-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B1 #28', 'SKU-B1-028', '79357100028', 'Commercial Grade Item 28 for DEMO_BASIC_01 - Apex Mart Colombo', 1510.00, 2040.00, 16, 8, '/demo-assets/products/prod-9.webp', 'active'),
('da10001d-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca100009-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B1 #29', 'SKU-B1-029', '79357100029', 'Commercial Grade Item 29 for DEMO_BASIC_01 - Apex Mart Colombo', 1555.00, 2100.00, 23, 8, '/demo-assets/products/prod-10.webp', 'active'),
('da10001e-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ca10000a-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B1 #30', 'SKU-B1-030', '79357100030', 'Commercial Grade Item 30 for DEMO_BASIC_01 - Apex Mart Colombo', 1600.00, 2160.00, 30, 8, '/demo-assets/products/prod-1.webp', 'active')
ON CONFLICT (business_id, sku) DO NOTHING;

-- 3. INVENTORY FOR B1
INSERT INTO inventory (business_id, product_id, quantity, reserved_quantity, location)
SELECT business_id, id, stock_quantity, 0, 'Colombo Main Store'
FROM products WHERE business_id = 'a1000000-0000-0000-0000-000000000001'
ON CONFLICT (business_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- 4. CUSTOMERS FOR B1 (20 Customers)
INSERT INTO customers (id, business_id, name, phone, email, address, total_purchases, total_orders, outstanding_balance, last_purchase_at) VALUES
('cc100001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Sunil Jayawardena', '+94 77 234 5678', 'sunil.j.b1@gmail.com', '142 Havelock Road, Colombo', 14400.00, 4, 0.00, NOW() - INTERVAL '1 days'),
('cc100002-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Kumari Alwis', '+94 71 876 5432', 'kumari.alwis.b1@gmail.com', '56 Rajagiriya Road, Colombo', 16800.00, 5, 0.00, NOW() - INTERVAL '2 days'),
('cc100003-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Mohamed Rizwan', '+94 76 543 2198', 'm.rizwan.trading.b1@gmail.com', '88 Keyzer Street, Pettah, Colombo', 19200.00, 6, 0.00, NOW() - INTERVAL '3 days'),
('cc100004-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Priyantha Gunasekara', '+94 77 654 3210', 'priyantha.guna.b1@gmail.com', '23 Temple Road, Nugegoda, Colombo', 21600.00, 7, 0.00, NOW() - INTERVAL '4 days'),
('cc100005-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Chamari Dissanayake', '+94 72 345 6789', 'chamari.d.b1@gmail.com', '77 Stanley Tillakaratne Mawatha, Colombo', 24000.00, 8, 3750.00, NOW() - INTERVAL '5 days'),
('cc100006-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Siva Subramaniam', '+94 77 889 9001', 'siva.subra.b1@gmail.com', '12 Sea Street, Colombo', 26400.00, 9, 0.00, NOW() - INTERVAL '6 days'),
('cc100007-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Anushka Bandara', '+94 75 112 2334', 'anushka.b.b1@gmail.com', '98 High Level Road, Maharagama, Colombo', 28800.00, 10, 0.00, NOW() - INTERVAL '7 days'),
('cc100008-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Malik Mansoor', '+94 77 998 8776', 'malik.mansoor.b1@gmail.com', '34 Wekande Road, Colombo', 31200.00, 11, 0.00, NOW() - INTERVAL '8 days'),
('cc100009-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Kavindi Senaratne', '+94 71 445 5667', 'kavindi.sena.b1@gmail.com', '5 Anderson Road, Dehiwala, Colombo', 33600.00, 12, 0.00, NOW() - INTERVAL '9 days'),
('cc10000a-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Dinesh Samarawickrama', '+94 70 334 4556', 'dinesh.sam.b1@gmail.com', '19 Galle Road, Mount Lavinia, Colombo', 36000.00, 13, 7500.00, NOW() - INTERVAL '10 days'),
('cc10000b-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Shalini Weerasinghe', '+94 77 667 7889', 'shalini.w.b1@gmail.com', '40 Duplication Road, Colombo', 38400.00, 14, 0.00, NOW() - INTERVAL '11 days'),
('cc10000c-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Ruwan Edirisinghe', '+94 76 778 8990', 'ruwan.ediri.b1@gmail.com', '62 Baseline Road, Dematagoda, Colombo', 40800.00, 15, 0.00, NOW() - INTERVAL '12 days'),
('cc10000d-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Thilini Fonseka', '+94 71 223 3445', 'thilini.fonseka.b1@gmail.com', '110 Hospital Road, Kalubowila, Colombo', 43200.00, 16, 0.00, NOW() - INTERVAL '13 days'),
('cc10000e-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Asanka Karunaratne', '+94 78 556 6778', 'asanka.k.b1@gmail.com', '85 Sri Saranankara Road, Colombo', 45600.00, 17, 0.00, NOW() - INTERVAL '14 days'),
('cc10000f-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Fathima Zeenath', '+94 77 443 3221', 'zeenath.fathima.b1@gmail.com', '27 Maligawatta Place, Colombo', 48000.00, 3, 11250.00, NOW() - INTERVAL '15 days'),
('cc100010-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Pradeep Kumara', '+94 70 889 9002', 'pradeep.kumara.b1@gmail.com', '14 Negombo Road, Peliyagoda, Colombo', 50400.00, 4, 0.00, NOW() - INTERVAL '16 days'),
('cc100011-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Hiruni Rathnayake', '+94 77 119 9228', 'hiruni.rathna.b1@gmail.com', '73 Nawala Road, Colombo', 52800.00, 5, 0.00, NOW() - INTERVAL '17 days'),
('cc100012-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Mahesh Wickramasinghe', '+94 76 123 9876', 'mahesh.wick.b1@gmail.com', '29 Jubilee Post, Mirihana, Colombo', 55200.00, 6, 0.00, NOW() - INTERVAL '18 days'),
('cc100013-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Nimanthi Abeysekera', '+94 71 990 0112', 'nimanthi.a.b1@gmail.com', '91 Pagoda Road, Nugegoda, Colombo', 57600.00, 7, 0.00, NOW() - INTERVAL '19 days'),
('cc100014-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Roshan Liyanage', '+94 77 554 4332', 'roshan.liya.b1@gmail.com', '52 Old Kesbewa Road, Colombo', 60000.00, 8, 15000.00, NOW() - INTERVAL '20 days')
ON CONFLICT (id) DO NOTHING;

-- 5. EMPLOYEES FOR B1 (6 Employees)
INSERT INTO employees (id, business_id, employee_id_number, name, email, phone, position, department, salary, join_date, status, avatar_url) VALUES
('ee100001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'EMP-001-B1', 'Kasun Perera', 'kasun.perera.b1@harshapex.lk', '+94 77 011 4512', 'Owner & General Director', 'Executive', 220000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-1.webp'),
('ee100002-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'EMP-002-B1', 'Buddhika Senanayake', 'buddhika.senanayake.b1@harshapex.lk', '+94 77 012 4522', 'Operations General Manager', 'Operations', 140000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-2.webp'),
('ee100003-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'EMP-003-B1', 'Sanduni Wijeratne', 'sanduni.wijeratne.b1@harshapex.lk', '+94 77 013 4532', 'Head of Sales & Billing', 'Sales', 85000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-3.webp'),
('ee100004-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'EMP-004-B1', 'Nuwan Jayalath', 'nuwan.jayalath.b1@harshapex.lk', '+94 77 014 4542', 'Inventory & Logistics Lead', 'Logistics', 90000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-4.webp'),
('ee100005-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'EMP-005-B1', 'Kavinda Maduranga', 'kavinda.maduranga.b1@harshapex.lk', '+94 77 015 4552', 'Senior Counter Cashier', 'Sales', 65000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-5.webp'),
('ee100006-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'EMP-006-B1', 'Dharshani Mendis', 'dharshani.mendis.b1@harshapex.lk', '+94 77 016 4562', 'Financial Analyst & Accounts', 'Finance', 105000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-6.webp')
ON CONFLICT (business_id, employee_id_number) DO NOTHING;

-- 6. EXPENSE CATEGORIES FOR B1
INSERT INTO expense_categories (id, business_id, name, description) VALUES
('ec100001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Store & Office Rent', 'Monthly commercial premises lease'),
('ec100002-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Electricity & Water Utilities', 'CEB & commercial utilities'),
('ec100003-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Staff Salaries & Overtime', 'Monthly payroll disbursements'),
('ec100004-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Logistics, Delivery & Fuel', 'Fleet fuel and transport charges'),
('ec100005-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Equipment & IT Maintenance', 'Hardware, thermal rolls, and network maintenance'),
('ec100006-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Marketing & Customer Loyalty', 'Promotional campaigns and SMS alerts'),
('ec100007-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Security & Municipal Taxes', 'Premises security and local council rates'),
('ec100008-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Packaging & Consumables', 'Eco bags, boxes, and parcel wrap'),
('ec100009-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Accounting & Professional Fees', 'Auditing, secretarial and legal retainer'),
('ec10000a-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Miscellaneous Operational Contingency', 'Store daily operational petty expenses')
ON CONFLICT (business_id, name) DO NOTHING;

-- 7. EXPENSES FOR B1 (10 Expenses)
INSERT INTO expenses (id, business_id, category_id, expense_number, expense_date, description, amount, payment_method, notes) VALUES
('ea100001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ec100001-0000-0000-0000-000000000001', 'EXP-B1-2026-001', CURRENT_DATE - INTERVAL '2 days', 'Store & Office Rent - Colombo', 11700.00, 'card', 'Disbursed for Colombo branch operational expenses'),
('ea100002-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ec100002-0000-0000-0000-000000000001', 'EXP-B1-2026-002', CURRENT_DATE - INTERVAL '4 days', 'Electricity & Water Utilities - Colombo', 14900.00, 'bank_transfer', 'Disbursed for Colombo branch operational expenses'),
('ea100003-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ec100003-0000-0000-0000-000000000001', 'EXP-B1-2026-003', CURRENT_DATE - INTERVAL '6 days', 'Staff Salaries & Overtime - Colombo', 18100.00, 'cash', 'Disbursed for Colombo branch operational expenses'),
('ea100004-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ec100004-0000-0000-0000-000000000001', 'EXP-B1-2026-004', CURRENT_DATE - INTERVAL '8 days', 'Logistics, Delivery & Fuel - Colombo', 21300.00, 'card', 'Disbursed for Colombo branch operational expenses'),
('ea100005-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ec100005-0000-0000-0000-000000000001', 'EXP-B1-2026-005', CURRENT_DATE - INTERVAL '10 days', 'Equipment & IT Maintenance - Colombo', 24500.00, 'bank_transfer', 'Disbursed for Colombo branch operational expenses'),
('ea100006-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ec100006-0000-0000-0000-000000000001', 'EXP-B1-2026-006', CURRENT_DATE - INTERVAL '12 days', 'Marketing & Customer Loyalty - Colombo', 27700.00, 'cash', 'Disbursed for Colombo branch operational expenses'),
('ea100007-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ec100007-0000-0000-0000-000000000001', 'EXP-B1-2026-007', CURRENT_DATE - INTERVAL '14 days', 'Security & Municipal Taxes - Colombo', 30900.00, 'card', 'Disbursed for Colombo branch operational expenses'),
('ea100008-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ec100008-0000-0000-0000-000000000001', 'EXP-B1-2026-008', CURRENT_DATE - INTERVAL '16 days', 'Packaging & Consumables - Colombo', 34100.00, 'bank_transfer', 'Disbursed for Colombo branch operational expenses'),
('ea100009-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ec100009-0000-0000-0000-000000000001', 'EXP-B1-2026-009', CURRENT_DATE - INTERVAL '18 days', 'Accounting & Professional Fees - Colombo', 37300.00, 'cash', 'Disbursed for Colombo branch operational expenses'),
('ea10000a-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ec10000a-0000-0000-0000-000000000001', 'EXP-B1-2026-010', CURRENT_DATE - INTERVAL '20 days', 'Miscellaneous Operational Contingency - Colombo', 40500.00, 'card', 'Disbursed for Colombo branch operational expenses')
ON CONFLICT (business_id, expense_number) DO NOTHING;

-- 8. ORDERS FOR B1 (40 Orders)
INSERT INTO orders (id, business_id, order_number, customer_id, status, payment_status, payment_method, subtotal, discount_amount, tax_amount, total_amount, notes, created_at) VALUES
('aa100001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1001', 'cc100001-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 2850.00, 0.00, 0, 2850.00, 'Order 1 processed in Colombo', NOW() - INTERVAL '4 hours'),
('aa100002-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1002', 'cc100002-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 3200.00, 0.00, 0, 3200.00, 'Order 2 processed in Colombo', NOW() - INTERVAL '8 hours'),
('aa100003-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1003', 'cc100003-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 3550.00, 0.00, 0, 3550.00, 'Order 3 processed in Colombo', NOW() - INTERVAL '12 hours'),
('aa100004-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1004', 'cc100004-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 3900.00, 200.00, 0, 3700.00, 'Order 4 processed in Colombo', NOW() - INTERVAL '16 hours'),
('aa100005-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1005', 'cc100005-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 4250.00, 0.00, 0, 4250.00, 'Order 5 processed in Colombo', NOW() - INTERVAL '20 hours'),
('aa100006-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1006', 'cc100006-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 4600.00, 0.00, 0, 4600.00, 'Order 6 processed in Colombo', NOW() - INTERVAL '24 hours'),
('aa100007-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1007', 'cc100007-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 4950.00, 0.00, 0, 4950.00, 'Order 7 processed in Colombo', NOW() - INTERVAL '28 hours'),
('aa100008-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1008', 'cc100008-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 5300.00, 200.00, 0, 5100.00, 'Order 8 processed in Colombo', NOW() - INTERVAL '32 hours'),
('aa100009-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1009', 'cc100009-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 5650.00, 0.00, 0, 5650.00, 'Order 9 processed in Colombo', NOW() - INTERVAL '36 hours'),
('aa10000a-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1010', 'cc10000a-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 6000.00, 0.00, 0, 6000.00, 'Order 10 processed in Colombo', NOW() - INTERVAL '40 hours'),
('aa10000b-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1011', 'cc10000b-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 6350.00, 0.00, 0, 6350.00, 'Order 11 processed in Colombo', NOW() - INTERVAL '44 hours'),
('aa10000c-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1012', 'cc10000c-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 6700.00, 200.00, 0, 6500.00, 'Order 12 processed in Colombo', NOW() - INTERVAL '48 hours'),
('aa10000d-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1013', 'cc10000d-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 7050.00, 0.00, 0, 7050.00, 'Order 13 processed in Colombo', NOW() - INTERVAL '52 hours'),
('aa10000e-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1014', 'cc10000e-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 7400.00, 0.00, 0, 7400.00, 'Order 14 processed in Colombo', NOW() - INTERVAL '56 hours'),
('aa10000f-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1015', 'cc10000f-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 7750.00, 0.00, 0, 7750.00, 'Order 15 processed in Colombo', NOW() - INTERVAL '60 hours'),
('aa100010-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1016', 'cc100010-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 8100.00, 200.00, 0, 7900.00, 'Order 16 processed in Colombo', NOW() - INTERVAL '64 hours'),
('aa100011-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1017', 'cc100011-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 8450.00, 0.00, 0, 8450.00, 'Order 17 processed in Colombo', NOW() - INTERVAL '68 hours'),
('aa100012-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1018', 'cc100012-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 8800.00, 0.00, 0, 8800.00, 'Order 18 processed in Colombo', NOW() - INTERVAL '72 hours'),
('aa100013-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1019', 'cc100013-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 9150.00, 0.00, 0, 9150.00, 'Order 19 processed in Colombo', NOW() - INTERVAL '76 hours'),
('aa100014-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1020', 'cc100014-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 9500.00, 200.00, 0, 9300.00, 'Order 20 processed in Colombo', NOW() - INTERVAL '80 hours'),
('aa100015-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1021', 'cc100001-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 9850.00, 0.00, 0, 9850.00, 'Order 21 processed in Colombo', NOW() - INTERVAL '84 hours'),
('aa100016-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1022', 'cc100002-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 10200.00, 0.00, 0, 10200.00, 'Order 22 processed in Colombo', NOW() - INTERVAL '88 hours'),
('aa100017-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1023', 'cc100003-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 10550.00, 0.00, 0, 10550.00, 'Order 23 processed in Colombo', NOW() - INTERVAL '92 hours'),
('aa100018-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1024', 'cc100004-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 10900.00, 200.00, 0, 10700.00, 'Order 24 processed in Colombo', NOW() - INTERVAL '96 hours'),
('aa100019-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1025', 'cc100005-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 11250.00, 0.00, 0, 11250.00, 'Order 25 processed in Colombo', NOW() - INTERVAL '100 hours'),
('aa10001a-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1026', 'cc100006-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 11600.00, 0.00, 0, 11600.00, 'Order 26 processed in Colombo', NOW() - INTERVAL '104 hours'),
('aa10001b-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1027', 'cc100007-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 11950.00, 0.00, 0, 11950.00, 'Order 27 processed in Colombo', NOW() - INTERVAL '108 hours'),
('aa10001c-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1028', 'cc100008-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 12300.00, 200.00, 0, 12100.00, 'Order 28 processed in Colombo', NOW() - INTERVAL '112 hours'),
('aa10001d-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1029', 'cc100009-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 12650.00, 0.00, 0, 12650.00, 'Order 29 processed in Colombo', NOW() - INTERVAL '116 hours'),
('aa10001e-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1030', 'cc10000a-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 13000.00, 0.00, 0, 13000.00, 'Order 30 processed in Colombo', NOW() - INTERVAL '120 hours'),
('aa10001f-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1031', 'cc10000b-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 13350.00, 0.00, 0, 13350.00, 'Order 31 processed in Colombo', NOW() - INTERVAL '124 hours'),
('aa100020-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1032', 'cc10000c-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 13700.00, 200.00, 0, 13500.00, 'Order 32 processed in Colombo', NOW() - INTERVAL '128 hours'),
('aa100021-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1033', 'cc10000d-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 14050.00, 0.00, 0, 14050.00, 'Order 33 processed in Colombo', NOW() - INTERVAL '132 hours'),
('aa100022-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1034', 'cc10000e-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 14400.00, 0.00, 0, 14400.00, 'Order 34 processed in Colombo', NOW() - INTERVAL '136 hours'),
('aa100023-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1035', 'cc10000f-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 14750.00, 0.00, 0, 14750.00, 'Order 35 processed in Colombo', NOW() - INTERVAL '140 hours'),
('aa100024-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1036', 'cc100010-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 15100.00, 200.00, 0, 14900.00, 'Order 36 processed in Colombo', NOW() - INTERVAL '144 hours'),
('aa100025-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1037', 'cc100011-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 15450.00, 0.00, 0, 15450.00, 'Order 37 processed in Colombo', NOW() - INTERVAL '148 hours'),
('aa100026-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1038', 'cc100012-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 15800.00, 0.00, 0, 15800.00, 'Order 38 processed in Colombo', NOW() - INTERVAL '152 hours'),
('aa100027-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1039', 'cc100013-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 16150.00, 0.00, 0, 16150.00, 'Order 39 processed in Colombo', NOW() - INTERVAL '156 hours'),
('aa100028-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'ORD-B1-1040', 'cc100014-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 16500.00, 200.00, 0, 16300.00, 'Order 40 processed in Colombo', NOW() - INTERVAL '160 hours')
ON CONFLICT (business_id, order_number) DO NOTHING;

-- 9. ORDER ITEMS FOR B1
INSERT INTO order_items (id, business_id, order_id, product_id, quantity, unit_price, cost_price, discount_amount, total_price) VALUES
('bb100001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100001-0000-0000-0000-000000000001', 'da100001-0000-0000-0000-000000000001', 2, 900.00, 635.00, 0, 1800.00),
('bb100002-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100002-0000-0000-0000-000000000001', 'da100002-0000-0000-0000-000000000001', 2, 950.00, 670.00, 0, 1900.00),
('bb100003-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100003-0000-0000-0000-000000000001', 'da100003-0000-0000-0000-000000000001', 2, 1000.00, 705.00, 0, 2000.00),
('bb100004-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100004-0000-0000-0000-000000000001', 'da100004-0000-0000-0000-000000000001', 2, 1050.00, 740.00, 0, 2100.00),
('bb100005-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100005-0000-0000-0000-000000000001', 'da100005-0000-0000-0000-000000000001', 2, 1100.00, 775.00, 0, 2200.00),
('bb100006-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100006-0000-0000-0000-000000000001', 'da100006-0000-0000-0000-000000000001', 2, 1150.00, 810.00, 0, 2300.00),
('bb100007-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100007-0000-0000-0000-000000000001', 'da100007-0000-0000-0000-000000000001', 2, 1200.00, 845.00, 0, 2400.00),
('bb100008-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100008-0000-0000-0000-000000000001', 'da100008-0000-0000-0000-000000000001', 2, 1250.00, 880.00, 0, 2500.00),
('bb100009-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100009-0000-0000-0000-000000000001', 'da100009-0000-0000-0000-000000000001', 2, 1300.00, 915.00, 0, 2600.00),
('bb10000a-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa10000a-0000-0000-0000-000000000001', 'da10000a-0000-0000-0000-000000000001', 2, 1350.00, 950.00, 0, 2700.00),
('bb10000b-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa10000b-0000-0000-0000-000000000001', 'da10000b-0000-0000-0000-000000000001', 2, 1400.00, 985.00, 0, 2800.00),
('bb10000c-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa10000c-0000-0000-0000-000000000001', 'da10000c-0000-0000-0000-000000000001', 2, 1450.00, 1020.00, 0, 2900.00),
('bb10000d-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa10000d-0000-0000-0000-000000000001', 'da10000d-0000-0000-0000-000000000001', 2, 1500.00, 1055.00, 0, 3000.00),
('bb10000e-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa10000e-0000-0000-0000-000000000001', 'da10000e-0000-0000-0000-000000000001', 2, 1550.00, 1090.00, 0, 3100.00),
('bb10000f-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa10000f-0000-0000-0000-000000000001', 'da10000f-0000-0000-0000-000000000001', 2, 1600.00, 1125.00, 0, 3200.00),
('bb100010-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100010-0000-0000-0000-000000000001', 'da100010-0000-0000-0000-000000000001', 2, 1650.00, 1160.00, 0, 3300.00),
('bb100011-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100011-0000-0000-0000-000000000001', 'da100011-0000-0000-0000-000000000001', 2, 1700.00, 1195.00, 0, 3400.00),
('bb100012-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100012-0000-0000-0000-000000000001', 'da100012-0000-0000-0000-000000000001', 2, 1750.00, 1230.00, 0, 3500.00),
('bb100013-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100013-0000-0000-0000-000000000001', 'da100013-0000-0000-0000-000000000001', 2, 1800.00, 1265.00, 0, 3600.00),
('bb100014-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100014-0000-0000-0000-000000000001', 'da100014-0000-0000-0000-000000000001', 2, 1850.00, 1300.00, 0, 3700.00),
('bb100015-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100015-0000-0000-0000-000000000001', 'da100015-0000-0000-0000-000000000001', 2, 1900.00, 1335.00, 0, 3800.00),
('bb100016-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100016-0000-0000-0000-000000000001', 'da100016-0000-0000-0000-000000000001', 2, 1950.00, 1370.00, 0, 3900.00),
('bb100017-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100017-0000-0000-0000-000000000001', 'da100017-0000-0000-0000-000000000001', 2, 2000.00, 1405.00, 0, 4000.00),
('bb100018-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100018-0000-0000-0000-000000000001', 'da100018-0000-0000-0000-000000000001', 2, 2050.00, 1440.00, 0, 4100.00),
('bb100019-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100019-0000-0000-0000-000000000001', 'da100019-0000-0000-0000-000000000001', 2, 2100.00, 1475.00, 0, 4200.00),
('bb10001a-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa10001a-0000-0000-0000-000000000001', 'da10001a-0000-0000-0000-000000000001', 2, 2150.00, 1510.00, 0, 4300.00),
('bb10001b-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa10001b-0000-0000-0000-000000000001', 'da10001b-0000-0000-0000-000000000001', 2, 2200.00, 1545.00, 0, 4400.00),
('bb10001c-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa10001c-0000-0000-0000-000000000001', 'da10001c-0000-0000-0000-000000000001', 2, 2250.00, 1580.00, 0, 4500.00),
('bb10001d-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa10001d-0000-0000-0000-000000000001', 'da10001d-0000-0000-0000-000000000001', 2, 2300.00, 1615.00, 0, 4600.00),
('bb10001e-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa10001e-0000-0000-0000-000000000001', 'da10001e-0000-0000-0000-000000000001', 2, 2350.00, 1650.00, 0, 4700.00),
('bb10001f-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa10001f-0000-0000-0000-000000000001', 'da100001-0000-0000-0000-000000000001', 2, 2400.00, 1685.00, 0, 4800.00),
('bb100020-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100020-0000-0000-0000-000000000001', 'da100002-0000-0000-0000-000000000001', 2, 2450.00, 1720.00, 0, 4900.00),
('bb100021-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100021-0000-0000-0000-000000000001', 'da100003-0000-0000-0000-000000000001', 2, 2500.00, 1755.00, 0, 5000.00),
('bb100022-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100022-0000-0000-0000-000000000001', 'da100004-0000-0000-0000-000000000001', 2, 2550.00, 1790.00, 0, 5100.00),
('bb100023-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100023-0000-0000-0000-000000000001', 'da100005-0000-0000-0000-000000000001', 2, 2600.00, 1825.00, 0, 5200.00),
('bb100024-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100024-0000-0000-0000-000000000001', 'da100006-0000-0000-0000-000000000001', 2, 2650.00, 1860.00, 0, 5300.00),
('bb100025-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100025-0000-0000-0000-000000000001', 'da100007-0000-0000-0000-000000000001', 2, 2700.00, 1895.00, 0, 5400.00),
('bb100026-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100026-0000-0000-0000-000000000001', 'da100008-0000-0000-0000-000000000001', 2, 2750.00, 1930.00, 0, 5500.00),
('bb100027-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100027-0000-0000-0000-000000000001', 'da100009-0000-0000-0000-000000000001', 2, 2800.00, 1965.00, 0, 5600.00),
('bb100028-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100028-0000-0000-0000-000000000001', 'da10000a-0000-0000-0000-000000000001', 2, 2850.00, 2000.00, 0, 5700.00)
ON CONFLICT (id) DO NOTHING;

-- 10. INVOICES FOR B1 (15 Invoices)
INSERT INTO invoices (id, business_id, order_id, customer_id, invoice_number, issue_date, due_date, subtotal, discount_amount, tax_amount, total_amount, paid_amount, balance_amount, status, notes) VALUES
('ba100001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100001-0000-0000-0000-000000000001', 'cc100001-0000-0000-0000-000000000001', 'HA-INV-10101', CURRENT_DATE - INTERVAL '1 days', CURRENT_DATE + INTERVAL '13 days', 4800.00, 0, 0, 4800.00, 4800.00, 0, 'paid', 'Official VAT Receipt 1'),
('ba100002-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100002-0000-0000-0000-000000000001', 'cc100002-0000-0000-0000-000000000001', 'HA-INV-10102', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '12 days', 5400.00, 0, 0, 5400.00, 5400.00, 0, 'paid', 'Official VAT Receipt 2'),
('ba100003-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100003-0000-0000-0000-000000000001', 'cc100003-0000-0000-0000-000000000001', 'HA-INV-10103', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '11 days', 6000.00, 0, 0, 6000.00, 6000.00, 0, 'paid', 'Official VAT Receipt 3'),
('ba100004-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100004-0000-0000-0000-000000000001', 'cc100004-0000-0000-0000-000000000001', 'HA-INV-10104', CURRENT_DATE - INTERVAL '4 days', CURRENT_DATE + INTERVAL '10 days', 6600.00, 0, 0, 6600.00, 6600.00, 0, 'paid', 'Official VAT Receipt 4'),
('ba100005-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100005-0000-0000-0000-000000000001', 'cc100005-0000-0000-0000-000000000001', 'HA-INV-10105', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '9 days', 7200.00, 0, 0, 7200.00, 7200.00, 0, 'paid', 'Official VAT Receipt 5'),
('ba100006-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100006-0000-0000-0000-000000000001', 'cc100006-0000-0000-0000-000000000001', 'HA-INV-10106', CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE + INTERVAL '8 days', 7800.00, 0, 0, 7800.00, 7800.00, 0, 'paid', 'Official VAT Receipt 6'),
('ba100007-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100007-0000-0000-0000-000000000001', 'cc100007-0000-0000-0000-000000000001', 'HA-INV-10107', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE + INTERVAL '7 days', 8400.00, 0, 0, 8400.00, 8400.00, 0, 'paid', 'Official VAT Receipt 7'),
('ba100008-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100008-0000-0000-0000-000000000001', 'cc100008-0000-0000-0000-000000000001', 'HA-INV-10108', CURRENT_DATE - INTERVAL '8 days', CURRENT_DATE + INTERVAL '6 days', 9000.00, 0, 0, 9000.00, 9000.00, 0, 'paid', 'Official VAT Receipt 8'),
('ba100009-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa100009-0000-0000-0000-000000000001', 'cc100009-0000-0000-0000-000000000001', 'HA-INV-10109', CURRENT_DATE - INTERVAL '9 days', CURRENT_DATE + INTERVAL '5 days', 9600.00, 0, 0, 9600.00, 9600.00, 0, 'paid', 'Official VAT Receipt 9'),
('ba10000a-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa10000a-0000-0000-0000-000000000001', 'cc10000a-0000-0000-0000-000000000001', 'HA-INV-10110', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '4 days', 10200.00, 0, 0, 10200.00, 10200.00, 0, 'paid', 'Official VAT Receipt 10'),
('ba10000b-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa10000b-0000-0000-0000-000000000001', 'cc10000b-0000-0000-0000-000000000001', 'HA-INV-10111', CURRENT_DATE - INTERVAL '11 days', CURRENT_DATE + INTERVAL '3 days', 10800.00, 0, 0, 10800.00, 10800.00, 0, 'paid', 'Official VAT Receipt 11'),
('ba10000c-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa10000c-0000-0000-0000-000000000001', 'cc10000c-0000-0000-0000-000000000001', 'HA-INV-10112', CURRENT_DATE - INTERVAL '12 days', CURRENT_DATE + INTERVAL '2 days', 11400.00, 0, 0, 11400.00, 11400.00, 0, 'paid', 'Official VAT Receipt 12'),
('ba10000d-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa10000d-0000-0000-0000-000000000001', 'cc10000d-0000-0000-0000-000000000001', 'HA-INV-10113', CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE + INTERVAL '1 days', 12000.00, 0, 0, 12000.00, 12000.00, 0, 'paid', 'Official VAT Receipt 13'),
('ba10000e-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa10000e-0000-0000-0000-000000000001', 'cc10000e-0000-0000-0000-000000000001', 'HA-INV-10114', CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE + INTERVAL '0 days', 12600.00, 0, 0, 12600.00, 12600.00, 0, 'paid', 'Official VAT Receipt 14'),
('ba10000f-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'aa10000f-0000-0000-0000-000000000001', 'cc10000f-0000-0000-0000-000000000001', 'HA-INV-10115', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '-1 days', 13200.00, 0, 0, 13200.00, 13200.00, 0, 'paid', 'Official VAT Receipt 15')
ON CONFLICT (business_id, invoice_number) DO NOTHING;


-- ============================================================
-- WORKSPACE B2: DEMO_BASIC_02 - Apex Express Kandy (Kandy)
-- ============================================================

-- 1. CATEGORIES FOR B2
INSERT INTO categories (id, business_id, name, slug, description, image_url) VALUES
('ca200001-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Beverages & Refreshments', 'cat-b2-1', 'Beverages & Refreshments for Kandy branch', '/demo-assets/categories/cat-1.webp'),
('ca200002-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Rice, Grains & Pulses', 'cat-b2-2', 'Rice, Grains & Pulses for Kandy branch', '/demo-assets/categories/cat-2.webp'),
('ca200003-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Spices, Herbs & Seasoning', 'cat-b2-3', 'Spices, Herbs & Seasoning for Kandy branch', '/demo-assets/categories/cat-3.webp'),
('ca200004-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Bakery & Confectionery', 'cat-b2-4', 'Bakery & Confectionery for Kandy branch', '/demo-assets/categories/cat-4.webp'),
('ca200005-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Dairy, Eggs & Butter', 'cat-b2-5', 'Dairy, Eggs & Butter for Kandy branch', '/demo-assets/categories/cat-5.webp'),
('ca200006-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Snacks & Crisps', 'cat-b2-6', 'Snacks & Crisps for Kandy branch', '/demo-assets/categories/cat-6.webp'),
('ca200007-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Household Cleaning & Laundry', 'cat-b2-7', 'Household Cleaning & Laundry for Kandy branch', '/demo-assets/categories/cat-7.webp'),
('ca200008-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Personal Care & Toiletries', 'cat-b2-8', 'Personal Care & Toiletries for Kandy branch', '/demo-assets/categories/cat-8.webp'),
('ca200009-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Stationery & Office Supplies', 'cat-b2-9', 'Stationery & Office Supplies for Kandy branch', '/demo-assets/categories/cat-9.webp'),
('ca20000a-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Fresh Produce & Essentials', 'cat-b2-10', 'Fresh Produce & Essentials for Kandy branch', '/demo-assets/categories/cat-10.webp')
ON CONFLICT (business_id, slug) DO NOTHING;

-- 2. PRODUCTS FOR B2 (30 Products)
INSERT INTO products (id, business_id, category_id, name, sku, barcode, description, cost_price, selling_price, stock_quantity, min_stock_level, image_url, status) VALUES
('da200001-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ca200001-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B2 #1', 'SKU-B2-001', '79357200001', 'Commercial Grade Item 1 for DEMO_BASIC_02 - Apex Express Kandy', 295.00, 400.00, 22, 8, '/demo-assets/products/prod-2.webp', 'active'),
('da200002-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ca200002-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B2 #2', 'SKU-B2-002', '79357200002', 'Commercial Grade Item 2 for DEMO_BASIC_02 - Apex Express Kandy', 340.00, 460.00, 29, 8, '/demo-assets/products/prod-3.webp', 'active'),
('da200003-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ca200003-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B2 #3', 'SKU-B2-003', '79357200003', 'Commercial Grade Item 3 for DEMO_BASIC_02 - Apex Express Kandy', 385.00, 520.00, 36, 8, '/demo-assets/products/prod-4.webp', 'active'),
('da200004-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ca200004-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B2 #4', 'SKU-B2-004', '79357200004', 'Commercial Grade Item 4 for DEMO_BASIC_02 - Apex Express Kandy', 430.00, 580.00, 43, 8, '/demo-assets/products/prod-5.webp', 'active'),
('da200005-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ca200005-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B2 #5', 'SKU-B2-005', '79357200005', 'Commercial Grade Item 5 for DEMO_BASIC_02 - Apex Express Kandy', 475.00, 640.00, 50, 8, '/demo-assets/products/prod-6.webp', 'active'),
('da200006-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ca200006-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B2 #6', 'SKU-B2-006', '79357200006', 'Commercial Grade Item 6 for DEMO_BASIC_02 - Apex Express Kandy', 520.00, 700.00, 57, 8, '/demo-assets/products/prod-7.webp', 'active'),
('da200007-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ca200007-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B2 #7', 'SKU-B2-007', '79357200007', 'Commercial Grade Item 7 for DEMO_BASIC_02 - Apex Express Kandy', 565.00, 760.00, 64, 8, '/demo-assets/products/prod-8.webp', 'active'),
('da200008-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ca200008-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B2 #8', 'SKU-B2-008', '79357200008', 'Commercial Grade Item 8 for DEMO_BASIC_02 - Apex Express Kandy', 610.00, 820.00, 71, 8, '/demo-assets/products/prod-9.webp', 'active'),
('da200009-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ca200009-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B2 #9', 'SKU-B2-009', '79357200009', 'Commercial Grade Item 9 for DEMO_BASIC_02 - Apex Express Kandy', 655.00, 880.00, 78, 8, '/demo-assets/products/prod-10.webp', 'active'),
('da20000a-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ca20000a-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B2 #10', 'SKU-B2-010', '79357200010', 'Commercial Grade Item 10 for DEMO_BASIC_02 - Apex Express Kandy', 700.00, 950.00, 20, 8, '/demo-assets/products/prod-1.webp', 'active'),
('da20000b-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ca200001-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B2 #11', 'SKU-B2-011', '79357200011', 'Commercial Grade Item 11 for DEMO_BASIC_02 - Apex Express Kandy', 745.00, 1010.00, 27, 8, '/demo-assets/products/prod-2.webp', 'active'),
('da20000c-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ca200002-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B2 #12', 'SKU-B2-012', '79357200012', 'Commercial Grade Item 12 for DEMO_BASIC_02 - Apex Express Kandy', 790.00, 1070.00, 34, 8, '/demo-assets/products/prod-3.webp', 'active'),
('da20000d-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ca200003-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B2 #13', 'SKU-B2-013', '79357200013', 'Commercial Grade Item 13 for DEMO_BASIC_02 - Apex Express Kandy', 835.00, 1130.00, 41, 8, '/demo-assets/products/prod-4.webp', 'active'),
('da20000e-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ca200004-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B2 #14', 'SKU-B2-014', '79357200014', 'Commercial Grade Item 14 for DEMO_BASIC_02 - Apex Express Kandy', 880.00, 1190.00, 48, 8, '/demo-assets/products/prod-5.webp', 'active'),
('da20000f-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ca200005-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B2 #15', 'SKU-B2-015', '79357200015', 'Commercial Grade Item 15 for DEMO_BASIC_02 - Apex Express Kandy', 925.00, 1250.00, 55, 8, '/demo-assets/products/prod-6.webp', 'active'),
('da200010-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ca200006-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B2 #16', 'SKU-B2-016', '79357200016', 'Commercial Grade Item 16 for DEMO_BASIC_02 - Apex Express Kandy', 970.00, 1310.00, 62, 8, '/demo-assets/products/prod-7.webp', 'active'),
('da200011-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ca200007-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B2 #17', 'SKU-B2-017', '79357200017', 'Commercial Grade Item 17 for DEMO_BASIC_02 - Apex Express Kandy', 1015.00, 1370.00, 69, 8, '/demo-assets/products/prod-8.webp', 'active'),
('da200012-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ca200008-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B2 #18', 'SKU-B2-018', '79357200018', 'Commercial Grade Item 18 for DEMO_BASIC_02 - Apex Express Kandy', 1060.00, 1430.00, 76, 8, '/demo-assets/products/prod-9.webp', 'active'),
('da200013-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ca200009-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B2 #19', 'SKU-B2-019', '79357200019', 'Commercial Grade Item 19 for DEMO_BASIC_02 - Apex Express Kandy', 1105.00, 1490.00, 18, 8, '/demo-assets/products/prod-10.webp', 'active'),
('da200014-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ca20000a-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B2 #20', 'SKU-B2-020', '79357200020', 'Commercial Grade Item 20 for DEMO_BASIC_02 - Apex Express Kandy', 1150.00, 1550.00, 25, 8, '/demo-assets/products/prod-1.webp', 'active'),
('da200015-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ca200001-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B2 #21', 'SKU-B2-021', '79357200021', 'Commercial Grade Item 21 for DEMO_BASIC_02 - Apex Express Kandy', 1195.00, 1610.00, 32, 8, '/demo-assets/products/prod-2.webp', 'active'),
('da200016-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ca200002-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B2 #22', 'SKU-B2-022', '79357200022', 'Commercial Grade Item 22 for DEMO_BASIC_02 - Apex Express Kandy', 1240.00, 1670.00, 39, 8, '/demo-assets/products/prod-3.webp', 'active'),
('da200017-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ca200003-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B2 #23', 'SKU-B2-023', '79357200023', 'Commercial Grade Item 23 for DEMO_BASIC_02 - Apex Express Kandy', 1285.00, 1730.00, 46, 8, '/demo-assets/products/prod-4.webp', 'active'),
('da200018-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ca200004-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B2 #24', 'SKU-B2-024', '79357200024', 'Commercial Grade Item 24 for DEMO_BASIC_02 - Apex Express Kandy', 1330.00, 1800.00, 53, 8, '/demo-assets/products/prod-5.webp', 'active'),
('da200019-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ca200005-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B2 #25', 'SKU-B2-025', '79357200025', 'Commercial Grade Item 25 for DEMO_BASIC_02 - Apex Express Kandy', 1375.00, 1860.00, 60, 8, '/demo-assets/products/prod-6.webp', 'active'),
('da20001a-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ca200006-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B2 #26', 'SKU-B2-026', '79357200026', 'Commercial Grade Item 26 for DEMO_BASIC_02 - Apex Express Kandy', 1420.00, 1920.00, 67, 8, '/demo-assets/products/prod-7.webp', 'active'),
('da20001b-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ca200007-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B2 #27', 'SKU-B2-027', '79357200027', 'Commercial Grade Item 27 for DEMO_BASIC_02 - Apex Express Kandy', 1465.00, 1980.00, 74, 8, '/demo-assets/products/prod-8.webp', 'active'),
('da20001c-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ca200008-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B2 #28', 'SKU-B2-028', '79357200028', 'Commercial Grade Item 28 for DEMO_BASIC_02 - Apex Express Kandy', 1510.00, 2040.00, 16, 8, '/demo-assets/products/prod-9.webp', 'active'),
('da20001d-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ca200009-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B2 #29', 'SKU-B2-029', '79357200029', 'Commercial Grade Item 29 for DEMO_BASIC_02 - Apex Express Kandy', 1555.00, 2100.00, 23, 8, '/demo-assets/products/prod-10.webp', 'active'),
('da20001e-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ca20000a-0000-0000-0000-000000000001', 'Sri Lanka Quality Product B2 #30', 'SKU-B2-030', '79357200030', 'Commercial Grade Item 30 for DEMO_BASIC_02 - Apex Express Kandy', 1600.00, 2160.00, 30, 8, '/demo-assets/products/prod-1.webp', 'active')
ON CONFLICT (business_id, sku) DO NOTHING;

-- 3. INVENTORY FOR B2
INSERT INTO inventory (business_id, product_id, quantity, reserved_quantity, location)
SELECT business_id, id, stock_quantity, 0, 'Kandy Main Store'
FROM products WHERE business_id = 'a2000000-0000-0000-0000-000000000002'
ON CONFLICT (business_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- 4. CUSTOMERS FOR B2 (20 Customers)
INSERT INTO customers (id, business_id, name, phone, email, address, total_purchases, total_orders, outstanding_balance, last_purchase_at) VALUES
('cc200001-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Sunil Jayawardena', '+94 77 234 5678', 'sunil.j.b2@gmail.com', '142 Havelock Road, Kandy', 14400.00, 4, 0.00, NOW() - INTERVAL '1 days'),
('cc200002-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Kumari Alwis', '+94 71 876 5432', 'kumari.alwis.b2@gmail.com', '56 Rajagiriya Road, Kandy', 16800.00, 5, 0.00, NOW() - INTERVAL '2 days'),
('cc200003-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Mohamed Rizwan', '+94 76 543 2198', 'm.rizwan.trading.b2@gmail.com', '88 Keyzer Street, Pettah, Kandy', 19200.00, 6, 0.00, NOW() - INTERVAL '3 days'),
('cc200004-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Priyantha Gunasekara', '+94 77 654 3210', 'priyantha.guna.b2@gmail.com', '23 Temple Road, Nugegoda, Kandy', 21600.00, 7, 0.00, NOW() - INTERVAL '4 days'),
('cc200005-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Chamari Dissanayake', '+94 72 345 6789', 'chamari.d.b2@gmail.com', '77 Stanley Tillakaratne Mawatha, Kandy', 24000.00, 8, 3750.00, NOW() - INTERVAL '5 days'),
('cc200006-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Siva Subramaniam', '+94 77 889 9001', 'siva.subra.b2@gmail.com', '12 Sea Street, Kandy', 26400.00, 9, 0.00, NOW() - INTERVAL '6 days'),
('cc200007-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Anushka Bandara', '+94 75 112 2334', 'anushka.b.b2@gmail.com', '98 High Level Road, Maharagama, Kandy', 28800.00, 10, 0.00, NOW() - INTERVAL '7 days'),
('cc200008-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Malik Mansoor', '+94 77 998 8776', 'malik.mansoor.b2@gmail.com', '34 Wekande Road, Kandy', 31200.00, 11, 0.00, NOW() - INTERVAL '8 days'),
('cc200009-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Kavindi Senaratne', '+94 71 445 5667', 'kavindi.sena.b2@gmail.com', '5 Anderson Road, Dehiwala, Kandy', 33600.00, 12, 0.00, NOW() - INTERVAL '9 days'),
('cc20000a-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Dinesh Samarawickrama', '+94 70 334 4556', 'dinesh.sam.b2@gmail.com', '19 Galle Road, Mount Lavinia, Kandy', 36000.00, 13, 7500.00, NOW() - INTERVAL '10 days'),
('cc20000b-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Shalini Weerasinghe', '+94 77 667 7889', 'shalini.w.b2@gmail.com', '40 Duplication Road, Kandy', 38400.00, 14, 0.00, NOW() - INTERVAL '11 days'),
('cc20000c-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Ruwan Edirisinghe', '+94 76 778 8990', 'ruwan.ediri.b2@gmail.com', '62 Baseline Road, Dematagoda, Kandy', 40800.00, 15, 0.00, NOW() - INTERVAL '12 days'),
('cc20000d-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Thilini Fonseka', '+94 71 223 3445', 'thilini.fonseka.b2@gmail.com', '110 Hospital Road, Kalubowila, Kandy', 43200.00, 16, 0.00, NOW() - INTERVAL '13 days'),
('cc20000e-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Asanka Karunaratne', '+94 78 556 6778', 'asanka.k.b2@gmail.com', '85 Sri Saranankara Road, Kandy', 45600.00, 17, 0.00, NOW() - INTERVAL '14 days'),
('cc20000f-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Fathima Zeenath', '+94 77 443 3221', 'zeenath.fathima.b2@gmail.com', '27 Maligawatta Place, Kandy', 48000.00, 3, 11250.00, NOW() - INTERVAL '15 days'),
('cc200010-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Pradeep Kumara', '+94 70 889 9002', 'pradeep.kumara.b2@gmail.com', '14 Negombo Road, Peliyagoda, Kandy', 50400.00, 4, 0.00, NOW() - INTERVAL '16 days'),
('cc200011-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Hiruni Rathnayake', '+94 77 119 9228', 'hiruni.rathna.b2@gmail.com', '73 Nawala Road, Kandy', 52800.00, 5, 0.00, NOW() - INTERVAL '17 days'),
('cc200012-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Mahesh Wickramasinghe', '+94 76 123 9876', 'mahesh.wick.b2@gmail.com', '29 Jubilee Post, Mirihana, Kandy', 55200.00, 6, 0.00, NOW() - INTERVAL '18 days'),
('cc200013-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Nimanthi Abeysekera', '+94 71 990 0112', 'nimanthi.a.b2@gmail.com', '91 Pagoda Road, Nugegoda, Kandy', 57600.00, 7, 0.00, NOW() - INTERVAL '19 days'),
('cc200014-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Roshan Liyanage', '+94 77 554 4332', 'roshan.liya.b2@gmail.com', '52 Old Kesbewa Road, Kandy', 60000.00, 8, 15000.00, NOW() - INTERVAL '20 days')
ON CONFLICT (id) DO NOTHING;

-- 5. EMPLOYEES FOR B2 (6 Employees)
INSERT INTO employees (id, business_id, employee_id_number, name, email, phone, position, department, salary, join_date, status, avatar_url) VALUES
('ee200001-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'EMP-001-B2', 'Kasun Perera', 'kasun.perera.b2@harshapex.lk', '+94 77 111 4512', 'Owner & General Director', 'Executive', 220000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-1.webp'),
('ee200002-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'EMP-002-B2', 'Buddhika Senanayake', 'buddhika.senanayake.b2@harshapex.lk', '+94 77 112 4522', 'Operations General Manager', 'Operations', 140000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-2.webp'),
('ee200003-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'EMP-003-B2', 'Sanduni Wijeratne', 'sanduni.wijeratne.b2@harshapex.lk', '+94 77 113 4532', 'Head of Sales & Billing', 'Sales', 85000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-3.webp'),
('ee200004-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'EMP-004-B2', 'Nuwan Jayalath', 'nuwan.jayalath.b2@harshapex.lk', '+94 77 114 4542', 'Inventory & Logistics Lead', 'Logistics', 90000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-4.webp'),
('ee200005-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'EMP-005-B2', 'Kavinda Maduranga', 'kavinda.maduranga.b2@harshapex.lk', '+94 77 115 4552', 'Senior Counter Cashier', 'Sales', 65000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-5.webp'),
('ee200006-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'EMP-006-B2', 'Dharshani Mendis', 'dharshani.mendis.b2@harshapex.lk', '+94 77 116 4562', 'Financial Analyst & Accounts', 'Finance', 105000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-6.webp')
ON CONFLICT (business_id, employee_id_number) DO NOTHING;

-- 6. EXPENSE CATEGORIES FOR B2
INSERT INTO expense_categories (id, business_id, name, description) VALUES
('ec200001-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Store & Office Rent', 'Monthly commercial premises lease'),
('ec200002-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Electricity & Water Utilities', 'CEB & commercial utilities'),
('ec200003-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Staff Salaries & Overtime', 'Monthly payroll disbursements'),
('ec200004-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Logistics, Delivery & Fuel', 'Fleet fuel and transport charges'),
('ec200005-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Equipment & IT Maintenance', 'Hardware, thermal rolls, and network maintenance'),
('ec200006-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Marketing & Customer Loyalty', 'Promotional campaigns and SMS alerts'),
('ec200007-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Security & Municipal Taxes', 'Premises security and local council rates'),
('ec200008-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Packaging & Consumables', 'Eco bags, boxes, and parcel wrap'),
('ec200009-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Accounting & Professional Fees', 'Auditing, secretarial and legal retainer'),
('ec20000a-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'Miscellaneous Operational Contingency', 'Store daily operational petty expenses')
ON CONFLICT (business_id, name) DO NOTHING;

-- 7. EXPENSES FOR B2 (10 Expenses)
INSERT INTO expenses (id, business_id, category_id, expense_number, expense_date, description, amount, payment_method, notes) VALUES
('ea200001-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ec200001-0000-0000-0000-000000000001', 'EXP-B2-2026-001', CURRENT_DATE - INTERVAL '2 days', 'Store & Office Rent - Kandy', 11700.00, 'card', 'Disbursed for Kandy branch operational expenses'),
('ea200002-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ec200002-0000-0000-0000-000000000001', 'EXP-B2-2026-002', CURRENT_DATE - INTERVAL '4 days', 'Electricity & Water Utilities - Kandy', 14900.00, 'bank_transfer', 'Disbursed for Kandy branch operational expenses'),
('ea200003-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ec200003-0000-0000-0000-000000000001', 'EXP-B2-2026-003', CURRENT_DATE - INTERVAL '6 days', 'Staff Salaries & Overtime - Kandy', 18100.00, 'cash', 'Disbursed for Kandy branch operational expenses'),
('ea200004-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ec200004-0000-0000-0000-000000000001', 'EXP-B2-2026-004', CURRENT_DATE - INTERVAL '8 days', 'Logistics, Delivery & Fuel - Kandy', 21300.00, 'card', 'Disbursed for Kandy branch operational expenses'),
('ea200005-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ec200005-0000-0000-0000-000000000001', 'EXP-B2-2026-005', CURRENT_DATE - INTERVAL '10 days', 'Equipment & IT Maintenance - Kandy', 24500.00, 'bank_transfer', 'Disbursed for Kandy branch operational expenses'),
('ea200006-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ec200006-0000-0000-0000-000000000001', 'EXP-B2-2026-006', CURRENT_DATE - INTERVAL '12 days', 'Marketing & Customer Loyalty - Kandy', 27700.00, 'cash', 'Disbursed for Kandy branch operational expenses'),
('ea200007-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ec200007-0000-0000-0000-000000000001', 'EXP-B2-2026-007', CURRENT_DATE - INTERVAL '14 days', 'Security & Municipal Taxes - Kandy', 30900.00, 'card', 'Disbursed for Kandy branch operational expenses'),
('ea200008-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ec200008-0000-0000-0000-000000000001', 'EXP-B2-2026-008', CURRENT_DATE - INTERVAL '16 days', 'Packaging & Consumables - Kandy', 34100.00, 'bank_transfer', 'Disbursed for Kandy branch operational expenses'),
('ea200009-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ec200009-0000-0000-0000-000000000001', 'EXP-B2-2026-009', CURRENT_DATE - INTERVAL '18 days', 'Accounting & Professional Fees - Kandy', 37300.00, 'cash', 'Disbursed for Kandy branch operational expenses'),
('ea20000a-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ec20000a-0000-0000-0000-000000000001', 'EXP-B2-2026-010', CURRENT_DATE - INTERVAL '20 days', 'Miscellaneous Operational Contingency - Kandy', 40500.00, 'card', 'Disbursed for Kandy branch operational expenses')
ON CONFLICT (business_id, expense_number) DO NOTHING;

-- 8. ORDERS FOR B2 (40 Orders)
INSERT INTO orders (id, business_id, order_number, customer_id, status, payment_status, payment_method, subtotal, discount_amount, tax_amount, total_amount, notes, created_at) VALUES
('aa200001-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1001', 'cc200001-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 2850.00, 0.00, 0, 2850.00, 'Order 1 processed in Kandy', NOW() - INTERVAL '4 hours'),
('aa200002-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1002', 'cc200002-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 3200.00, 0.00, 0, 3200.00, 'Order 2 processed in Kandy', NOW() - INTERVAL '8 hours'),
('aa200003-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1003', 'cc200003-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 3550.00, 0.00, 0, 3550.00, 'Order 3 processed in Kandy', NOW() - INTERVAL '12 hours'),
('aa200004-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1004', 'cc200004-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 3900.00, 200.00, 0, 3700.00, 'Order 4 processed in Kandy', NOW() - INTERVAL '16 hours'),
('aa200005-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1005', 'cc200005-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 4250.00, 0.00, 0, 4250.00, 'Order 5 processed in Kandy', NOW() - INTERVAL '20 hours'),
('aa200006-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1006', 'cc200006-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 4600.00, 0.00, 0, 4600.00, 'Order 6 processed in Kandy', NOW() - INTERVAL '24 hours'),
('aa200007-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1007', 'cc200007-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 4950.00, 0.00, 0, 4950.00, 'Order 7 processed in Kandy', NOW() - INTERVAL '28 hours'),
('aa200008-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1008', 'cc200008-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 5300.00, 200.00, 0, 5100.00, 'Order 8 processed in Kandy', NOW() - INTERVAL '32 hours'),
('aa200009-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1009', 'cc200009-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 5650.00, 0.00, 0, 5650.00, 'Order 9 processed in Kandy', NOW() - INTERVAL '36 hours'),
('aa20000a-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1010', 'cc20000a-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 6000.00, 0.00, 0, 6000.00, 'Order 10 processed in Kandy', NOW() - INTERVAL '40 hours'),
('aa20000b-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1011', 'cc20000b-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 6350.00, 0.00, 0, 6350.00, 'Order 11 processed in Kandy', NOW() - INTERVAL '44 hours'),
('aa20000c-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1012', 'cc20000c-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 6700.00, 200.00, 0, 6500.00, 'Order 12 processed in Kandy', NOW() - INTERVAL '48 hours'),
('aa20000d-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1013', 'cc20000d-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 7050.00, 0.00, 0, 7050.00, 'Order 13 processed in Kandy', NOW() - INTERVAL '52 hours'),
('aa20000e-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1014', 'cc20000e-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 7400.00, 0.00, 0, 7400.00, 'Order 14 processed in Kandy', NOW() - INTERVAL '56 hours'),
('aa20000f-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1015', 'cc20000f-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 7750.00, 0.00, 0, 7750.00, 'Order 15 processed in Kandy', NOW() - INTERVAL '60 hours'),
('aa200010-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1016', 'cc200010-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 8100.00, 200.00, 0, 7900.00, 'Order 16 processed in Kandy', NOW() - INTERVAL '64 hours'),
('aa200011-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1017', 'cc200011-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 8450.00, 0.00, 0, 8450.00, 'Order 17 processed in Kandy', NOW() - INTERVAL '68 hours'),
('aa200012-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1018', 'cc200012-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 8800.00, 0.00, 0, 8800.00, 'Order 18 processed in Kandy', NOW() - INTERVAL '72 hours'),
('aa200013-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1019', 'cc200013-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 9150.00, 0.00, 0, 9150.00, 'Order 19 processed in Kandy', NOW() - INTERVAL '76 hours'),
('aa200014-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1020', 'cc200014-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 9500.00, 200.00, 0, 9300.00, 'Order 20 processed in Kandy', NOW() - INTERVAL '80 hours'),
('aa200015-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1021', 'cc200001-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 9850.00, 0.00, 0, 9850.00, 'Order 21 processed in Kandy', NOW() - INTERVAL '84 hours'),
('aa200016-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1022', 'cc200002-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 10200.00, 0.00, 0, 10200.00, 'Order 22 processed in Kandy', NOW() - INTERVAL '88 hours'),
('aa200017-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1023', 'cc200003-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 10550.00, 0.00, 0, 10550.00, 'Order 23 processed in Kandy', NOW() - INTERVAL '92 hours'),
('aa200018-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1024', 'cc200004-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 10900.00, 200.00, 0, 10700.00, 'Order 24 processed in Kandy', NOW() - INTERVAL '96 hours'),
('aa200019-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1025', 'cc200005-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 11250.00, 0.00, 0, 11250.00, 'Order 25 processed in Kandy', NOW() - INTERVAL '100 hours'),
('aa20001a-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1026', 'cc200006-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 11600.00, 0.00, 0, 11600.00, 'Order 26 processed in Kandy', NOW() - INTERVAL '104 hours'),
('aa20001b-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1027', 'cc200007-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 11950.00, 0.00, 0, 11950.00, 'Order 27 processed in Kandy', NOW() - INTERVAL '108 hours'),
('aa20001c-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1028', 'cc200008-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 12300.00, 200.00, 0, 12100.00, 'Order 28 processed in Kandy', NOW() - INTERVAL '112 hours'),
('aa20001d-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1029', 'cc200009-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 12650.00, 0.00, 0, 12650.00, 'Order 29 processed in Kandy', NOW() - INTERVAL '116 hours'),
('aa20001e-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1030', 'cc20000a-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 13000.00, 0.00, 0, 13000.00, 'Order 30 processed in Kandy', NOW() - INTERVAL '120 hours'),
('aa20001f-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1031', 'cc20000b-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 13350.00, 0.00, 0, 13350.00, 'Order 31 processed in Kandy', NOW() - INTERVAL '124 hours'),
('aa200020-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1032', 'cc20000c-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 13700.00, 200.00, 0, 13500.00, 'Order 32 processed in Kandy', NOW() - INTERVAL '128 hours'),
('aa200021-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1033', 'cc20000d-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 14050.00, 0.00, 0, 14050.00, 'Order 33 processed in Kandy', NOW() - INTERVAL '132 hours'),
('aa200022-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1034', 'cc20000e-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 14400.00, 0.00, 0, 14400.00, 'Order 34 processed in Kandy', NOW() - INTERVAL '136 hours'),
('aa200023-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1035', 'cc20000f-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 14750.00, 0.00, 0, 14750.00, 'Order 35 processed in Kandy', NOW() - INTERVAL '140 hours'),
('aa200024-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1036', 'cc200010-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 15100.00, 200.00, 0, 14900.00, 'Order 36 processed in Kandy', NOW() - INTERVAL '144 hours'),
('aa200025-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1037', 'cc200011-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 15450.00, 0.00, 0, 15450.00, 'Order 37 processed in Kandy', NOW() - INTERVAL '148 hours'),
('aa200026-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1038', 'cc200012-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 15800.00, 0.00, 0, 15800.00, 'Order 38 processed in Kandy', NOW() - INTERVAL '152 hours'),
('aa200027-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1039', 'cc200013-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 16150.00, 0.00, 0, 16150.00, 'Order 39 processed in Kandy', NOW() - INTERVAL '156 hours'),
('aa200028-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'ORD-B2-1040', 'cc200014-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 16500.00, 200.00, 0, 16300.00, 'Order 40 processed in Kandy', NOW() - INTERVAL '160 hours')
ON CONFLICT (business_id, order_number) DO NOTHING;

-- 9. ORDER ITEMS FOR B2
INSERT INTO order_items (id, business_id, order_id, product_id, quantity, unit_price, cost_price, discount_amount, total_price) VALUES
('bb200001-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200001-0000-0000-0000-000000000001', 'da200001-0000-0000-0000-000000000001', 2, 900.00, 635.00, 0, 1800.00),
('bb200002-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200002-0000-0000-0000-000000000001', 'da200002-0000-0000-0000-000000000001', 2, 950.00, 670.00, 0, 1900.00),
('bb200003-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200003-0000-0000-0000-000000000001', 'da200003-0000-0000-0000-000000000001', 2, 1000.00, 705.00, 0, 2000.00),
('bb200004-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200004-0000-0000-0000-000000000001', 'da200004-0000-0000-0000-000000000001', 2, 1050.00, 740.00, 0, 2100.00),
('bb200005-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200005-0000-0000-0000-000000000001', 'da200005-0000-0000-0000-000000000001', 2, 1100.00, 775.00, 0, 2200.00),
('bb200006-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200006-0000-0000-0000-000000000001', 'da200006-0000-0000-0000-000000000001', 2, 1150.00, 810.00, 0, 2300.00),
('bb200007-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200007-0000-0000-0000-000000000001', 'da200007-0000-0000-0000-000000000001', 2, 1200.00, 845.00, 0, 2400.00),
('bb200008-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200008-0000-0000-0000-000000000001', 'da200008-0000-0000-0000-000000000001', 2, 1250.00, 880.00, 0, 2500.00),
('bb200009-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200009-0000-0000-0000-000000000001', 'da200009-0000-0000-0000-000000000001', 2, 1300.00, 915.00, 0, 2600.00),
('bb20000a-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa20000a-0000-0000-0000-000000000001', 'da20000a-0000-0000-0000-000000000001', 2, 1350.00, 950.00, 0, 2700.00),
('bb20000b-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa20000b-0000-0000-0000-000000000001', 'da20000b-0000-0000-0000-000000000001', 2, 1400.00, 985.00, 0, 2800.00),
('bb20000c-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa20000c-0000-0000-0000-000000000001', 'da20000c-0000-0000-0000-000000000001', 2, 1450.00, 1020.00, 0, 2900.00),
('bb20000d-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa20000d-0000-0000-0000-000000000001', 'da20000d-0000-0000-0000-000000000001', 2, 1500.00, 1055.00, 0, 3000.00),
('bb20000e-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa20000e-0000-0000-0000-000000000001', 'da20000e-0000-0000-0000-000000000001', 2, 1550.00, 1090.00, 0, 3100.00),
('bb20000f-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa20000f-0000-0000-0000-000000000001', 'da20000f-0000-0000-0000-000000000001', 2, 1600.00, 1125.00, 0, 3200.00),
('bb200010-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200010-0000-0000-0000-000000000001', 'da200010-0000-0000-0000-000000000001', 2, 1650.00, 1160.00, 0, 3300.00),
('bb200011-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200011-0000-0000-0000-000000000001', 'da200011-0000-0000-0000-000000000001', 2, 1700.00, 1195.00, 0, 3400.00),
('bb200012-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200012-0000-0000-0000-000000000001', 'da200012-0000-0000-0000-000000000001', 2, 1750.00, 1230.00, 0, 3500.00),
('bb200013-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200013-0000-0000-0000-000000000001', 'da200013-0000-0000-0000-000000000001', 2, 1800.00, 1265.00, 0, 3600.00),
('bb200014-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200014-0000-0000-0000-000000000001', 'da200014-0000-0000-0000-000000000001', 2, 1850.00, 1300.00, 0, 3700.00),
('bb200015-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200015-0000-0000-0000-000000000001', 'da200015-0000-0000-0000-000000000001', 2, 1900.00, 1335.00, 0, 3800.00),
('bb200016-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200016-0000-0000-0000-000000000001', 'da200016-0000-0000-0000-000000000001', 2, 1950.00, 1370.00, 0, 3900.00),
('bb200017-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200017-0000-0000-0000-000000000001', 'da200017-0000-0000-0000-000000000001', 2, 2000.00, 1405.00, 0, 4000.00),
('bb200018-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200018-0000-0000-0000-000000000001', 'da200018-0000-0000-0000-000000000001', 2, 2050.00, 1440.00, 0, 4100.00),
('bb200019-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200019-0000-0000-0000-000000000001', 'da200019-0000-0000-0000-000000000001', 2, 2100.00, 1475.00, 0, 4200.00),
('bb20001a-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa20001a-0000-0000-0000-000000000001', 'da20001a-0000-0000-0000-000000000001', 2, 2150.00, 1510.00, 0, 4300.00),
('bb20001b-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa20001b-0000-0000-0000-000000000001', 'da20001b-0000-0000-0000-000000000001', 2, 2200.00, 1545.00, 0, 4400.00),
('bb20001c-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa20001c-0000-0000-0000-000000000001', 'da20001c-0000-0000-0000-000000000001', 2, 2250.00, 1580.00, 0, 4500.00),
('bb20001d-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa20001d-0000-0000-0000-000000000001', 'da20001d-0000-0000-0000-000000000001', 2, 2300.00, 1615.00, 0, 4600.00),
('bb20001e-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa20001e-0000-0000-0000-000000000001', 'da20001e-0000-0000-0000-000000000001', 2, 2350.00, 1650.00, 0, 4700.00),
('bb20001f-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa20001f-0000-0000-0000-000000000001', 'da200001-0000-0000-0000-000000000001', 2, 2400.00, 1685.00, 0, 4800.00),
('bb200020-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200020-0000-0000-0000-000000000001', 'da200002-0000-0000-0000-000000000001', 2, 2450.00, 1720.00, 0, 4900.00),
('bb200021-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200021-0000-0000-0000-000000000001', 'da200003-0000-0000-0000-000000000001', 2, 2500.00, 1755.00, 0, 5000.00),
('bb200022-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200022-0000-0000-0000-000000000001', 'da200004-0000-0000-0000-000000000001', 2, 2550.00, 1790.00, 0, 5100.00),
('bb200023-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200023-0000-0000-0000-000000000001', 'da200005-0000-0000-0000-000000000001', 2, 2600.00, 1825.00, 0, 5200.00),
('bb200024-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200024-0000-0000-0000-000000000001', 'da200006-0000-0000-0000-000000000001', 2, 2650.00, 1860.00, 0, 5300.00),
('bb200025-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200025-0000-0000-0000-000000000001', 'da200007-0000-0000-0000-000000000001', 2, 2700.00, 1895.00, 0, 5400.00),
('bb200026-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200026-0000-0000-0000-000000000001', 'da200008-0000-0000-0000-000000000001', 2, 2750.00, 1930.00, 0, 5500.00),
('bb200027-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200027-0000-0000-0000-000000000001', 'da200009-0000-0000-0000-000000000001', 2, 2800.00, 1965.00, 0, 5600.00),
('bb200028-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200028-0000-0000-0000-000000000001', 'da20000a-0000-0000-0000-000000000001', 2, 2850.00, 2000.00, 0, 5700.00)
ON CONFLICT (id) DO NOTHING;

-- 10. INVOICES FOR B2 (15 Invoices)
INSERT INTO invoices (id, business_id, order_id, customer_id, invoice_number, issue_date, due_date, subtotal, discount_amount, tax_amount, total_amount, paid_amount, balance_amount, status, notes) VALUES
('ba200001-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200001-0000-0000-0000-000000000001', 'cc200001-0000-0000-0000-000000000001', 'HA-INV-20101', CURRENT_DATE - INTERVAL '1 days', CURRENT_DATE + INTERVAL '13 days', 4800.00, 0, 0, 4800.00, 4800.00, 0, 'paid', 'Official VAT Receipt 1'),
('ba200002-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200002-0000-0000-0000-000000000001', 'cc200002-0000-0000-0000-000000000001', 'HA-INV-20102', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '12 days', 5400.00, 0, 0, 5400.00, 5400.00, 0, 'paid', 'Official VAT Receipt 2'),
('ba200003-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200003-0000-0000-0000-000000000001', 'cc200003-0000-0000-0000-000000000001', 'HA-INV-20103', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '11 days', 6000.00, 0, 0, 6000.00, 6000.00, 0, 'paid', 'Official VAT Receipt 3'),
('ba200004-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200004-0000-0000-0000-000000000001', 'cc200004-0000-0000-0000-000000000001', 'HA-INV-20104', CURRENT_DATE - INTERVAL '4 days', CURRENT_DATE + INTERVAL '10 days', 6600.00, 0, 0, 6600.00, 6600.00, 0, 'paid', 'Official VAT Receipt 4'),
('ba200005-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200005-0000-0000-0000-000000000001', 'cc200005-0000-0000-0000-000000000001', 'HA-INV-20105', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '9 days', 7200.00, 0, 0, 7200.00, 7200.00, 0, 'paid', 'Official VAT Receipt 5'),
('ba200006-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200006-0000-0000-0000-000000000001', 'cc200006-0000-0000-0000-000000000001', 'HA-INV-20106', CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE + INTERVAL '8 days', 7800.00, 0, 0, 7800.00, 7800.00, 0, 'paid', 'Official VAT Receipt 6'),
('ba200007-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200007-0000-0000-0000-000000000001', 'cc200007-0000-0000-0000-000000000001', 'HA-INV-20107', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE + INTERVAL '7 days', 8400.00, 0, 0, 8400.00, 8400.00, 0, 'paid', 'Official VAT Receipt 7'),
('ba200008-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200008-0000-0000-0000-000000000001', 'cc200008-0000-0000-0000-000000000001', 'HA-INV-20108', CURRENT_DATE - INTERVAL '8 days', CURRENT_DATE + INTERVAL '6 days', 9000.00, 0, 0, 9000.00, 9000.00, 0, 'paid', 'Official VAT Receipt 8'),
('ba200009-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa200009-0000-0000-0000-000000000001', 'cc200009-0000-0000-0000-000000000001', 'HA-INV-20109', CURRENT_DATE - INTERVAL '9 days', CURRENT_DATE + INTERVAL '5 days', 9600.00, 0, 0, 9600.00, 9600.00, 0, 'paid', 'Official VAT Receipt 9'),
('ba20000a-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa20000a-0000-0000-0000-000000000001', 'cc20000a-0000-0000-0000-000000000001', 'HA-INV-20110', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '4 days', 10200.00, 0, 0, 10200.00, 10200.00, 0, 'paid', 'Official VAT Receipt 10'),
('ba20000b-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa20000b-0000-0000-0000-000000000001', 'cc20000b-0000-0000-0000-000000000001', 'HA-INV-20111', CURRENT_DATE - INTERVAL '11 days', CURRENT_DATE + INTERVAL '3 days', 10800.00, 0, 0, 10800.00, 10800.00, 0, 'paid', 'Official VAT Receipt 11'),
('ba20000c-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa20000c-0000-0000-0000-000000000001', 'cc20000c-0000-0000-0000-000000000001', 'HA-INV-20112', CURRENT_DATE - INTERVAL '12 days', CURRENT_DATE + INTERVAL '2 days', 11400.00, 0, 0, 11400.00, 11400.00, 0, 'paid', 'Official VAT Receipt 12'),
('ba20000d-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa20000d-0000-0000-0000-000000000001', 'cc20000d-0000-0000-0000-000000000001', 'HA-INV-20113', CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE + INTERVAL '1 days', 12000.00, 0, 0, 12000.00, 12000.00, 0, 'paid', 'Official VAT Receipt 13'),
('ba20000e-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa20000e-0000-0000-0000-000000000001', 'cc20000e-0000-0000-0000-000000000001', 'HA-INV-20114', CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE + INTERVAL '0 days', 12600.00, 0, 0, 12600.00, 12600.00, 0, 'paid', 'Official VAT Receipt 14'),
('ba20000f-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'aa20000f-0000-0000-0000-000000000001', 'cc20000f-0000-0000-0000-000000000001', 'HA-INV-20115', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '-1 days', 13200.00, 0, 0, 13200.00, 13200.00, 0, 'paid', 'Official VAT Receipt 15')
ON CONFLICT (business_id, invoice_number) DO NOTHING;


-- ============================================================
-- WORKSPACE BU1: DEMO_BUSINESS_01 - Harsh Apex Tech Galle (Galle)
-- ============================================================

-- 1. CATEGORIES FOR BU1
INSERT INTO categories (id, business_id, name, slug, description, image_url) VALUES
('ca300001-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Beverages & Refreshments', 'cat-bu1-1', 'Beverages & Refreshments for Galle branch', '/demo-assets/categories/cat-1.webp'),
('ca300002-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Rice, Grains & Pulses', 'cat-bu1-2', 'Rice, Grains & Pulses for Galle branch', '/demo-assets/categories/cat-2.webp'),
('ca300003-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Spices, Herbs & Seasoning', 'cat-bu1-3', 'Spices, Herbs & Seasoning for Galle branch', '/demo-assets/categories/cat-3.webp'),
('ca300004-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Bakery & Confectionery', 'cat-bu1-4', 'Bakery & Confectionery for Galle branch', '/demo-assets/categories/cat-4.webp'),
('ca300005-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Dairy, Eggs & Butter', 'cat-bu1-5', 'Dairy, Eggs & Butter for Galle branch', '/demo-assets/categories/cat-5.webp'),
('ca300006-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Snacks & Crisps', 'cat-bu1-6', 'Snacks & Crisps for Galle branch', '/demo-assets/categories/cat-6.webp'),
('ca300007-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Household Cleaning & Laundry', 'cat-bu1-7', 'Household Cleaning & Laundry for Galle branch', '/demo-assets/categories/cat-7.webp'),
('ca300008-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Personal Care & Toiletries', 'cat-bu1-8', 'Personal Care & Toiletries for Galle branch', '/demo-assets/categories/cat-8.webp'),
('ca300009-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Stationery & Office Supplies', 'cat-bu1-9', 'Stationery & Office Supplies for Galle branch', '/demo-assets/categories/cat-9.webp'),
('ca30000a-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Fresh Produce & Essentials', 'cat-bu1-10', 'Fresh Produce & Essentials for Galle branch', '/demo-assets/categories/cat-10.webp')
ON CONFLICT (business_id, slug) DO NOTHING;

-- 2. PRODUCTS FOR BU1 (30 Products)
INSERT INTO products (id, business_id, category_id, name, sku, barcode, description, cost_price, selling_price, stock_quantity, min_stock_level, image_url, status) VALUES
('da300001-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ca300001-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU1 #1', 'SKU-BU1-001', '79357300001', 'Commercial Grade Item 1 for DEMO_BUSINESS_01 - Harsh Apex Tech Galle', 295.00, 400.00, 22, 8, '/demo-assets/products/prod-2.webp', 'active'),
('da300002-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ca300002-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU1 #2', 'SKU-BU1-002', '79357300002', 'Commercial Grade Item 2 for DEMO_BUSINESS_01 - Harsh Apex Tech Galle', 340.00, 460.00, 29, 8, '/demo-assets/products/prod-3.webp', 'active'),
('da300003-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ca300003-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU1 #3', 'SKU-BU1-003', '79357300003', 'Commercial Grade Item 3 for DEMO_BUSINESS_01 - Harsh Apex Tech Galle', 385.00, 520.00, 36, 8, '/demo-assets/products/prod-4.webp', 'active'),
('da300004-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ca300004-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU1 #4', 'SKU-BU1-004', '79357300004', 'Commercial Grade Item 4 for DEMO_BUSINESS_01 - Harsh Apex Tech Galle', 430.00, 580.00, 43, 8, '/demo-assets/products/prod-5.webp', 'active'),
('da300005-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ca300005-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU1 #5', 'SKU-BU1-005', '79357300005', 'Commercial Grade Item 5 for DEMO_BUSINESS_01 - Harsh Apex Tech Galle', 475.00, 640.00, 50, 8, '/demo-assets/products/prod-6.webp', 'active'),
('da300006-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ca300006-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU1 #6', 'SKU-BU1-006', '79357300006', 'Commercial Grade Item 6 for DEMO_BUSINESS_01 - Harsh Apex Tech Galle', 520.00, 700.00, 57, 8, '/demo-assets/products/prod-7.webp', 'active'),
('da300007-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ca300007-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU1 #7', 'SKU-BU1-007', '79357300007', 'Commercial Grade Item 7 for DEMO_BUSINESS_01 - Harsh Apex Tech Galle', 565.00, 760.00, 64, 8, '/demo-assets/products/prod-8.webp', 'active'),
('da300008-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ca300008-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU1 #8', 'SKU-BU1-008', '79357300008', 'Commercial Grade Item 8 for DEMO_BUSINESS_01 - Harsh Apex Tech Galle', 610.00, 820.00, 71, 8, '/demo-assets/products/prod-9.webp', 'active'),
('da300009-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ca300009-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU1 #9', 'SKU-BU1-009', '79357300009', 'Commercial Grade Item 9 for DEMO_BUSINESS_01 - Harsh Apex Tech Galle', 655.00, 880.00, 78, 8, '/demo-assets/products/prod-10.webp', 'active'),
('da30000a-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ca30000a-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU1 #10', 'SKU-BU1-010', '79357300010', 'Commercial Grade Item 10 for DEMO_BUSINESS_01 - Harsh Apex Tech Galle', 700.00, 950.00, 20, 8, '/demo-assets/products/prod-1.webp', 'active'),
('da30000b-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ca300001-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU1 #11', 'SKU-BU1-011', '79357300011', 'Commercial Grade Item 11 for DEMO_BUSINESS_01 - Harsh Apex Tech Galle', 745.00, 1010.00, 27, 8, '/demo-assets/products/prod-2.webp', 'active'),
('da30000c-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ca300002-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU1 #12', 'SKU-BU1-012', '79357300012', 'Commercial Grade Item 12 for DEMO_BUSINESS_01 - Harsh Apex Tech Galle', 790.00, 1070.00, 34, 8, '/demo-assets/products/prod-3.webp', 'active'),
('da30000d-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ca300003-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU1 #13', 'SKU-BU1-013', '79357300013', 'Commercial Grade Item 13 for DEMO_BUSINESS_01 - Harsh Apex Tech Galle', 835.00, 1130.00, 41, 8, '/demo-assets/products/prod-4.webp', 'active'),
('da30000e-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ca300004-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU1 #14', 'SKU-BU1-014', '79357300014', 'Commercial Grade Item 14 for DEMO_BUSINESS_01 - Harsh Apex Tech Galle', 880.00, 1190.00, 48, 8, '/demo-assets/products/prod-5.webp', 'active'),
('da30000f-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ca300005-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU1 #15', 'SKU-BU1-015', '79357300015', 'Commercial Grade Item 15 for DEMO_BUSINESS_01 - Harsh Apex Tech Galle', 925.00, 1250.00, 55, 8, '/demo-assets/products/prod-6.webp', 'active'),
('da300010-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ca300006-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU1 #16', 'SKU-BU1-016', '79357300016', 'Commercial Grade Item 16 for DEMO_BUSINESS_01 - Harsh Apex Tech Galle', 970.00, 1310.00, 62, 8, '/demo-assets/products/prod-7.webp', 'active'),
('da300011-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ca300007-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU1 #17', 'SKU-BU1-017', '79357300017', 'Commercial Grade Item 17 for DEMO_BUSINESS_01 - Harsh Apex Tech Galle', 1015.00, 1370.00, 69, 8, '/demo-assets/products/prod-8.webp', 'active'),
('da300012-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ca300008-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU1 #18', 'SKU-BU1-018', '79357300018', 'Commercial Grade Item 18 for DEMO_BUSINESS_01 - Harsh Apex Tech Galle', 1060.00, 1430.00, 76, 8, '/demo-assets/products/prod-9.webp', 'active'),
('da300013-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ca300009-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU1 #19', 'SKU-BU1-019', '79357300019', 'Commercial Grade Item 19 for DEMO_BUSINESS_01 - Harsh Apex Tech Galle', 1105.00, 1490.00, 18, 8, '/demo-assets/products/prod-10.webp', 'active'),
('da300014-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ca30000a-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU1 #20', 'SKU-BU1-020', '79357300020', 'Commercial Grade Item 20 for DEMO_BUSINESS_01 - Harsh Apex Tech Galle', 1150.00, 1550.00, 25, 8, '/demo-assets/products/prod-1.webp', 'active'),
('da300015-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ca300001-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU1 #21', 'SKU-BU1-021', '79357300021', 'Commercial Grade Item 21 for DEMO_BUSINESS_01 - Harsh Apex Tech Galle', 1195.00, 1610.00, 32, 8, '/demo-assets/products/prod-2.webp', 'active'),
('da300016-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ca300002-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU1 #22', 'SKU-BU1-022', '79357300022', 'Commercial Grade Item 22 for DEMO_BUSINESS_01 - Harsh Apex Tech Galle', 1240.00, 1670.00, 39, 8, '/demo-assets/products/prod-3.webp', 'active'),
('da300017-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ca300003-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU1 #23', 'SKU-BU1-023', '79357300023', 'Commercial Grade Item 23 for DEMO_BUSINESS_01 - Harsh Apex Tech Galle', 1285.00, 1730.00, 46, 8, '/demo-assets/products/prod-4.webp', 'active'),
('da300018-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ca300004-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU1 #24', 'SKU-BU1-024', '79357300024', 'Commercial Grade Item 24 for DEMO_BUSINESS_01 - Harsh Apex Tech Galle', 1330.00, 1800.00, 53, 8, '/demo-assets/products/prod-5.webp', 'active'),
('da300019-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ca300005-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU1 #25', 'SKU-BU1-025', '79357300025', 'Commercial Grade Item 25 for DEMO_BUSINESS_01 - Harsh Apex Tech Galle', 1375.00, 1860.00, 60, 8, '/demo-assets/products/prod-6.webp', 'active'),
('da30001a-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ca300006-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU1 #26', 'SKU-BU1-026', '79357300026', 'Commercial Grade Item 26 for DEMO_BUSINESS_01 - Harsh Apex Tech Galle', 1420.00, 1920.00, 67, 8, '/demo-assets/products/prod-7.webp', 'active'),
('da30001b-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ca300007-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU1 #27', 'SKU-BU1-027', '79357300027', 'Commercial Grade Item 27 for DEMO_BUSINESS_01 - Harsh Apex Tech Galle', 1465.00, 1980.00, 74, 8, '/demo-assets/products/prod-8.webp', 'active'),
('da30001c-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ca300008-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU1 #28', 'SKU-BU1-028', '79357300028', 'Commercial Grade Item 28 for DEMO_BUSINESS_01 - Harsh Apex Tech Galle', 1510.00, 2040.00, 16, 8, '/demo-assets/products/prod-9.webp', 'active'),
('da30001d-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ca300009-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU1 #29', 'SKU-BU1-029', '79357300029', 'Commercial Grade Item 29 for DEMO_BUSINESS_01 - Harsh Apex Tech Galle', 1555.00, 2100.00, 23, 8, '/demo-assets/products/prod-10.webp', 'active'),
('da30001e-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ca30000a-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU1 #30', 'SKU-BU1-030', '79357300030', 'Commercial Grade Item 30 for DEMO_BUSINESS_01 - Harsh Apex Tech Galle', 1600.00, 2160.00, 30, 8, '/demo-assets/products/prod-1.webp', 'active')
ON CONFLICT (business_id, sku) DO NOTHING;

-- 3. INVENTORY FOR BU1
INSERT INTO inventory (business_id, product_id, quantity, reserved_quantity, location)
SELECT business_id, id, stock_quantity, 0, 'Galle Main Store'
FROM products WHERE business_id = 'a3000000-0000-0000-0000-000000000003'
ON CONFLICT (business_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- 4. CUSTOMERS FOR BU1 (20 Customers)
INSERT INTO customers (id, business_id, name, phone, email, address, total_purchases, total_orders, outstanding_balance, last_purchase_at) VALUES
('cc300001-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Sunil Jayawardena', '+94 77 234 5678', 'sunil.j.bu1@gmail.com', '142 Havelock Road, Galle', 14400.00, 4, 0.00, NOW() - INTERVAL '1 days'),
('cc300002-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Kumari Alwis', '+94 71 876 5432', 'kumari.alwis.bu1@gmail.com', '56 Rajagiriya Road, Galle', 16800.00, 5, 0.00, NOW() - INTERVAL '2 days'),
('cc300003-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Mohamed Rizwan', '+94 76 543 2198', 'm.rizwan.trading.bu1@gmail.com', '88 Keyzer Street, Pettah, Galle', 19200.00, 6, 0.00, NOW() - INTERVAL '3 days'),
('cc300004-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Priyantha Gunasekara', '+94 77 654 3210', 'priyantha.guna.bu1@gmail.com', '23 Temple Road, Nugegoda, Galle', 21600.00, 7, 0.00, NOW() - INTERVAL '4 days'),
('cc300005-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Chamari Dissanayake', '+94 72 345 6789', 'chamari.d.bu1@gmail.com', '77 Stanley Tillakaratne Mawatha, Galle', 24000.00, 8, 3750.00, NOW() - INTERVAL '5 days'),
('cc300006-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Siva Subramaniam', '+94 77 889 9001', 'siva.subra.bu1@gmail.com', '12 Sea Street, Galle', 26400.00, 9, 0.00, NOW() - INTERVAL '6 days'),
('cc300007-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Anushka Bandara', '+94 75 112 2334', 'anushka.b.bu1@gmail.com', '98 High Level Road, Maharagama, Galle', 28800.00, 10, 0.00, NOW() - INTERVAL '7 days'),
('cc300008-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Malik Mansoor', '+94 77 998 8776', 'malik.mansoor.bu1@gmail.com', '34 Wekande Road, Galle', 31200.00, 11, 0.00, NOW() - INTERVAL '8 days'),
('cc300009-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Kavindi Senaratne', '+94 71 445 5667', 'kavindi.sena.bu1@gmail.com', '5 Anderson Road, Dehiwala, Galle', 33600.00, 12, 0.00, NOW() - INTERVAL '9 days'),
('cc30000a-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Dinesh Samarawickrama', '+94 70 334 4556', 'dinesh.sam.bu1@gmail.com', '19 Galle Road, Mount Lavinia, Galle', 36000.00, 13, 7500.00, NOW() - INTERVAL '10 days'),
('cc30000b-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Shalini Weerasinghe', '+94 77 667 7889', 'shalini.w.bu1@gmail.com', '40 Duplication Road, Galle', 38400.00, 14, 0.00, NOW() - INTERVAL '11 days'),
('cc30000c-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Ruwan Edirisinghe', '+94 76 778 8990', 'ruwan.ediri.bu1@gmail.com', '62 Baseline Road, Dematagoda, Galle', 40800.00, 15, 0.00, NOW() - INTERVAL '12 days'),
('cc30000d-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Thilini Fonseka', '+94 71 223 3445', 'thilini.fonseka.bu1@gmail.com', '110 Hospital Road, Kalubowila, Galle', 43200.00, 16, 0.00, NOW() - INTERVAL '13 days'),
('cc30000e-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Asanka Karunaratne', '+94 78 556 6778', 'asanka.k.bu1@gmail.com', '85 Sri Saranankara Road, Galle', 45600.00, 17, 0.00, NOW() - INTERVAL '14 days'),
('cc30000f-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Fathima Zeenath', '+94 77 443 3221', 'zeenath.fathima.bu1@gmail.com', '27 Maligawatta Place, Galle', 48000.00, 3, 11250.00, NOW() - INTERVAL '15 days'),
('cc300010-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Pradeep Kumara', '+94 70 889 9002', 'pradeep.kumara.bu1@gmail.com', '14 Negombo Road, Peliyagoda, Galle', 50400.00, 4, 0.00, NOW() - INTERVAL '16 days'),
('cc300011-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Hiruni Rathnayake', '+94 77 119 9228', 'hiruni.rathna.bu1@gmail.com', '73 Nawala Road, Galle', 52800.00, 5, 0.00, NOW() - INTERVAL '17 days'),
('cc300012-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Mahesh Wickramasinghe', '+94 76 123 9876', 'mahesh.wick.bu1@gmail.com', '29 Jubilee Post, Mirihana, Galle', 55200.00, 6, 0.00, NOW() - INTERVAL '18 days'),
('cc300013-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Nimanthi Abeysekera', '+94 71 990 0112', 'nimanthi.a.bu1@gmail.com', '91 Pagoda Road, Nugegoda, Galle', 57600.00, 7, 0.00, NOW() - INTERVAL '19 days'),
('cc300014-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Roshan Liyanage', '+94 77 554 4332', 'roshan.liya.bu1@gmail.com', '52 Old Kesbewa Road, Galle', 60000.00, 8, 15000.00, NOW() - INTERVAL '20 days')
ON CONFLICT (id) DO NOTHING;

-- 5. EMPLOYEES FOR BU1 (6 Employees)
INSERT INTO employees (id, business_id, employee_id_number, name, email, phone, position, department, salary, join_date, status, avatar_url) VALUES
('ee300001-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'EMP-001-BU1', 'Kasun Perera', 'kasun.perera.bu1@harshapex.lk', '+94 77 211 4512', 'Owner & General Director', 'Executive', 220000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-1.webp'),
('ee300002-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'EMP-002-BU1', 'Buddhika Senanayake', 'buddhika.senanayake.bu1@harshapex.lk', '+94 77 212 4522', 'Operations General Manager', 'Operations', 140000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-2.webp'),
('ee300003-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'EMP-003-BU1', 'Sanduni Wijeratne', 'sanduni.wijeratne.bu1@harshapex.lk', '+94 77 213 4532', 'Head of Sales & Billing', 'Sales', 85000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-3.webp'),
('ee300004-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'EMP-004-BU1', 'Nuwan Jayalath', 'nuwan.jayalath.bu1@harshapex.lk', '+94 77 214 4542', 'Inventory & Logistics Lead', 'Logistics', 90000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-4.webp'),
('ee300005-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'EMP-005-BU1', 'Kavinda Maduranga', 'kavinda.maduranga.bu1@harshapex.lk', '+94 77 215 4552', 'Senior Counter Cashier', 'Sales', 65000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-5.webp'),
('ee300006-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'EMP-006-BU1', 'Dharshani Mendis', 'dharshani.mendis.bu1@harshapex.lk', '+94 77 216 4562', 'Financial Analyst & Accounts', 'Finance', 105000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-6.webp')
ON CONFLICT (business_id, employee_id_number) DO NOTHING;

-- 6. EXPENSE CATEGORIES FOR BU1
INSERT INTO expense_categories (id, business_id, name, description) VALUES
('ec300001-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Store & Office Rent', 'Monthly commercial premises lease'),
('ec300002-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Electricity & Water Utilities', 'CEB & commercial utilities'),
('ec300003-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Staff Salaries & Overtime', 'Monthly payroll disbursements'),
('ec300004-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Logistics, Delivery & Fuel', 'Fleet fuel and transport charges'),
('ec300005-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Equipment & IT Maintenance', 'Hardware, thermal rolls, and network maintenance'),
('ec300006-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Marketing & Customer Loyalty', 'Promotional campaigns and SMS alerts'),
('ec300007-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Security & Municipal Taxes', 'Premises security and local council rates'),
('ec300008-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Packaging & Consumables', 'Eco bags, boxes, and parcel wrap'),
('ec300009-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Accounting & Professional Fees', 'Auditing, secretarial and legal retainer'),
('ec30000a-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'Miscellaneous Operational Contingency', 'Store daily operational petty expenses')
ON CONFLICT (business_id, name) DO NOTHING;

-- 7. EXPENSES FOR BU1 (10 Expenses)
INSERT INTO expenses (id, business_id, category_id, expense_number, expense_date, description, amount, payment_method, notes) VALUES
('ea300001-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ec300001-0000-0000-0000-000000000001', 'EXP-BU1-2026-001', CURRENT_DATE - INTERVAL '2 days', 'Store & Office Rent - Galle', 11700.00, 'card', 'Disbursed for Galle branch operational expenses'),
('ea300002-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ec300002-0000-0000-0000-000000000001', 'EXP-BU1-2026-002', CURRENT_DATE - INTERVAL '4 days', 'Electricity & Water Utilities - Galle', 14900.00, 'bank_transfer', 'Disbursed for Galle branch operational expenses'),
('ea300003-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ec300003-0000-0000-0000-000000000001', 'EXP-BU1-2026-003', CURRENT_DATE - INTERVAL '6 days', 'Staff Salaries & Overtime - Galle', 18100.00, 'cash', 'Disbursed for Galle branch operational expenses'),
('ea300004-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ec300004-0000-0000-0000-000000000001', 'EXP-BU1-2026-004', CURRENT_DATE - INTERVAL '8 days', 'Logistics, Delivery & Fuel - Galle', 21300.00, 'card', 'Disbursed for Galle branch operational expenses'),
('ea300005-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ec300005-0000-0000-0000-000000000001', 'EXP-BU1-2026-005', CURRENT_DATE - INTERVAL '10 days', 'Equipment & IT Maintenance - Galle', 24500.00, 'bank_transfer', 'Disbursed for Galle branch operational expenses'),
('ea300006-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ec300006-0000-0000-0000-000000000001', 'EXP-BU1-2026-006', CURRENT_DATE - INTERVAL '12 days', 'Marketing & Customer Loyalty - Galle', 27700.00, 'cash', 'Disbursed for Galle branch operational expenses'),
('ea300007-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ec300007-0000-0000-0000-000000000001', 'EXP-BU1-2026-007', CURRENT_DATE - INTERVAL '14 days', 'Security & Municipal Taxes - Galle', 30900.00, 'card', 'Disbursed for Galle branch operational expenses'),
('ea300008-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ec300008-0000-0000-0000-000000000001', 'EXP-BU1-2026-008', CURRENT_DATE - INTERVAL '16 days', 'Packaging & Consumables - Galle', 34100.00, 'bank_transfer', 'Disbursed for Galle branch operational expenses'),
('ea300009-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ec300009-0000-0000-0000-000000000001', 'EXP-BU1-2026-009', CURRENT_DATE - INTERVAL '18 days', 'Accounting & Professional Fees - Galle', 37300.00, 'cash', 'Disbursed for Galle branch operational expenses'),
('ea30000a-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ec30000a-0000-0000-0000-000000000001', 'EXP-BU1-2026-010', CURRENT_DATE - INTERVAL '20 days', 'Miscellaneous Operational Contingency - Galle', 40500.00, 'card', 'Disbursed for Galle branch operational expenses')
ON CONFLICT (business_id, expense_number) DO NOTHING;

-- 8. ORDERS FOR BU1 (40 Orders)
INSERT INTO orders (id, business_id, order_number, customer_id, status, payment_status, payment_method, subtotal, discount_amount, tax_amount, total_amount, notes, created_at) VALUES
('aa300001-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1001', 'cc300001-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 2850.00, 0.00, 0, 2850.00, 'Order 1 processed in Galle', NOW() - INTERVAL '4 hours'),
('aa300002-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1002', 'cc300002-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 3200.00, 0.00, 0, 3200.00, 'Order 2 processed in Galle', NOW() - INTERVAL '8 hours'),
('aa300003-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1003', 'cc300003-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 3550.00, 0.00, 0, 3550.00, 'Order 3 processed in Galle', NOW() - INTERVAL '12 hours'),
('aa300004-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1004', 'cc300004-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 3900.00, 200.00, 0, 3700.00, 'Order 4 processed in Galle', NOW() - INTERVAL '16 hours'),
('aa300005-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1005', 'cc300005-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 4250.00, 0.00, 0, 4250.00, 'Order 5 processed in Galle', NOW() - INTERVAL '20 hours'),
('aa300006-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1006', 'cc300006-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 4600.00, 0.00, 0, 4600.00, 'Order 6 processed in Galle', NOW() - INTERVAL '24 hours'),
('aa300007-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1007', 'cc300007-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 4950.00, 0.00, 0, 4950.00, 'Order 7 processed in Galle', NOW() - INTERVAL '28 hours'),
('aa300008-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1008', 'cc300008-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 5300.00, 200.00, 0, 5100.00, 'Order 8 processed in Galle', NOW() - INTERVAL '32 hours'),
('aa300009-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1009', 'cc300009-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 5650.00, 0.00, 0, 5650.00, 'Order 9 processed in Galle', NOW() - INTERVAL '36 hours'),
('aa30000a-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1010', 'cc30000a-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 6000.00, 0.00, 0, 6000.00, 'Order 10 processed in Galle', NOW() - INTERVAL '40 hours'),
('aa30000b-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1011', 'cc30000b-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 6350.00, 0.00, 0, 6350.00, 'Order 11 processed in Galle', NOW() - INTERVAL '44 hours'),
('aa30000c-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1012', 'cc30000c-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 6700.00, 200.00, 0, 6500.00, 'Order 12 processed in Galle', NOW() - INTERVAL '48 hours'),
('aa30000d-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1013', 'cc30000d-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 7050.00, 0.00, 0, 7050.00, 'Order 13 processed in Galle', NOW() - INTERVAL '52 hours'),
('aa30000e-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1014', 'cc30000e-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 7400.00, 0.00, 0, 7400.00, 'Order 14 processed in Galle', NOW() - INTERVAL '56 hours'),
('aa30000f-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1015', 'cc30000f-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 7750.00, 0.00, 0, 7750.00, 'Order 15 processed in Galle', NOW() - INTERVAL '60 hours'),
('aa300010-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1016', 'cc300010-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 8100.00, 200.00, 0, 7900.00, 'Order 16 processed in Galle', NOW() - INTERVAL '64 hours'),
('aa300011-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1017', 'cc300011-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 8450.00, 0.00, 0, 8450.00, 'Order 17 processed in Galle', NOW() - INTERVAL '68 hours'),
('aa300012-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1018', 'cc300012-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 8800.00, 0.00, 0, 8800.00, 'Order 18 processed in Galle', NOW() - INTERVAL '72 hours'),
('aa300013-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1019', 'cc300013-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 9150.00, 0.00, 0, 9150.00, 'Order 19 processed in Galle', NOW() - INTERVAL '76 hours'),
('aa300014-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1020', 'cc300014-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 9500.00, 200.00, 0, 9300.00, 'Order 20 processed in Galle', NOW() - INTERVAL '80 hours'),
('aa300015-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1021', 'cc300001-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 9850.00, 0.00, 0, 9850.00, 'Order 21 processed in Galle', NOW() - INTERVAL '84 hours'),
('aa300016-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1022', 'cc300002-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 10200.00, 0.00, 0, 10200.00, 'Order 22 processed in Galle', NOW() - INTERVAL '88 hours'),
('aa300017-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1023', 'cc300003-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 10550.00, 0.00, 0, 10550.00, 'Order 23 processed in Galle', NOW() - INTERVAL '92 hours'),
('aa300018-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1024', 'cc300004-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 10900.00, 200.00, 0, 10700.00, 'Order 24 processed in Galle', NOW() - INTERVAL '96 hours'),
('aa300019-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1025', 'cc300005-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 11250.00, 0.00, 0, 11250.00, 'Order 25 processed in Galle', NOW() - INTERVAL '100 hours'),
('aa30001a-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1026', 'cc300006-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 11600.00, 0.00, 0, 11600.00, 'Order 26 processed in Galle', NOW() - INTERVAL '104 hours'),
('aa30001b-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1027', 'cc300007-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 11950.00, 0.00, 0, 11950.00, 'Order 27 processed in Galle', NOW() - INTERVAL '108 hours'),
('aa30001c-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1028', 'cc300008-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 12300.00, 200.00, 0, 12100.00, 'Order 28 processed in Galle', NOW() - INTERVAL '112 hours'),
('aa30001d-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1029', 'cc300009-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 12650.00, 0.00, 0, 12650.00, 'Order 29 processed in Galle', NOW() - INTERVAL '116 hours'),
('aa30001e-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1030', 'cc30000a-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 13000.00, 0.00, 0, 13000.00, 'Order 30 processed in Galle', NOW() - INTERVAL '120 hours'),
('aa30001f-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1031', 'cc30000b-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 13350.00, 0.00, 0, 13350.00, 'Order 31 processed in Galle', NOW() - INTERVAL '124 hours'),
('aa300020-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1032', 'cc30000c-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 13700.00, 200.00, 0, 13500.00, 'Order 32 processed in Galle', NOW() - INTERVAL '128 hours'),
('aa300021-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1033', 'cc30000d-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 14050.00, 0.00, 0, 14050.00, 'Order 33 processed in Galle', NOW() - INTERVAL '132 hours'),
('aa300022-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1034', 'cc30000e-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 14400.00, 0.00, 0, 14400.00, 'Order 34 processed in Galle', NOW() - INTERVAL '136 hours'),
('aa300023-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1035', 'cc30000f-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 14750.00, 0.00, 0, 14750.00, 'Order 35 processed in Galle', NOW() - INTERVAL '140 hours'),
('aa300024-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1036', 'cc300010-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 15100.00, 200.00, 0, 14900.00, 'Order 36 processed in Galle', NOW() - INTERVAL '144 hours'),
('aa300025-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1037', 'cc300011-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 15450.00, 0.00, 0, 15450.00, 'Order 37 processed in Galle', NOW() - INTERVAL '148 hours'),
('aa300026-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1038', 'cc300012-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 15800.00, 0.00, 0, 15800.00, 'Order 38 processed in Galle', NOW() - INTERVAL '152 hours'),
('aa300027-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1039', 'cc300013-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 16150.00, 0.00, 0, 16150.00, 'Order 39 processed in Galle', NOW() - INTERVAL '156 hours'),
('aa300028-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'ORD-BU1-1040', 'cc300014-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 16500.00, 200.00, 0, 16300.00, 'Order 40 processed in Galle', NOW() - INTERVAL '160 hours')
ON CONFLICT (business_id, order_number) DO NOTHING;

-- 9. ORDER ITEMS FOR BU1
INSERT INTO order_items (id, business_id, order_id, product_id, quantity, unit_price, cost_price, discount_amount, total_price) VALUES
('bb300001-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300001-0000-0000-0000-000000000001', 'da300001-0000-0000-0000-000000000001', 2, 900.00, 635.00, 0, 1800.00),
('bb300002-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300002-0000-0000-0000-000000000001', 'da300002-0000-0000-0000-000000000001', 2, 950.00, 670.00, 0, 1900.00),
('bb300003-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300003-0000-0000-0000-000000000001', 'da300003-0000-0000-0000-000000000001', 2, 1000.00, 705.00, 0, 2000.00),
('bb300004-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300004-0000-0000-0000-000000000001', 'da300004-0000-0000-0000-000000000001', 2, 1050.00, 740.00, 0, 2100.00),
('bb300005-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300005-0000-0000-0000-000000000001', 'da300005-0000-0000-0000-000000000001', 2, 1100.00, 775.00, 0, 2200.00),
('bb300006-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300006-0000-0000-0000-000000000001', 'da300006-0000-0000-0000-000000000001', 2, 1150.00, 810.00, 0, 2300.00),
('bb300007-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300007-0000-0000-0000-000000000001', 'da300007-0000-0000-0000-000000000001', 2, 1200.00, 845.00, 0, 2400.00),
('bb300008-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300008-0000-0000-0000-000000000001', 'da300008-0000-0000-0000-000000000001', 2, 1250.00, 880.00, 0, 2500.00),
('bb300009-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300009-0000-0000-0000-000000000001', 'da300009-0000-0000-0000-000000000001', 2, 1300.00, 915.00, 0, 2600.00),
('bb30000a-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa30000a-0000-0000-0000-000000000001', 'da30000a-0000-0000-0000-000000000001', 2, 1350.00, 950.00, 0, 2700.00),
('bb30000b-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa30000b-0000-0000-0000-000000000001', 'da30000b-0000-0000-0000-000000000001', 2, 1400.00, 985.00, 0, 2800.00),
('bb30000c-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa30000c-0000-0000-0000-000000000001', 'da30000c-0000-0000-0000-000000000001', 2, 1450.00, 1020.00, 0, 2900.00),
('bb30000d-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa30000d-0000-0000-0000-000000000001', 'da30000d-0000-0000-0000-000000000001', 2, 1500.00, 1055.00, 0, 3000.00),
('bb30000e-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa30000e-0000-0000-0000-000000000001', 'da30000e-0000-0000-0000-000000000001', 2, 1550.00, 1090.00, 0, 3100.00),
('bb30000f-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa30000f-0000-0000-0000-000000000001', 'da30000f-0000-0000-0000-000000000001', 2, 1600.00, 1125.00, 0, 3200.00),
('bb300010-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300010-0000-0000-0000-000000000001', 'da300010-0000-0000-0000-000000000001', 2, 1650.00, 1160.00, 0, 3300.00),
('bb300011-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300011-0000-0000-0000-000000000001', 'da300011-0000-0000-0000-000000000001', 2, 1700.00, 1195.00, 0, 3400.00),
('bb300012-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300012-0000-0000-0000-000000000001', 'da300012-0000-0000-0000-000000000001', 2, 1750.00, 1230.00, 0, 3500.00),
('bb300013-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300013-0000-0000-0000-000000000001', 'da300013-0000-0000-0000-000000000001', 2, 1800.00, 1265.00, 0, 3600.00),
('bb300014-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300014-0000-0000-0000-000000000001', 'da300014-0000-0000-0000-000000000001', 2, 1850.00, 1300.00, 0, 3700.00),
('bb300015-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300015-0000-0000-0000-000000000001', 'da300015-0000-0000-0000-000000000001', 2, 1900.00, 1335.00, 0, 3800.00),
('bb300016-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300016-0000-0000-0000-000000000001', 'da300016-0000-0000-0000-000000000001', 2, 1950.00, 1370.00, 0, 3900.00),
('bb300017-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300017-0000-0000-0000-000000000001', 'da300017-0000-0000-0000-000000000001', 2, 2000.00, 1405.00, 0, 4000.00),
('bb300018-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300018-0000-0000-0000-000000000001', 'da300018-0000-0000-0000-000000000001', 2, 2050.00, 1440.00, 0, 4100.00),
('bb300019-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300019-0000-0000-0000-000000000001', 'da300019-0000-0000-0000-000000000001', 2, 2100.00, 1475.00, 0, 4200.00),
('bb30001a-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa30001a-0000-0000-0000-000000000001', 'da30001a-0000-0000-0000-000000000001', 2, 2150.00, 1510.00, 0, 4300.00),
('bb30001b-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa30001b-0000-0000-0000-000000000001', 'da30001b-0000-0000-0000-000000000001', 2, 2200.00, 1545.00, 0, 4400.00),
('bb30001c-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa30001c-0000-0000-0000-000000000001', 'da30001c-0000-0000-0000-000000000001', 2, 2250.00, 1580.00, 0, 4500.00),
('bb30001d-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa30001d-0000-0000-0000-000000000001', 'da30001d-0000-0000-0000-000000000001', 2, 2300.00, 1615.00, 0, 4600.00),
('bb30001e-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa30001e-0000-0000-0000-000000000001', 'da30001e-0000-0000-0000-000000000001', 2, 2350.00, 1650.00, 0, 4700.00),
('bb30001f-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa30001f-0000-0000-0000-000000000001', 'da300001-0000-0000-0000-000000000001', 2, 2400.00, 1685.00, 0, 4800.00),
('bb300020-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300020-0000-0000-0000-000000000001', 'da300002-0000-0000-0000-000000000001', 2, 2450.00, 1720.00, 0, 4900.00),
('bb300021-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300021-0000-0000-0000-000000000001', 'da300003-0000-0000-0000-000000000001', 2, 2500.00, 1755.00, 0, 5000.00),
('bb300022-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300022-0000-0000-0000-000000000001', 'da300004-0000-0000-0000-000000000001', 2, 2550.00, 1790.00, 0, 5100.00),
('bb300023-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300023-0000-0000-0000-000000000001', 'da300005-0000-0000-0000-000000000001', 2, 2600.00, 1825.00, 0, 5200.00),
('bb300024-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300024-0000-0000-0000-000000000001', 'da300006-0000-0000-0000-000000000001', 2, 2650.00, 1860.00, 0, 5300.00),
('bb300025-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300025-0000-0000-0000-000000000001', 'da300007-0000-0000-0000-000000000001', 2, 2700.00, 1895.00, 0, 5400.00),
('bb300026-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300026-0000-0000-0000-000000000001', 'da300008-0000-0000-0000-000000000001', 2, 2750.00, 1930.00, 0, 5500.00),
('bb300027-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300027-0000-0000-0000-000000000001', 'da300009-0000-0000-0000-000000000001', 2, 2800.00, 1965.00, 0, 5600.00),
('bb300028-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300028-0000-0000-0000-000000000001', 'da30000a-0000-0000-0000-000000000001', 2, 2850.00, 2000.00, 0, 5700.00)
ON CONFLICT (id) DO NOTHING;

-- 10. INVOICES FOR BU1 (15 Invoices)
INSERT INTO invoices (id, business_id, order_id, customer_id, invoice_number, issue_date, due_date, subtotal, discount_amount, tax_amount, total_amount, paid_amount, balance_amount, status, notes) VALUES
('ba300001-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300001-0000-0000-0000-000000000001', 'cc300001-0000-0000-0000-000000000001', 'HA-INV-30101', CURRENT_DATE - INTERVAL '1 days', CURRENT_DATE + INTERVAL '13 days', 4800.00, 0, 0, 4800.00, 4800.00, 0, 'paid', 'Official VAT Receipt 1'),
('ba300002-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300002-0000-0000-0000-000000000001', 'cc300002-0000-0000-0000-000000000001', 'HA-INV-30102', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '12 days', 5400.00, 0, 0, 5400.00, 5400.00, 0, 'paid', 'Official VAT Receipt 2'),
('ba300003-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300003-0000-0000-0000-000000000001', 'cc300003-0000-0000-0000-000000000001', 'HA-INV-30103', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '11 days', 6000.00, 0, 0, 6000.00, 6000.00, 0, 'paid', 'Official VAT Receipt 3'),
('ba300004-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300004-0000-0000-0000-000000000001', 'cc300004-0000-0000-0000-000000000001', 'HA-INV-30104', CURRENT_DATE - INTERVAL '4 days', CURRENT_DATE + INTERVAL '10 days', 6600.00, 0, 0, 6600.00, 6600.00, 0, 'paid', 'Official VAT Receipt 4'),
('ba300005-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300005-0000-0000-0000-000000000001', 'cc300005-0000-0000-0000-000000000001', 'HA-INV-30105', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '9 days', 7200.00, 0, 0, 7200.00, 7200.00, 0, 'paid', 'Official VAT Receipt 5'),
('ba300006-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300006-0000-0000-0000-000000000001', 'cc300006-0000-0000-0000-000000000001', 'HA-INV-30106', CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE + INTERVAL '8 days', 7800.00, 0, 0, 7800.00, 7800.00, 0, 'paid', 'Official VAT Receipt 6'),
('ba300007-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300007-0000-0000-0000-000000000001', 'cc300007-0000-0000-0000-000000000001', 'HA-INV-30107', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE + INTERVAL '7 days', 8400.00, 0, 0, 8400.00, 8400.00, 0, 'paid', 'Official VAT Receipt 7'),
('ba300008-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300008-0000-0000-0000-000000000001', 'cc300008-0000-0000-0000-000000000001', 'HA-INV-30108', CURRENT_DATE - INTERVAL '8 days', CURRENT_DATE + INTERVAL '6 days', 9000.00, 0, 0, 9000.00, 9000.00, 0, 'paid', 'Official VAT Receipt 8'),
('ba300009-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa300009-0000-0000-0000-000000000001', 'cc300009-0000-0000-0000-000000000001', 'HA-INV-30109', CURRENT_DATE - INTERVAL '9 days', CURRENT_DATE + INTERVAL '5 days', 9600.00, 0, 0, 9600.00, 9600.00, 0, 'paid', 'Official VAT Receipt 9'),
('ba30000a-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa30000a-0000-0000-0000-000000000001', 'cc30000a-0000-0000-0000-000000000001', 'HA-INV-30110', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '4 days', 10200.00, 0, 0, 10200.00, 10200.00, 0, 'paid', 'Official VAT Receipt 10'),
('ba30000b-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa30000b-0000-0000-0000-000000000001', 'cc30000b-0000-0000-0000-000000000001', 'HA-INV-30111', CURRENT_DATE - INTERVAL '11 days', CURRENT_DATE + INTERVAL '3 days', 10800.00, 0, 0, 10800.00, 10800.00, 0, 'paid', 'Official VAT Receipt 11'),
('ba30000c-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa30000c-0000-0000-0000-000000000001', 'cc30000c-0000-0000-0000-000000000001', 'HA-INV-30112', CURRENT_DATE - INTERVAL '12 days', CURRENT_DATE + INTERVAL '2 days', 11400.00, 0, 0, 11400.00, 11400.00, 0, 'paid', 'Official VAT Receipt 12'),
('ba30000d-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa30000d-0000-0000-0000-000000000001', 'cc30000d-0000-0000-0000-000000000001', 'HA-INV-30113', CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE + INTERVAL '1 days', 12000.00, 0, 0, 12000.00, 12000.00, 0, 'paid', 'Official VAT Receipt 13'),
('ba30000e-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa30000e-0000-0000-0000-000000000001', 'cc30000e-0000-0000-0000-000000000001', 'HA-INV-30114', CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE + INTERVAL '0 days', 12600.00, 0, 0, 12600.00, 12600.00, 0, 'paid', 'Official VAT Receipt 14'),
('ba30000f-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000003', 'aa30000f-0000-0000-0000-000000000001', 'cc30000f-0000-0000-0000-000000000001', 'HA-INV-30115', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '-1 days', 13200.00, 0, 0, 13200.00, 13200.00, 0, 'paid', 'Official VAT Receipt 15')
ON CONFLICT (business_id, invoice_number) DO NOTHING;


-- ============================================================
-- WORKSPACE BU2: DEMO_BUSINESS_02 - Apex Logistics Negombo (Negombo)
-- ============================================================

-- 1. CATEGORIES FOR BU2
INSERT INTO categories (id, business_id, name, slug, description, image_url) VALUES
('ca400001-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Beverages & Refreshments', 'cat-bu2-1', 'Beverages & Refreshments for Negombo branch', '/demo-assets/categories/cat-1.webp'),
('ca400002-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Rice, Grains & Pulses', 'cat-bu2-2', 'Rice, Grains & Pulses for Negombo branch', '/demo-assets/categories/cat-2.webp'),
('ca400003-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Spices, Herbs & Seasoning', 'cat-bu2-3', 'Spices, Herbs & Seasoning for Negombo branch', '/demo-assets/categories/cat-3.webp'),
('ca400004-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Bakery & Confectionery', 'cat-bu2-4', 'Bakery & Confectionery for Negombo branch', '/demo-assets/categories/cat-4.webp'),
('ca400005-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Dairy, Eggs & Butter', 'cat-bu2-5', 'Dairy, Eggs & Butter for Negombo branch', '/demo-assets/categories/cat-5.webp'),
('ca400006-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Snacks & Crisps', 'cat-bu2-6', 'Snacks & Crisps for Negombo branch', '/demo-assets/categories/cat-6.webp'),
('ca400007-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Household Cleaning & Laundry', 'cat-bu2-7', 'Household Cleaning & Laundry for Negombo branch', '/demo-assets/categories/cat-7.webp'),
('ca400008-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Personal Care & Toiletries', 'cat-bu2-8', 'Personal Care & Toiletries for Negombo branch', '/demo-assets/categories/cat-8.webp'),
('ca400009-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Stationery & Office Supplies', 'cat-bu2-9', 'Stationery & Office Supplies for Negombo branch', '/demo-assets/categories/cat-9.webp'),
('ca40000a-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Fresh Produce & Essentials', 'cat-bu2-10', 'Fresh Produce & Essentials for Negombo branch', '/demo-assets/categories/cat-10.webp')
ON CONFLICT (business_id, slug) DO NOTHING;

-- 2. PRODUCTS FOR BU2 (30 Products)
INSERT INTO products (id, business_id, category_id, name, sku, barcode, description, cost_price, selling_price, stock_quantity, min_stock_level, image_url, status) VALUES
('da400001-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ca400001-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU2 #1', 'SKU-BU2-001', '79357400001', 'Commercial Grade Item 1 for DEMO_BUSINESS_02 - Apex Logistics Negombo', 295.00, 400.00, 22, 8, '/demo-assets/products/prod-2.webp', 'active'),
('da400002-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ca400002-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU2 #2', 'SKU-BU2-002', '79357400002', 'Commercial Grade Item 2 for DEMO_BUSINESS_02 - Apex Logistics Negombo', 340.00, 460.00, 29, 8, '/demo-assets/products/prod-3.webp', 'active'),
('da400003-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ca400003-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU2 #3', 'SKU-BU2-003', '79357400003', 'Commercial Grade Item 3 for DEMO_BUSINESS_02 - Apex Logistics Negombo', 385.00, 520.00, 36, 8, '/demo-assets/products/prod-4.webp', 'active'),
('da400004-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ca400004-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU2 #4', 'SKU-BU2-004', '79357400004', 'Commercial Grade Item 4 for DEMO_BUSINESS_02 - Apex Logistics Negombo', 430.00, 580.00, 43, 8, '/demo-assets/products/prod-5.webp', 'active'),
('da400005-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ca400005-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU2 #5', 'SKU-BU2-005', '79357400005', 'Commercial Grade Item 5 for DEMO_BUSINESS_02 - Apex Logistics Negombo', 475.00, 640.00, 50, 8, '/demo-assets/products/prod-6.webp', 'active'),
('da400006-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ca400006-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU2 #6', 'SKU-BU2-006', '79357400006', 'Commercial Grade Item 6 for DEMO_BUSINESS_02 - Apex Logistics Negombo', 520.00, 700.00, 57, 8, '/demo-assets/products/prod-7.webp', 'active'),
('da400007-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ca400007-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU2 #7', 'SKU-BU2-007', '79357400007', 'Commercial Grade Item 7 for DEMO_BUSINESS_02 - Apex Logistics Negombo', 565.00, 760.00, 64, 8, '/demo-assets/products/prod-8.webp', 'active'),
('da400008-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ca400008-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU2 #8', 'SKU-BU2-008', '79357400008', 'Commercial Grade Item 8 for DEMO_BUSINESS_02 - Apex Logistics Negombo', 610.00, 820.00, 71, 8, '/demo-assets/products/prod-9.webp', 'active'),
('da400009-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ca400009-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU2 #9', 'SKU-BU2-009', '79357400009', 'Commercial Grade Item 9 for DEMO_BUSINESS_02 - Apex Logistics Negombo', 655.00, 880.00, 78, 8, '/demo-assets/products/prod-10.webp', 'active'),
('da40000a-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ca40000a-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU2 #10', 'SKU-BU2-010', '79357400010', 'Commercial Grade Item 10 for DEMO_BUSINESS_02 - Apex Logistics Negombo', 700.00, 950.00, 20, 8, '/demo-assets/products/prod-1.webp', 'active'),
('da40000b-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ca400001-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU2 #11', 'SKU-BU2-011', '79357400011', 'Commercial Grade Item 11 for DEMO_BUSINESS_02 - Apex Logistics Negombo', 745.00, 1010.00, 27, 8, '/demo-assets/products/prod-2.webp', 'active'),
('da40000c-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ca400002-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU2 #12', 'SKU-BU2-012', '79357400012', 'Commercial Grade Item 12 for DEMO_BUSINESS_02 - Apex Logistics Negombo', 790.00, 1070.00, 34, 8, '/demo-assets/products/prod-3.webp', 'active'),
('da40000d-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ca400003-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU2 #13', 'SKU-BU2-013', '79357400013', 'Commercial Grade Item 13 for DEMO_BUSINESS_02 - Apex Logistics Negombo', 835.00, 1130.00, 41, 8, '/demo-assets/products/prod-4.webp', 'active'),
('da40000e-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ca400004-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU2 #14', 'SKU-BU2-014', '79357400014', 'Commercial Grade Item 14 for DEMO_BUSINESS_02 - Apex Logistics Negombo', 880.00, 1190.00, 48, 8, '/demo-assets/products/prod-5.webp', 'active'),
('da40000f-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ca400005-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU2 #15', 'SKU-BU2-015', '79357400015', 'Commercial Grade Item 15 for DEMO_BUSINESS_02 - Apex Logistics Negombo', 925.00, 1250.00, 55, 8, '/demo-assets/products/prod-6.webp', 'active'),
('da400010-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ca400006-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU2 #16', 'SKU-BU2-016', '79357400016', 'Commercial Grade Item 16 for DEMO_BUSINESS_02 - Apex Logistics Negombo', 970.00, 1310.00, 62, 8, '/demo-assets/products/prod-7.webp', 'active'),
('da400011-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ca400007-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU2 #17', 'SKU-BU2-017', '79357400017', 'Commercial Grade Item 17 for DEMO_BUSINESS_02 - Apex Logistics Negombo', 1015.00, 1370.00, 69, 8, '/demo-assets/products/prod-8.webp', 'active'),
('da400012-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ca400008-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU2 #18', 'SKU-BU2-018', '79357400018', 'Commercial Grade Item 18 for DEMO_BUSINESS_02 - Apex Logistics Negombo', 1060.00, 1430.00, 76, 8, '/demo-assets/products/prod-9.webp', 'active'),
('da400013-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ca400009-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU2 #19', 'SKU-BU2-019', '79357400019', 'Commercial Grade Item 19 for DEMO_BUSINESS_02 - Apex Logistics Negombo', 1105.00, 1490.00, 18, 8, '/demo-assets/products/prod-10.webp', 'active'),
('da400014-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ca40000a-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU2 #20', 'SKU-BU2-020', '79357400020', 'Commercial Grade Item 20 for DEMO_BUSINESS_02 - Apex Logistics Negombo', 1150.00, 1550.00, 25, 8, '/demo-assets/products/prod-1.webp', 'active'),
('da400015-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ca400001-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU2 #21', 'SKU-BU2-021', '79357400021', 'Commercial Grade Item 21 for DEMO_BUSINESS_02 - Apex Logistics Negombo', 1195.00, 1610.00, 32, 8, '/demo-assets/products/prod-2.webp', 'active'),
('da400016-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ca400002-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU2 #22', 'SKU-BU2-022', '79357400022', 'Commercial Grade Item 22 for DEMO_BUSINESS_02 - Apex Logistics Negombo', 1240.00, 1670.00, 39, 8, '/demo-assets/products/prod-3.webp', 'active'),
('da400017-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ca400003-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU2 #23', 'SKU-BU2-023', '79357400023', 'Commercial Grade Item 23 for DEMO_BUSINESS_02 - Apex Logistics Negombo', 1285.00, 1730.00, 46, 8, '/demo-assets/products/prod-4.webp', 'active'),
('da400018-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ca400004-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU2 #24', 'SKU-BU2-024', '79357400024', 'Commercial Grade Item 24 for DEMO_BUSINESS_02 - Apex Logistics Negombo', 1330.00, 1800.00, 53, 8, '/demo-assets/products/prod-5.webp', 'active'),
('da400019-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ca400005-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU2 #25', 'SKU-BU2-025', '79357400025', 'Commercial Grade Item 25 for DEMO_BUSINESS_02 - Apex Logistics Negombo', 1375.00, 1860.00, 60, 8, '/demo-assets/products/prod-6.webp', 'active'),
('da40001a-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ca400006-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU2 #26', 'SKU-BU2-026', '79357400026', 'Commercial Grade Item 26 for DEMO_BUSINESS_02 - Apex Logistics Negombo', 1420.00, 1920.00, 67, 8, '/demo-assets/products/prod-7.webp', 'active'),
('da40001b-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ca400007-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU2 #27', 'SKU-BU2-027', '79357400027', 'Commercial Grade Item 27 for DEMO_BUSINESS_02 - Apex Logistics Negombo', 1465.00, 1980.00, 74, 8, '/demo-assets/products/prod-8.webp', 'active'),
('da40001c-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ca400008-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU2 #28', 'SKU-BU2-028', '79357400028', 'Commercial Grade Item 28 for DEMO_BUSINESS_02 - Apex Logistics Negombo', 1510.00, 2040.00, 16, 8, '/demo-assets/products/prod-9.webp', 'active'),
('da40001d-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ca400009-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU2 #29', 'SKU-BU2-029', '79357400029', 'Commercial Grade Item 29 for DEMO_BUSINESS_02 - Apex Logistics Negombo', 1555.00, 2100.00, 23, 8, '/demo-assets/products/prod-10.webp', 'active'),
('da40001e-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ca40000a-0000-0000-0000-000000000001', 'Sri Lanka Quality Product BU2 #30', 'SKU-BU2-030', '79357400030', 'Commercial Grade Item 30 for DEMO_BUSINESS_02 - Apex Logistics Negombo', 1600.00, 2160.00, 30, 8, '/demo-assets/products/prod-1.webp', 'active')
ON CONFLICT (business_id, sku) DO NOTHING;

-- 3. INVENTORY FOR BU2
INSERT INTO inventory (business_id, product_id, quantity, reserved_quantity, location)
SELECT business_id, id, stock_quantity, 0, 'Negombo Main Store'
FROM products WHERE business_id = 'a4000000-0000-0000-0000-000000000004'
ON CONFLICT (business_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- 4. CUSTOMERS FOR BU2 (20 Customers)
INSERT INTO customers (id, business_id, name, phone, email, address, total_purchases, total_orders, outstanding_balance, last_purchase_at) VALUES
('cc400001-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Sunil Jayawardena', '+94 77 234 5678', 'sunil.j.bu2@gmail.com', '142 Havelock Road, Negombo', 14400.00, 4, 0.00, NOW() - INTERVAL '1 days'),
('cc400002-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Kumari Alwis', '+94 71 876 5432', 'kumari.alwis.bu2@gmail.com', '56 Rajagiriya Road, Negombo', 16800.00, 5, 0.00, NOW() - INTERVAL '2 days'),
('cc400003-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Mohamed Rizwan', '+94 76 543 2198', 'm.rizwan.trading.bu2@gmail.com', '88 Keyzer Street, Pettah, Negombo', 19200.00, 6, 0.00, NOW() - INTERVAL '3 days'),
('cc400004-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Priyantha Gunasekara', '+94 77 654 3210', 'priyantha.guna.bu2@gmail.com', '23 Temple Road, Nugegoda, Negombo', 21600.00, 7, 0.00, NOW() - INTERVAL '4 days'),
('cc400005-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Chamari Dissanayake', '+94 72 345 6789', 'chamari.d.bu2@gmail.com', '77 Stanley Tillakaratne Mawatha, Negombo', 24000.00, 8, 3750.00, NOW() - INTERVAL '5 days'),
('cc400006-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Siva Subramaniam', '+94 77 889 9001', 'siva.subra.bu2@gmail.com', '12 Sea Street, Negombo', 26400.00, 9, 0.00, NOW() - INTERVAL '6 days'),
('cc400007-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Anushka Bandara', '+94 75 112 2334', 'anushka.b.bu2@gmail.com', '98 High Level Road, Maharagama, Negombo', 28800.00, 10, 0.00, NOW() - INTERVAL '7 days'),
('cc400008-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Malik Mansoor', '+94 77 998 8776', 'malik.mansoor.bu2@gmail.com', '34 Wekande Road, Negombo', 31200.00, 11, 0.00, NOW() - INTERVAL '8 days'),
('cc400009-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Kavindi Senaratne', '+94 71 445 5667', 'kavindi.sena.bu2@gmail.com', '5 Anderson Road, Dehiwala, Negombo', 33600.00, 12, 0.00, NOW() - INTERVAL '9 days'),
('cc40000a-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Dinesh Samarawickrama', '+94 70 334 4556', 'dinesh.sam.bu2@gmail.com', '19 Galle Road, Mount Lavinia, Negombo', 36000.00, 13, 7500.00, NOW() - INTERVAL '10 days'),
('cc40000b-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Shalini Weerasinghe', '+94 77 667 7889', 'shalini.w.bu2@gmail.com', '40 Duplication Road, Negombo', 38400.00, 14, 0.00, NOW() - INTERVAL '11 days'),
('cc40000c-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Ruwan Edirisinghe', '+94 76 778 8990', 'ruwan.ediri.bu2@gmail.com', '62 Baseline Road, Dematagoda, Negombo', 40800.00, 15, 0.00, NOW() - INTERVAL '12 days'),
('cc40000d-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Thilini Fonseka', '+94 71 223 3445', 'thilini.fonseka.bu2@gmail.com', '110 Hospital Road, Kalubowila, Negombo', 43200.00, 16, 0.00, NOW() - INTERVAL '13 days'),
('cc40000e-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Asanka Karunaratne', '+94 78 556 6778', 'asanka.k.bu2@gmail.com', '85 Sri Saranankara Road, Negombo', 45600.00, 17, 0.00, NOW() - INTERVAL '14 days'),
('cc40000f-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Fathima Zeenath', '+94 77 443 3221', 'zeenath.fathima.bu2@gmail.com', '27 Maligawatta Place, Negombo', 48000.00, 3, 11250.00, NOW() - INTERVAL '15 days'),
('cc400010-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Pradeep Kumara', '+94 70 889 9002', 'pradeep.kumara.bu2@gmail.com', '14 Negombo Road, Peliyagoda, Negombo', 50400.00, 4, 0.00, NOW() - INTERVAL '16 days'),
('cc400011-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Hiruni Rathnayake', '+94 77 119 9228', 'hiruni.rathna.bu2@gmail.com', '73 Nawala Road, Negombo', 52800.00, 5, 0.00, NOW() - INTERVAL '17 days'),
('cc400012-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Mahesh Wickramasinghe', '+94 76 123 9876', 'mahesh.wick.bu2@gmail.com', '29 Jubilee Post, Mirihana, Negombo', 55200.00, 6, 0.00, NOW() - INTERVAL '18 days'),
('cc400013-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Nimanthi Abeysekera', '+94 71 990 0112', 'nimanthi.a.bu2@gmail.com', '91 Pagoda Road, Nugegoda, Negombo', 57600.00, 7, 0.00, NOW() - INTERVAL '19 days'),
('cc400014-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Roshan Liyanage', '+94 77 554 4332', 'roshan.liya.bu2@gmail.com', '52 Old Kesbewa Road, Negombo', 60000.00, 8, 15000.00, NOW() - INTERVAL '20 days')
ON CONFLICT (id) DO NOTHING;

-- 5. EMPLOYEES FOR BU2 (6 Employees)
INSERT INTO employees (id, business_id, employee_id_number, name, email, phone, position, department, salary, join_date, status, avatar_url) VALUES
('ee400001-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'EMP-001-BU2', 'Kasun Perera', 'kasun.perera.bu2@harshapex.lk', '+94 77 311 4512', 'Owner & General Director', 'Executive', 220000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-1.webp'),
('ee400002-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'EMP-002-BU2', 'Buddhika Senanayake', 'buddhika.senanayake.bu2@harshapex.lk', '+94 77 312 4522', 'Operations General Manager', 'Operations', 140000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-2.webp'),
('ee400003-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'EMP-003-BU2', 'Sanduni Wijeratne', 'sanduni.wijeratne.bu2@harshapex.lk', '+94 77 313 4532', 'Head of Sales & Billing', 'Sales', 85000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-3.webp'),
('ee400004-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'EMP-004-BU2', 'Nuwan Jayalath', 'nuwan.jayalath.bu2@harshapex.lk', '+94 77 314 4542', 'Inventory & Logistics Lead', 'Logistics', 90000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-4.webp'),
('ee400005-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'EMP-005-BU2', 'Kavinda Maduranga', 'kavinda.maduranga.bu2@harshapex.lk', '+94 77 315 4552', 'Senior Counter Cashier', 'Sales', 65000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-5.webp'),
('ee400006-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'EMP-006-BU2', 'Dharshani Mendis', 'dharshani.mendis.bu2@harshapex.lk', '+94 77 316 4562', 'Financial Analyst & Accounts', 'Finance', 105000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-6.webp')
ON CONFLICT (business_id, employee_id_number) DO NOTHING;

-- 6. EXPENSE CATEGORIES FOR BU2
INSERT INTO expense_categories (id, business_id, name, description) VALUES
('ec400001-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Store & Office Rent', 'Monthly commercial premises lease'),
('ec400002-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Electricity & Water Utilities', 'CEB & commercial utilities'),
('ec400003-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Staff Salaries & Overtime', 'Monthly payroll disbursements'),
('ec400004-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Logistics, Delivery & Fuel', 'Fleet fuel and transport charges'),
('ec400005-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Equipment & IT Maintenance', 'Hardware, thermal rolls, and network maintenance'),
('ec400006-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Marketing & Customer Loyalty', 'Promotional campaigns and SMS alerts'),
('ec400007-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Security & Municipal Taxes', 'Premises security and local council rates'),
('ec400008-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Packaging & Consumables', 'Eco bags, boxes, and parcel wrap'),
('ec400009-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Accounting & Professional Fees', 'Auditing, secretarial and legal retainer'),
('ec40000a-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'Miscellaneous Operational Contingency', 'Store daily operational petty expenses')
ON CONFLICT (business_id, name) DO NOTHING;

-- 7. EXPENSES FOR BU2 (10 Expenses)
INSERT INTO expenses (id, business_id, category_id, expense_number, expense_date, description, amount, payment_method, notes) VALUES
('ea400001-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ec400001-0000-0000-0000-000000000001', 'EXP-BU2-2026-001', CURRENT_DATE - INTERVAL '2 days', 'Store & Office Rent - Negombo', 11700.00, 'card', 'Disbursed for Negombo branch operational expenses'),
('ea400002-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ec400002-0000-0000-0000-000000000001', 'EXP-BU2-2026-002', CURRENT_DATE - INTERVAL '4 days', 'Electricity & Water Utilities - Negombo', 14900.00, 'bank_transfer', 'Disbursed for Negombo branch operational expenses'),
('ea400003-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ec400003-0000-0000-0000-000000000001', 'EXP-BU2-2026-003', CURRENT_DATE - INTERVAL '6 days', 'Staff Salaries & Overtime - Negombo', 18100.00, 'cash', 'Disbursed for Negombo branch operational expenses'),
('ea400004-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ec400004-0000-0000-0000-000000000001', 'EXP-BU2-2026-004', CURRENT_DATE - INTERVAL '8 days', 'Logistics, Delivery & Fuel - Negombo', 21300.00, 'card', 'Disbursed for Negombo branch operational expenses'),
('ea400005-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ec400005-0000-0000-0000-000000000001', 'EXP-BU2-2026-005', CURRENT_DATE - INTERVAL '10 days', 'Equipment & IT Maintenance - Negombo', 24500.00, 'bank_transfer', 'Disbursed for Negombo branch operational expenses'),
('ea400006-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ec400006-0000-0000-0000-000000000001', 'EXP-BU2-2026-006', CURRENT_DATE - INTERVAL '12 days', 'Marketing & Customer Loyalty - Negombo', 27700.00, 'cash', 'Disbursed for Negombo branch operational expenses'),
('ea400007-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ec400007-0000-0000-0000-000000000001', 'EXP-BU2-2026-007', CURRENT_DATE - INTERVAL '14 days', 'Security & Municipal Taxes - Negombo', 30900.00, 'card', 'Disbursed for Negombo branch operational expenses'),
('ea400008-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ec400008-0000-0000-0000-000000000001', 'EXP-BU2-2026-008', CURRENT_DATE - INTERVAL '16 days', 'Packaging & Consumables - Negombo', 34100.00, 'bank_transfer', 'Disbursed for Negombo branch operational expenses'),
('ea400009-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ec400009-0000-0000-0000-000000000001', 'EXP-BU2-2026-009', CURRENT_DATE - INTERVAL '18 days', 'Accounting & Professional Fees - Negombo', 37300.00, 'cash', 'Disbursed for Negombo branch operational expenses'),
('ea40000a-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ec40000a-0000-0000-0000-000000000001', 'EXP-BU2-2026-010', CURRENT_DATE - INTERVAL '20 days', 'Miscellaneous Operational Contingency - Negombo', 40500.00, 'card', 'Disbursed for Negombo branch operational expenses')
ON CONFLICT (business_id, expense_number) DO NOTHING;

-- 8. ORDERS FOR BU2 (40 Orders)
INSERT INTO orders (id, business_id, order_number, customer_id, status, payment_status, payment_method, subtotal, discount_amount, tax_amount, total_amount, notes, created_at) VALUES
('aa400001-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1001', 'cc400001-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 2850.00, 0.00, 0, 2850.00, 'Order 1 processed in Negombo', NOW() - INTERVAL '4 hours'),
('aa400002-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1002', 'cc400002-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 3200.00, 0.00, 0, 3200.00, 'Order 2 processed in Negombo', NOW() - INTERVAL '8 hours'),
('aa400003-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1003', 'cc400003-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 3550.00, 0.00, 0, 3550.00, 'Order 3 processed in Negombo', NOW() - INTERVAL '12 hours'),
('aa400004-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1004', 'cc400004-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 3900.00, 200.00, 0, 3700.00, 'Order 4 processed in Negombo', NOW() - INTERVAL '16 hours'),
('aa400005-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1005', 'cc400005-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 4250.00, 0.00, 0, 4250.00, 'Order 5 processed in Negombo', NOW() - INTERVAL '20 hours'),
('aa400006-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1006', 'cc400006-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 4600.00, 0.00, 0, 4600.00, 'Order 6 processed in Negombo', NOW() - INTERVAL '24 hours'),
('aa400007-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1007', 'cc400007-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 4950.00, 0.00, 0, 4950.00, 'Order 7 processed in Negombo', NOW() - INTERVAL '28 hours'),
('aa400008-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1008', 'cc400008-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 5300.00, 200.00, 0, 5100.00, 'Order 8 processed in Negombo', NOW() - INTERVAL '32 hours'),
('aa400009-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1009', 'cc400009-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 5650.00, 0.00, 0, 5650.00, 'Order 9 processed in Negombo', NOW() - INTERVAL '36 hours'),
('aa40000a-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1010', 'cc40000a-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 6000.00, 0.00, 0, 6000.00, 'Order 10 processed in Negombo', NOW() - INTERVAL '40 hours'),
('aa40000b-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1011', 'cc40000b-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 6350.00, 0.00, 0, 6350.00, 'Order 11 processed in Negombo', NOW() - INTERVAL '44 hours'),
('aa40000c-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1012', 'cc40000c-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 6700.00, 200.00, 0, 6500.00, 'Order 12 processed in Negombo', NOW() - INTERVAL '48 hours'),
('aa40000d-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1013', 'cc40000d-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 7050.00, 0.00, 0, 7050.00, 'Order 13 processed in Negombo', NOW() - INTERVAL '52 hours'),
('aa40000e-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1014', 'cc40000e-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 7400.00, 0.00, 0, 7400.00, 'Order 14 processed in Negombo', NOW() - INTERVAL '56 hours'),
('aa40000f-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1015', 'cc40000f-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 7750.00, 0.00, 0, 7750.00, 'Order 15 processed in Negombo', NOW() - INTERVAL '60 hours'),
('aa400010-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1016', 'cc400010-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 8100.00, 200.00, 0, 7900.00, 'Order 16 processed in Negombo', NOW() - INTERVAL '64 hours'),
('aa400011-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1017', 'cc400011-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 8450.00, 0.00, 0, 8450.00, 'Order 17 processed in Negombo', NOW() - INTERVAL '68 hours'),
('aa400012-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1018', 'cc400012-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 8800.00, 0.00, 0, 8800.00, 'Order 18 processed in Negombo', NOW() - INTERVAL '72 hours'),
('aa400013-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1019', 'cc400013-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 9150.00, 0.00, 0, 9150.00, 'Order 19 processed in Negombo', NOW() - INTERVAL '76 hours'),
('aa400014-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1020', 'cc400014-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 9500.00, 200.00, 0, 9300.00, 'Order 20 processed in Negombo', NOW() - INTERVAL '80 hours'),
('aa400015-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1021', 'cc400001-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 9850.00, 0.00, 0, 9850.00, 'Order 21 processed in Negombo', NOW() - INTERVAL '84 hours'),
('aa400016-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1022', 'cc400002-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 10200.00, 0.00, 0, 10200.00, 'Order 22 processed in Negombo', NOW() - INTERVAL '88 hours'),
('aa400017-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1023', 'cc400003-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 10550.00, 0.00, 0, 10550.00, 'Order 23 processed in Negombo', NOW() - INTERVAL '92 hours'),
('aa400018-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1024', 'cc400004-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 10900.00, 200.00, 0, 10700.00, 'Order 24 processed in Negombo', NOW() - INTERVAL '96 hours'),
('aa400019-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1025', 'cc400005-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 11250.00, 0.00, 0, 11250.00, 'Order 25 processed in Negombo', NOW() - INTERVAL '100 hours'),
('aa40001a-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1026', 'cc400006-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 11600.00, 0.00, 0, 11600.00, 'Order 26 processed in Negombo', NOW() - INTERVAL '104 hours'),
('aa40001b-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1027', 'cc400007-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 11950.00, 0.00, 0, 11950.00, 'Order 27 processed in Negombo', NOW() - INTERVAL '108 hours'),
('aa40001c-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1028', 'cc400008-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 12300.00, 200.00, 0, 12100.00, 'Order 28 processed in Negombo', NOW() - INTERVAL '112 hours'),
('aa40001d-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1029', 'cc400009-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 12650.00, 0.00, 0, 12650.00, 'Order 29 processed in Negombo', NOW() - INTERVAL '116 hours'),
('aa40001e-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1030', 'cc40000a-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 13000.00, 0.00, 0, 13000.00, 'Order 30 processed in Negombo', NOW() - INTERVAL '120 hours'),
('aa40001f-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1031', 'cc40000b-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 13350.00, 0.00, 0, 13350.00, 'Order 31 processed in Negombo', NOW() - INTERVAL '124 hours'),
('aa400020-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1032', 'cc40000c-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 13700.00, 200.00, 0, 13500.00, 'Order 32 processed in Negombo', NOW() - INTERVAL '128 hours'),
('aa400021-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1033', 'cc40000d-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 14050.00, 0.00, 0, 14050.00, 'Order 33 processed in Negombo', NOW() - INTERVAL '132 hours'),
('aa400022-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1034', 'cc40000e-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 14400.00, 0.00, 0, 14400.00, 'Order 34 processed in Negombo', NOW() - INTERVAL '136 hours'),
('aa400023-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1035', 'cc40000f-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 14750.00, 0.00, 0, 14750.00, 'Order 35 processed in Negombo', NOW() - INTERVAL '140 hours'),
('aa400024-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1036', 'cc400010-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 15100.00, 200.00, 0, 14900.00, 'Order 36 processed in Negombo', NOW() - INTERVAL '144 hours'),
('aa400025-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1037', 'cc400011-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 15450.00, 0.00, 0, 15450.00, 'Order 37 processed in Negombo', NOW() - INTERVAL '148 hours'),
('aa400026-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1038', 'cc400012-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 15800.00, 0.00, 0, 15800.00, 'Order 38 processed in Negombo', NOW() - INTERVAL '152 hours'),
('aa400027-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1039', 'cc400013-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 16150.00, 0.00, 0, 16150.00, 'Order 39 processed in Negombo', NOW() - INTERVAL '156 hours'),
('aa400028-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'ORD-BU2-1040', 'cc400014-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 16500.00, 200.00, 0, 16300.00, 'Order 40 processed in Negombo', NOW() - INTERVAL '160 hours')
ON CONFLICT (business_id, order_number) DO NOTHING;

-- 9. ORDER ITEMS FOR BU2
INSERT INTO order_items (id, business_id, order_id, product_id, quantity, unit_price, cost_price, discount_amount, total_price) VALUES
('bb400001-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400001-0000-0000-0000-000000000001', 'da400001-0000-0000-0000-000000000001', 2, 900.00, 635.00, 0, 1800.00),
('bb400002-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400002-0000-0000-0000-000000000001', 'da400002-0000-0000-0000-000000000001', 2, 950.00, 670.00, 0, 1900.00),
('bb400003-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400003-0000-0000-0000-000000000001', 'da400003-0000-0000-0000-000000000001', 2, 1000.00, 705.00, 0, 2000.00),
('bb400004-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400004-0000-0000-0000-000000000001', 'da400004-0000-0000-0000-000000000001', 2, 1050.00, 740.00, 0, 2100.00),
('bb400005-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400005-0000-0000-0000-000000000001', 'da400005-0000-0000-0000-000000000001', 2, 1100.00, 775.00, 0, 2200.00),
('bb400006-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400006-0000-0000-0000-000000000001', 'da400006-0000-0000-0000-000000000001', 2, 1150.00, 810.00, 0, 2300.00),
('bb400007-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400007-0000-0000-0000-000000000001', 'da400007-0000-0000-0000-000000000001', 2, 1200.00, 845.00, 0, 2400.00),
('bb400008-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400008-0000-0000-0000-000000000001', 'da400008-0000-0000-0000-000000000001', 2, 1250.00, 880.00, 0, 2500.00),
('bb400009-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400009-0000-0000-0000-000000000001', 'da400009-0000-0000-0000-000000000001', 2, 1300.00, 915.00, 0, 2600.00),
('bb40000a-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa40000a-0000-0000-0000-000000000001', 'da40000a-0000-0000-0000-000000000001', 2, 1350.00, 950.00, 0, 2700.00),
('bb40000b-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa40000b-0000-0000-0000-000000000001', 'da40000b-0000-0000-0000-000000000001', 2, 1400.00, 985.00, 0, 2800.00),
('bb40000c-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa40000c-0000-0000-0000-000000000001', 'da40000c-0000-0000-0000-000000000001', 2, 1450.00, 1020.00, 0, 2900.00),
('bb40000d-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa40000d-0000-0000-0000-000000000001', 'da40000d-0000-0000-0000-000000000001', 2, 1500.00, 1055.00, 0, 3000.00),
('bb40000e-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa40000e-0000-0000-0000-000000000001', 'da40000e-0000-0000-0000-000000000001', 2, 1550.00, 1090.00, 0, 3100.00),
('bb40000f-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa40000f-0000-0000-0000-000000000001', 'da40000f-0000-0000-0000-000000000001', 2, 1600.00, 1125.00, 0, 3200.00),
('bb400010-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400010-0000-0000-0000-000000000001', 'da400010-0000-0000-0000-000000000001', 2, 1650.00, 1160.00, 0, 3300.00),
('bb400011-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400011-0000-0000-0000-000000000001', 'da400011-0000-0000-0000-000000000001', 2, 1700.00, 1195.00, 0, 3400.00),
('bb400012-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400012-0000-0000-0000-000000000001', 'da400012-0000-0000-0000-000000000001', 2, 1750.00, 1230.00, 0, 3500.00),
('bb400013-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400013-0000-0000-0000-000000000001', 'da400013-0000-0000-0000-000000000001', 2, 1800.00, 1265.00, 0, 3600.00),
('bb400014-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400014-0000-0000-0000-000000000001', 'da400014-0000-0000-0000-000000000001', 2, 1850.00, 1300.00, 0, 3700.00),
('bb400015-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400015-0000-0000-0000-000000000001', 'da400015-0000-0000-0000-000000000001', 2, 1900.00, 1335.00, 0, 3800.00),
('bb400016-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400016-0000-0000-0000-000000000001', 'da400016-0000-0000-0000-000000000001', 2, 1950.00, 1370.00, 0, 3900.00),
('bb400017-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400017-0000-0000-0000-000000000001', 'da400017-0000-0000-0000-000000000001', 2, 2000.00, 1405.00, 0, 4000.00),
('bb400018-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400018-0000-0000-0000-000000000001', 'da400018-0000-0000-0000-000000000001', 2, 2050.00, 1440.00, 0, 4100.00),
('bb400019-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400019-0000-0000-0000-000000000001', 'da400019-0000-0000-0000-000000000001', 2, 2100.00, 1475.00, 0, 4200.00),
('bb40001a-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa40001a-0000-0000-0000-000000000001', 'da40001a-0000-0000-0000-000000000001', 2, 2150.00, 1510.00, 0, 4300.00),
('bb40001b-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa40001b-0000-0000-0000-000000000001', 'da40001b-0000-0000-0000-000000000001', 2, 2200.00, 1545.00, 0, 4400.00),
('bb40001c-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa40001c-0000-0000-0000-000000000001', 'da40001c-0000-0000-0000-000000000001', 2, 2250.00, 1580.00, 0, 4500.00),
('bb40001d-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa40001d-0000-0000-0000-000000000001', 'da40001d-0000-0000-0000-000000000001', 2, 2300.00, 1615.00, 0, 4600.00),
('bb40001e-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa40001e-0000-0000-0000-000000000001', 'da40001e-0000-0000-0000-000000000001', 2, 2350.00, 1650.00, 0, 4700.00),
('bb40001f-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa40001f-0000-0000-0000-000000000001', 'da400001-0000-0000-0000-000000000001', 2, 2400.00, 1685.00, 0, 4800.00),
('bb400020-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400020-0000-0000-0000-000000000001', 'da400002-0000-0000-0000-000000000001', 2, 2450.00, 1720.00, 0, 4900.00),
('bb400021-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400021-0000-0000-0000-000000000001', 'da400003-0000-0000-0000-000000000001', 2, 2500.00, 1755.00, 0, 5000.00),
('bb400022-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400022-0000-0000-0000-000000000001', 'da400004-0000-0000-0000-000000000001', 2, 2550.00, 1790.00, 0, 5100.00),
('bb400023-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400023-0000-0000-0000-000000000001', 'da400005-0000-0000-0000-000000000001', 2, 2600.00, 1825.00, 0, 5200.00),
('bb400024-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400024-0000-0000-0000-000000000001', 'da400006-0000-0000-0000-000000000001', 2, 2650.00, 1860.00, 0, 5300.00),
('bb400025-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400025-0000-0000-0000-000000000001', 'da400007-0000-0000-0000-000000000001', 2, 2700.00, 1895.00, 0, 5400.00),
('bb400026-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400026-0000-0000-0000-000000000001', 'da400008-0000-0000-0000-000000000001', 2, 2750.00, 1930.00, 0, 5500.00),
('bb400027-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400027-0000-0000-0000-000000000001', 'da400009-0000-0000-0000-000000000001', 2, 2800.00, 1965.00, 0, 5600.00),
('bb400028-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400028-0000-0000-0000-000000000001', 'da40000a-0000-0000-0000-000000000001', 2, 2850.00, 2000.00, 0, 5700.00)
ON CONFLICT (id) DO NOTHING;

-- 10. INVOICES FOR BU2 (15 Invoices)
INSERT INTO invoices (id, business_id, order_id, customer_id, invoice_number, issue_date, due_date, subtotal, discount_amount, tax_amount, total_amount, paid_amount, balance_amount, status, notes) VALUES
('ba400001-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400001-0000-0000-0000-000000000001', 'cc400001-0000-0000-0000-000000000001', 'HA-INV-40101', CURRENT_DATE - INTERVAL '1 days', CURRENT_DATE + INTERVAL '13 days', 4800.00, 0, 0, 4800.00, 4800.00, 0, 'paid', 'Official VAT Receipt 1'),
('ba400002-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400002-0000-0000-0000-000000000001', 'cc400002-0000-0000-0000-000000000001', 'HA-INV-40102', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '12 days', 5400.00, 0, 0, 5400.00, 5400.00, 0, 'paid', 'Official VAT Receipt 2'),
('ba400003-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400003-0000-0000-0000-000000000001', 'cc400003-0000-0000-0000-000000000001', 'HA-INV-40103', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '11 days', 6000.00, 0, 0, 6000.00, 6000.00, 0, 'paid', 'Official VAT Receipt 3'),
('ba400004-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400004-0000-0000-0000-000000000001', 'cc400004-0000-0000-0000-000000000001', 'HA-INV-40104', CURRENT_DATE - INTERVAL '4 days', CURRENT_DATE + INTERVAL '10 days', 6600.00, 0, 0, 6600.00, 6600.00, 0, 'paid', 'Official VAT Receipt 4'),
('ba400005-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400005-0000-0000-0000-000000000001', 'cc400005-0000-0000-0000-000000000001', 'HA-INV-40105', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '9 days', 7200.00, 0, 0, 7200.00, 7200.00, 0, 'paid', 'Official VAT Receipt 5'),
('ba400006-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400006-0000-0000-0000-000000000001', 'cc400006-0000-0000-0000-000000000001', 'HA-INV-40106', CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE + INTERVAL '8 days', 7800.00, 0, 0, 7800.00, 7800.00, 0, 'paid', 'Official VAT Receipt 6'),
('ba400007-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400007-0000-0000-0000-000000000001', 'cc400007-0000-0000-0000-000000000001', 'HA-INV-40107', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE + INTERVAL '7 days', 8400.00, 0, 0, 8400.00, 8400.00, 0, 'paid', 'Official VAT Receipt 7'),
('ba400008-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400008-0000-0000-0000-000000000001', 'cc400008-0000-0000-0000-000000000001', 'HA-INV-40108', CURRENT_DATE - INTERVAL '8 days', CURRENT_DATE + INTERVAL '6 days', 9000.00, 0, 0, 9000.00, 9000.00, 0, 'paid', 'Official VAT Receipt 8'),
('ba400009-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa400009-0000-0000-0000-000000000001', 'cc400009-0000-0000-0000-000000000001', 'HA-INV-40109', CURRENT_DATE - INTERVAL '9 days', CURRENT_DATE + INTERVAL '5 days', 9600.00, 0, 0, 9600.00, 9600.00, 0, 'paid', 'Official VAT Receipt 9'),
('ba40000a-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa40000a-0000-0000-0000-000000000001', 'cc40000a-0000-0000-0000-000000000001', 'HA-INV-40110', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '4 days', 10200.00, 0, 0, 10200.00, 10200.00, 0, 'paid', 'Official VAT Receipt 10'),
('ba40000b-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa40000b-0000-0000-0000-000000000001', 'cc40000b-0000-0000-0000-000000000001', 'HA-INV-40111', CURRENT_DATE - INTERVAL '11 days', CURRENT_DATE + INTERVAL '3 days', 10800.00, 0, 0, 10800.00, 10800.00, 0, 'paid', 'Official VAT Receipt 11'),
('ba40000c-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa40000c-0000-0000-0000-000000000001', 'cc40000c-0000-0000-0000-000000000001', 'HA-INV-40112', CURRENT_DATE - INTERVAL '12 days', CURRENT_DATE + INTERVAL '2 days', 11400.00, 0, 0, 11400.00, 11400.00, 0, 'paid', 'Official VAT Receipt 12'),
('ba40000d-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa40000d-0000-0000-0000-000000000001', 'cc40000d-0000-0000-0000-000000000001', 'HA-INV-40113', CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE + INTERVAL '1 days', 12000.00, 0, 0, 12000.00, 12000.00, 0, 'paid', 'Official VAT Receipt 13'),
('ba40000e-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa40000e-0000-0000-0000-000000000001', 'cc40000e-0000-0000-0000-000000000001', 'HA-INV-40114', CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE + INTERVAL '0 days', 12600.00, 0, 0, 12600.00, 12600.00, 0, 'paid', 'Official VAT Receipt 14'),
('ba40000f-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000004', 'aa40000f-0000-0000-0000-000000000001', 'cc40000f-0000-0000-0000-000000000001', 'HA-INV-40115', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '-1 days', 13200.00, 0, 0, 13200.00, 13200.00, 0, 'paid', 'Official VAT Receipt 15')
ON CONFLICT (business_id, invoice_number) DO NOTHING;


-- ============================================================
-- WORKSPACE P1: DEMO_PREMIUM_01 - Apex Enterprise Holdings (Colombo)
-- ============================================================

-- 1. CATEGORIES FOR P1
INSERT INTO categories (id, business_id, name, slug, description, image_url) VALUES
('ca500001-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Beverages & Refreshments', 'cat-p1-1', 'Beverages & Refreshments for Colombo branch', '/demo-assets/categories/cat-1.webp'),
('ca500002-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Rice, Grains & Pulses', 'cat-p1-2', 'Rice, Grains & Pulses for Colombo branch', '/demo-assets/categories/cat-2.webp'),
('ca500003-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Spices, Herbs & Seasoning', 'cat-p1-3', 'Spices, Herbs & Seasoning for Colombo branch', '/demo-assets/categories/cat-3.webp'),
('ca500004-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Bakery & Confectionery', 'cat-p1-4', 'Bakery & Confectionery for Colombo branch', '/demo-assets/categories/cat-4.webp'),
('ca500005-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Dairy, Eggs & Butter', 'cat-p1-5', 'Dairy, Eggs & Butter for Colombo branch', '/demo-assets/categories/cat-5.webp'),
('ca500006-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Snacks & Crisps', 'cat-p1-6', 'Snacks & Crisps for Colombo branch', '/demo-assets/categories/cat-6.webp'),
('ca500007-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Household Cleaning & Laundry', 'cat-p1-7', 'Household Cleaning & Laundry for Colombo branch', '/demo-assets/categories/cat-7.webp'),
('ca500008-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Personal Care & Toiletries', 'cat-p1-8', 'Personal Care & Toiletries for Colombo branch', '/demo-assets/categories/cat-8.webp'),
('ca500009-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Stationery & Office Supplies', 'cat-p1-9', 'Stationery & Office Supplies for Colombo branch', '/demo-assets/categories/cat-9.webp'),
('ca50000a-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Fresh Produce & Essentials', 'cat-p1-10', 'Fresh Produce & Essentials for Colombo branch', '/demo-assets/categories/cat-10.webp')
ON CONFLICT (business_id, slug) DO NOTHING;

-- 2. PRODUCTS FOR P1 (30 Products)
INSERT INTO products (id, business_id, category_id, name, sku, barcode, description, cost_price, selling_price, stock_quantity, min_stock_level, image_url, status) VALUES
('da500001-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ca500001-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P1 #1', 'SKU-P1-001', '79357500001', 'Commercial Grade Item 1 for DEMO_PREMIUM_01 - Apex Enterprise Holdings', 295.00, 400.00, 22, 8, '/demo-assets/products/prod-2.webp', 'active'),
('da500002-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ca500002-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P1 #2', 'SKU-P1-002', '79357500002', 'Commercial Grade Item 2 for DEMO_PREMIUM_01 - Apex Enterprise Holdings', 340.00, 460.00, 29, 8, '/demo-assets/products/prod-3.webp', 'active'),
('da500003-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ca500003-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P1 #3', 'SKU-P1-003', '79357500003', 'Commercial Grade Item 3 for DEMO_PREMIUM_01 - Apex Enterprise Holdings', 385.00, 520.00, 36, 8, '/demo-assets/products/prod-4.webp', 'active'),
('da500004-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ca500004-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P1 #4', 'SKU-P1-004', '79357500004', 'Commercial Grade Item 4 for DEMO_PREMIUM_01 - Apex Enterprise Holdings', 430.00, 580.00, 43, 8, '/demo-assets/products/prod-5.webp', 'active'),
('da500005-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ca500005-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P1 #5', 'SKU-P1-005', '79357500005', 'Commercial Grade Item 5 for DEMO_PREMIUM_01 - Apex Enterprise Holdings', 475.00, 640.00, 50, 8, '/demo-assets/products/prod-6.webp', 'active'),
('da500006-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ca500006-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P1 #6', 'SKU-P1-006', '79357500006', 'Commercial Grade Item 6 for DEMO_PREMIUM_01 - Apex Enterprise Holdings', 520.00, 700.00, 57, 8, '/demo-assets/products/prod-7.webp', 'active'),
('da500007-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ca500007-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P1 #7', 'SKU-P1-007', '79357500007', 'Commercial Grade Item 7 for DEMO_PREMIUM_01 - Apex Enterprise Holdings', 565.00, 760.00, 64, 8, '/demo-assets/products/prod-8.webp', 'active'),
('da500008-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ca500008-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P1 #8', 'SKU-P1-008', '79357500008', 'Commercial Grade Item 8 for DEMO_PREMIUM_01 - Apex Enterprise Holdings', 610.00, 820.00, 71, 8, '/demo-assets/products/prod-9.webp', 'active'),
('da500009-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ca500009-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P1 #9', 'SKU-P1-009', '79357500009', 'Commercial Grade Item 9 for DEMO_PREMIUM_01 - Apex Enterprise Holdings', 655.00, 880.00, 78, 8, '/demo-assets/products/prod-10.webp', 'active'),
('da50000a-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ca50000a-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P1 #10', 'SKU-P1-010', '79357500010', 'Commercial Grade Item 10 for DEMO_PREMIUM_01 - Apex Enterprise Holdings', 700.00, 950.00, 20, 8, '/demo-assets/products/prod-1.webp', 'active'),
('da50000b-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ca500001-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P1 #11', 'SKU-P1-011', '79357500011', 'Commercial Grade Item 11 for DEMO_PREMIUM_01 - Apex Enterprise Holdings', 745.00, 1010.00, 27, 8, '/demo-assets/products/prod-2.webp', 'active'),
('da50000c-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ca500002-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P1 #12', 'SKU-P1-012', '79357500012', 'Commercial Grade Item 12 for DEMO_PREMIUM_01 - Apex Enterprise Holdings', 790.00, 1070.00, 34, 8, '/demo-assets/products/prod-3.webp', 'active'),
('da50000d-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ca500003-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P1 #13', 'SKU-P1-013', '79357500013', 'Commercial Grade Item 13 for DEMO_PREMIUM_01 - Apex Enterprise Holdings', 835.00, 1130.00, 41, 8, '/demo-assets/products/prod-4.webp', 'active'),
('da50000e-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ca500004-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P1 #14', 'SKU-P1-014', '79357500014', 'Commercial Grade Item 14 for DEMO_PREMIUM_01 - Apex Enterprise Holdings', 880.00, 1190.00, 48, 8, '/demo-assets/products/prod-5.webp', 'active'),
('da50000f-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ca500005-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P1 #15', 'SKU-P1-015', '79357500015', 'Commercial Grade Item 15 for DEMO_PREMIUM_01 - Apex Enterprise Holdings', 925.00, 1250.00, 55, 8, '/demo-assets/products/prod-6.webp', 'active'),
('da500010-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ca500006-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P1 #16', 'SKU-P1-016', '79357500016', 'Commercial Grade Item 16 for DEMO_PREMIUM_01 - Apex Enterprise Holdings', 970.00, 1310.00, 62, 8, '/demo-assets/products/prod-7.webp', 'active'),
('da500011-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ca500007-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P1 #17', 'SKU-P1-017', '79357500017', 'Commercial Grade Item 17 for DEMO_PREMIUM_01 - Apex Enterprise Holdings', 1015.00, 1370.00, 69, 8, '/demo-assets/products/prod-8.webp', 'active'),
('da500012-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ca500008-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P1 #18', 'SKU-P1-018', '79357500018', 'Commercial Grade Item 18 for DEMO_PREMIUM_01 - Apex Enterprise Holdings', 1060.00, 1430.00, 76, 8, '/demo-assets/products/prod-9.webp', 'active'),
('da500013-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ca500009-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P1 #19', 'SKU-P1-019', '79357500019', 'Commercial Grade Item 19 for DEMO_PREMIUM_01 - Apex Enterprise Holdings', 1105.00, 1490.00, 18, 8, '/demo-assets/products/prod-10.webp', 'active'),
('da500014-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ca50000a-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P1 #20', 'SKU-P1-020', '79357500020', 'Commercial Grade Item 20 for DEMO_PREMIUM_01 - Apex Enterprise Holdings', 1150.00, 1550.00, 25, 8, '/demo-assets/products/prod-1.webp', 'active'),
('da500015-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ca500001-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P1 #21', 'SKU-P1-021', '79357500021', 'Commercial Grade Item 21 for DEMO_PREMIUM_01 - Apex Enterprise Holdings', 1195.00, 1610.00, 32, 8, '/demo-assets/products/prod-2.webp', 'active'),
('da500016-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ca500002-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P1 #22', 'SKU-P1-022', '79357500022', 'Commercial Grade Item 22 for DEMO_PREMIUM_01 - Apex Enterprise Holdings', 1240.00, 1670.00, 39, 8, '/demo-assets/products/prod-3.webp', 'active'),
('da500017-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ca500003-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P1 #23', 'SKU-P1-023', '79357500023', 'Commercial Grade Item 23 for DEMO_PREMIUM_01 - Apex Enterprise Holdings', 1285.00, 1730.00, 46, 8, '/demo-assets/products/prod-4.webp', 'active'),
('da500018-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ca500004-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P1 #24', 'SKU-P1-024', '79357500024', 'Commercial Grade Item 24 for DEMO_PREMIUM_01 - Apex Enterprise Holdings', 1330.00, 1800.00, 53, 8, '/demo-assets/products/prod-5.webp', 'active'),
('da500019-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ca500005-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P1 #25', 'SKU-P1-025', '79357500025', 'Commercial Grade Item 25 for DEMO_PREMIUM_01 - Apex Enterprise Holdings', 1375.00, 1860.00, 60, 8, '/demo-assets/products/prod-6.webp', 'active'),
('da50001a-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ca500006-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P1 #26', 'SKU-P1-026', '79357500026', 'Commercial Grade Item 26 for DEMO_PREMIUM_01 - Apex Enterprise Holdings', 1420.00, 1920.00, 67, 8, '/demo-assets/products/prod-7.webp', 'active'),
('da50001b-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ca500007-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P1 #27', 'SKU-P1-027', '79357500027', 'Commercial Grade Item 27 for DEMO_PREMIUM_01 - Apex Enterprise Holdings', 1465.00, 1980.00, 74, 8, '/demo-assets/products/prod-8.webp', 'active'),
('da50001c-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ca500008-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P1 #28', 'SKU-P1-028', '79357500028', 'Commercial Grade Item 28 for DEMO_PREMIUM_01 - Apex Enterprise Holdings', 1510.00, 2040.00, 16, 8, '/demo-assets/products/prod-9.webp', 'active'),
('da50001d-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ca500009-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P1 #29', 'SKU-P1-029', '79357500029', 'Commercial Grade Item 29 for DEMO_PREMIUM_01 - Apex Enterprise Holdings', 1555.00, 2100.00, 23, 8, '/demo-assets/products/prod-10.webp', 'active'),
('da50001e-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ca50000a-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P1 #30', 'SKU-P1-030', '79357500030', 'Commercial Grade Item 30 for DEMO_PREMIUM_01 - Apex Enterprise Holdings', 1600.00, 2160.00, 30, 8, '/demo-assets/products/prod-1.webp', 'active')
ON CONFLICT (business_id, sku) DO NOTHING;

-- 3. INVENTORY FOR P1
INSERT INTO inventory (business_id, product_id, quantity, reserved_quantity, location)
SELECT business_id, id, stock_quantity, 0, 'Colombo Main Store'
FROM products WHERE business_id = 'a5000000-0000-0000-0000-000000000005'
ON CONFLICT (business_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- 4. CUSTOMERS FOR P1 (20 Customers)
INSERT INTO customers (id, business_id, name, phone, email, address, total_purchases, total_orders, outstanding_balance, last_purchase_at) VALUES
('cc500001-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Sunil Jayawardena', '+94 77 234 5678', 'sunil.j.p1@gmail.com', '142 Havelock Road, Colombo', 14400.00, 4, 0.00, NOW() - INTERVAL '1 days'),
('cc500002-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Kumari Alwis', '+94 71 876 5432', 'kumari.alwis.p1@gmail.com', '56 Rajagiriya Road, Colombo', 16800.00, 5, 0.00, NOW() - INTERVAL '2 days'),
('cc500003-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Mohamed Rizwan', '+94 76 543 2198', 'm.rizwan.trading.p1@gmail.com', '88 Keyzer Street, Pettah, Colombo', 19200.00, 6, 0.00, NOW() - INTERVAL '3 days'),
('cc500004-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Priyantha Gunasekara', '+94 77 654 3210', 'priyantha.guna.p1@gmail.com', '23 Temple Road, Nugegoda, Colombo', 21600.00, 7, 0.00, NOW() - INTERVAL '4 days'),
('cc500005-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Chamari Dissanayake', '+94 72 345 6789', 'chamari.d.p1@gmail.com', '77 Stanley Tillakaratne Mawatha, Colombo', 24000.00, 8, 3750.00, NOW() - INTERVAL '5 days'),
('cc500006-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Siva Subramaniam', '+94 77 889 9001', 'siva.subra.p1@gmail.com', '12 Sea Street, Colombo', 26400.00, 9, 0.00, NOW() - INTERVAL '6 days'),
('cc500007-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Anushka Bandara', '+94 75 112 2334', 'anushka.b.p1@gmail.com', '98 High Level Road, Maharagama, Colombo', 28800.00, 10, 0.00, NOW() - INTERVAL '7 days'),
('cc500008-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Malik Mansoor', '+94 77 998 8776', 'malik.mansoor.p1@gmail.com', '34 Wekande Road, Colombo', 31200.00, 11, 0.00, NOW() - INTERVAL '8 days'),
('cc500009-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Kavindi Senaratne', '+94 71 445 5667', 'kavindi.sena.p1@gmail.com', '5 Anderson Road, Dehiwala, Colombo', 33600.00, 12, 0.00, NOW() - INTERVAL '9 days'),
('cc50000a-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Dinesh Samarawickrama', '+94 70 334 4556', 'dinesh.sam.p1@gmail.com', '19 Galle Road, Mount Lavinia, Colombo', 36000.00, 13, 7500.00, NOW() - INTERVAL '10 days'),
('cc50000b-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Shalini Weerasinghe', '+94 77 667 7889', 'shalini.w.p1@gmail.com', '40 Duplication Road, Colombo', 38400.00, 14, 0.00, NOW() - INTERVAL '11 days'),
('cc50000c-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Ruwan Edirisinghe', '+94 76 778 8990', 'ruwan.ediri.p1@gmail.com', '62 Baseline Road, Dematagoda, Colombo', 40800.00, 15, 0.00, NOW() - INTERVAL '12 days'),
('cc50000d-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Thilini Fonseka', '+94 71 223 3445', 'thilini.fonseka.p1@gmail.com', '110 Hospital Road, Kalubowila, Colombo', 43200.00, 16, 0.00, NOW() - INTERVAL '13 days'),
('cc50000e-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Asanka Karunaratne', '+94 78 556 6778', 'asanka.k.p1@gmail.com', '85 Sri Saranankara Road, Colombo', 45600.00, 17, 0.00, NOW() - INTERVAL '14 days'),
('cc50000f-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Fathima Zeenath', '+94 77 443 3221', 'zeenath.fathima.p1@gmail.com', '27 Maligawatta Place, Colombo', 48000.00, 3, 11250.00, NOW() - INTERVAL '15 days'),
('cc500010-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Pradeep Kumara', '+94 70 889 9002', 'pradeep.kumara.p1@gmail.com', '14 Negombo Road, Peliyagoda, Colombo', 50400.00, 4, 0.00, NOW() - INTERVAL '16 days'),
('cc500011-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Hiruni Rathnayake', '+94 77 119 9228', 'hiruni.rathna.p1@gmail.com', '73 Nawala Road, Colombo', 52800.00, 5, 0.00, NOW() - INTERVAL '17 days'),
('cc500012-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Mahesh Wickramasinghe', '+94 76 123 9876', 'mahesh.wick.p1@gmail.com', '29 Jubilee Post, Mirihana, Colombo', 55200.00, 6, 0.00, NOW() - INTERVAL '18 days'),
('cc500013-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Nimanthi Abeysekera', '+94 71 990 0112', 'nimanthi.a.p1@gmail.com', '91 Pagoda Road, Nugegoda, Colombo', 57600.00, 7, 0.00, NOW() - INTERVAL '19 days'),
('cc500014-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Roshan Liyanage', '+94 77 554 4332', 'roshan.liya.p1@gmail.com', '52 Old Kesbewa Road, Colombo', 60000.00, 8, 15000.00, NOW() - INTERVAL '20 days')
ON CONFLICT (id) DO NOTHING;

-- 5. EMPLOYEES FOR P1 (6 Employees)
INSERT INTO employees (id, business_id, employee_id_number, name, email, phone, position, department, salary, join_date, status, avatar_url) VALUES
('ee500001-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'EMP-001-P1', 'Kasun Perera', 'kasun.perera.p1@harshapex.lk', '+94 77 411 4512', 'Owner & General Director', 'Executive', 220000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-1.webp'),
('ee500002-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'EMP-002-P1', 'Buddhika Senanayake', 'buddhika.senanayake.p1@harshapex.lk', '+94 77 412 4522', 'Operations General Manager', 'Operations', 140000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-2.webp'),
('ee500003-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'EMP-003-P1', 'Sanduni Wijeratne', 'sanduni.wijeratne.p1@harshapex.lk', '+94 77 413 4532', 'Head of Sales & Billing', 'Sales', 85000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-3.webp'),
('ee500004-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'EMP-004-P1', 'Nuwan Jayalath', 'nuwan.jayalath.p1@harshapex.lk', '+94 77 414 4542', 'Inventory & Logistics Lead', 'Logistics', 90000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-4.webp'),
('ee500005-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'EMP-005-P1', 'Kavinda Maduranga', 'kavinda.maduranga.p1@harshapex.lk', '+94 77 415 4552', 'Senior Counter Cashier', 'Sales', 65000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-5.webp'),
('ee500006-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'EMP-006-P1', 'Dharshani Mendis', 'dharshani.mendis.p1@harshapex.lk', '+94 77 416 4562', 'Financial Analyst & Accounts', 'Finance', 105000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-6.webp')
ON CONFLICT (business_id, employee_id_number) DO NOTHING;

-- 6. EXPENSE CATEGORIES FOR P1
INSERT INTO expense_categories (id, business_id, name, description) VALUES
('ec500001-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Store & Office Rent', 'Monthly commercial premises lease'),
('ec500002-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Electricity & Water Utilities', 'CEB & commercial utilities'),
('ec500003-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Staff Salaries & Overtime', 'Monthly payroll disbursements'),
('ec500004-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Logistics, Delivery & Fuel', 'Fleet fuel and transport charges'),
('ec500005-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Equipment & IT Maintenance', 'Hardware, thermal rolls, and network maintenance'),
('ec500006-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Marketing & Customer Loyalty', 'Promotional campaigns and SMS alerts'),
('ec500007-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Security & Municipal Taxes', 'Premises security and local council rates'),
('ec500008-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Packaging & Consumables', 'Eco bags, boxes, and parcel wrap'),
('ec500009-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Accounting & Professional Fees', 'Auditing, secretarial and legal retainer'),
('ec50000a-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'Miscellaneous Operational Contingency', 'Store daily operational petty expenses')
ON CONFLICT (business_id, name) DO NOTHING;

-- 7. EXPENSES FOR P1 (10 Expenses)
INSERT INTO expenses (id, business_id, category_id, expense_number, expense_date, description, amount, payment_method, notes) VALUES
('ea500001-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ec500001-0000-0000-0000-000000000001', 'EXP-P1-2026-001', CURRENT_DATE - INTERVAL '2 days', 'Store & Office Rent - Colombo', 11700.00, 'card', 'Disbursed for Colombo branch operational expenses'),
('ea500002-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ec500002-0000-0000-0000-000000000001', 'EXP-P1-2026-002', CURRENT_DATE - INTERVAL '4 days', 'Electricity & Water Utilities - Colombo', 14900.00, 'bank_transfer', 'Disbursed for Colombo branch operational expenses'),
('ea500003-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ec500003-0000-0000-0000-000000000001', 'EXP-P1-2026-003', CURRENT_DATE - INTERVAL '6 days', 'Staff Salaries & Overtime - Colombo', 18100.00, 'cash', 'Disbursed for Colombo branch operational expenses'),
('ea500004-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ec500004-0000-0000-0000-000000000001', 'EXP-P1-2026-004', CURRENT_DATE - INTERVAL '8 days', 'Logistics, Delivery & Fuel - Colombo', 21300.00, 'card', 'Disbursed for Colombo branch operational expenses'),
('ea500005-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ec500005-0000-0000-0000-000000000001', 'EXP-P1-2026-005', CURRENT_DATE - INTERVAL '10 days', 'Equipment & IT Maintenance - Colombo', 24500.00, 'bank_transfer', 'Disbursed for Colombo branch operational expenses'),
('ea500006-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ec500006-0000-0000-0000-000000000001', 'EXP-P1-2026-006', CURRENT_DATE - INTERVAL '12 days', 'Marketing & Customer Loyalty - Colombo', 27700.00, 'cash', 'Disbursed for Colombo branch operational expenses'),
('ea500007-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ec500007-0000-0000-0000-000000000001', 'EXP-P1-2026-007', CURRENT_DATE - INTERVAL '14 days', 'Security & Municipal Taxes - Colombo', 30900.00, 'card', 'Disbursed for Colombo branch operational expenses'),
('ea500008-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ec500008-0000-0000-0000-000000000001', 'EXP-P1-2026-008', CURRENT_DATE - INTERVAL '16 days', 'Packaging & Consumables - Colombo', 34100.00, 'bank_transfer', 'Disbursed for Colombo branch operational expenses'),
('ea500009-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ec500009-0000-0000-0000-000000000001', 'EXP-P1-2026-009', CURRENT_DATE - INTERVAL '18 days', 'Accounting & Professional Fees - Colombo', 37300.00, 'cash', 'Disbursed for Colombo branch operational expenses'),
('ea50000a-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ec50000a-0000-0000-0000-000000000001', 'EXP-P1-2026-010', CURRENT_DATE - INTERVAL '20 days', 'Miscellaneous Operational Contingency - Colombo', 40500.00, 'card', 'Disbursed for Colombo branch operational expenses')
ON CONFLICT (business_id, expense_number) DO NOTHING;

-- 8. ORDERS FOR P1 (40 Orders)
INSERT INTO orders (id, business_id, order_number, customer_id, status, payment_status, payment_method, subtotal, discount_amount, tax_amount, total_amount, notes, created_at) VALUES
('aa500001-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1001', 'cc500001-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 2850.00, 0.00, 0, 2850.00, 'Order 1 processed in Colombo', NOW() - INTERVAL '4 hours'),
('aa500002-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1002', 'cc500002-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 3200.00, 0.00, 0, 3200.00, 'Order 2 processed in Colombo', NOW() - INTERVAL '8 hours'),
('aa500003-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1003', 'cc500003-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 3550.00, 0.00, 0, 3550.00, 'Order 3 processed in Colombo', NOW() - INTERVAL '12 hours'),
('aa500004-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1004', 'cc500004-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 3900.00, 200.00, 0, 3700.00, 'Order 4 processed in Colombo', NOW() - INTERVAL '16 hours'),
('aa500005-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1005', 'cc500005-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 4250.00, 0.00, 0, 4250.00, 'Order 5 processed in Colombo', NOW() - INTERVAL '20 hours'),
('aa500006-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1006', 'cc500006-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 4600.00, 0.00, 0, 4600.00, 'Order 6 processed in Colombo', NOW() - INTERVAL '24 hours'),
('aa500007-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1007', 'cc500007-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 4950.00, 0.00, 0, 4950.00, 'Order 7 processed in Colombo', NOW() - INTERVAL '28 hours'),
('aa500008-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1008', 'cc500008-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 5300.00, 200.00, 0, 5100.00, 'Order 8 processed in Colombo', NOW() - INTERVAL '32 hours'),
('aa500009-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1009', 'cc500009-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 5650.00, 0.00, 0, 5650.00, 'Order 9 processed in Colombo', NOW() - INTERVAL '36 hours'),
('aa50000a-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1010', 'cc50000a-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 6000.00, 0.00, 0, 6000.00, 'Order 10 processed in Colombo', NOW() - INTERVAL '40 hours'),
('aa50000b-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1011', 'cc50000b-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 6350.00, 0.00, 0, 6350.00, 'Order 11 processed in Colombo', NOW() - INTERVAL '44 hours'),
('aa50000c-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1012', 'cc50000c-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 6700.00, 200.00, 0, 6500.00, 'Order 12 processed in Colombo', NOW() - INTERVAL '48 hours'),
('aa50000d-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1013', 'cc50000d-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 7050.00, 0.00, 0, 7050.00, 'Order 13 processed in Colombo', NOW() - INTERVAL '52 hours'),
('aa50000e-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1014', 'cc50000e-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 7400.00, 0.00, 0, 7400.00, 'Order 14 processed in Colombo', NOW() - INTERVAL '56 hours'),
('aa50000f-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1015', 'cc50000f-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 7750.00, 0.00, 0, 7750.00, 'Order 15 processed in Colombo', NOW() - INTERVAL '60 hours'),
('aa500010-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1016', 'cc500010-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 8100.00, 200.00, 0, 7900.00, 'Order 16 processed in Colombo', NOW() - INTERVAL '64 hours'),
('aa500011-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1017', 'cc500011-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 8450.00, 0.00, 0, 8450.00, 'Order 17 processed in Colombo', NOW() - INTERVAL '68 hours'),
('aa500012-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1018', 'cc500012-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 8800.00, 0.00, 0, 8800.00, 'Order 18 processed in Colombo', NOW() - INTERVAL '72 hours'),
('aa500013-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1019', 'cc500013-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 9150.00, 0.00, 0, 9150.00, 'Order 19 processed in Colombo', NOW() - INTERVAL '76 hours'),
('aa500014-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1020', 'cc500014-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 9500.00, 200.00, 0, 9300.00, 'Order 20 processed in Colombo', NOW() - INTERVAL '80 hours'),
('aa500015-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1021', 'cc500001-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 9850.00, 0.00, 0, 9850.00, 'Order 21 processed in Colombo', NOW() - INTERVAL '84 hours'),
('aa500016-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1022', 'cc500002-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 10200.00, 0.00, 0, 10200.00, 'Order 22 processed in Colombo', NOW() - INTERVAL '88 hours'),
('aa500017-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1023', 'cc500003-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 10550.00, 0.00, 0, 10550.00, 'Order 23 processed in Colombo', NOW() - INTERVAL '92 hours'),
('aa500018-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1024', 'cc500004-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 10900.00, 200.00, 0, 10700.00, 'Order 24 processed in Colombo', NOW() - INTERVAL '96 hours'),
('aa500019-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1025', 'cc500005-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 11250.00, 0.00, 0, 11250.00, 'Order 25 processed in Colombo', NOW() - INTERVAL '100 hours'),
('aa50001a-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1026', 'cc500006-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 11600.00, 0.00, 0, 11600.00, 'Order 26 processed in Colombo', NOW() - INTERVAL '104 hours'),
('aa50001b-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1027', 'cc500007-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 11950.00, 0.00, 0, 11950.00, 'Order 27 processed in Colombo', NOW() - INTERVAL '108 hours'),
('aa50001c-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1028', 'cc500008-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 12300.00, 200.00, 0, 12100.00, 'Order 28 processed in Colombo', NOW() - INTERVAL '112 hours'),
('aa50001d-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1029', 'cc500009-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 12650.00, 0.00, 0, 12650.00, 'Order 29 processed in Colombo', NOW() - INTERVAL '116 hours'),
('aa50001e-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1030', 'cc50000a-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 13000.00, 0.00, 0, 13000.00, 'Order 30 processed in Colombo', NOW() - INTERVAL '120 hours'),
('aa50001f-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1031', 'cc50000b-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 13350.00, 0.00, 0, 13350.00, 'Order 31 processed in Colombo', NOW() - INTERVAL '124 hours'),
('aa500020-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1032', 'cc50000c-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 13700.00, 200.00, 0, 13500.00, 'Order 32 processed in Colombo', NOW() - INTERVAL '128 hours'),
('aa500021-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1033', 'cc50000d-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 14050.00, 0.00, 0, 14050.00, 'Order 33 processed in Colombo', NOW() - INTERVAL '132 hours'),
('aa500022-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1034', 'cc50000e-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 14400.00, 0.00, 0, 14400.00, 'Order 34 processed in Colombo', NOW() - INTERVAL '136 hours'),
('aa500023-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1035', 'cc50000f-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 14750.00, 0.00, 0, 14750.00, 'Order 35 processed in Colombo', NOW() - INTERVAL '140 hours'),
('aa500024-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1036', 'cc500010-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 15100.00, 200.00, 0, 14900.00, 'Order 36 processed in Colombo', NOW() - INTERVAL '144 hours'),
('aa500025-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1037', 'cc500011-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 15450.00, 0.00, 0, 15450.00, 'Order 37 processed in Colombo', NOW() - INTERVAL '148 hours'),
('aa500026-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1038', 'cc500012-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 15800.00, 0.00, 0, 15800.00, 'Order 38 processed in Colombo', NOW() - INTERVAL '152 hours'),
('aa500027-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1039', 'cc500013-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 16150.00, 0.00, 0, 16150.00, 'Order 39 processed in Colombo', NOW() - INTERVAL '156 hours'),
('aa500028-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'ORD-P1-1040', 'cc500014-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 16500.00, 200.00, 0, 16300.00, 'Order 40 processed in Colombo', NOW() - INTERVAL '160 hours')
ON CONFLICT (business_id, order_number) DO NOTHING;

-- 9. ORDER ITEMS FOR P1
INSERT INTO order_items (id, business_id, order_id, product_id, quantity, unit_price, cost_price, discount_amount, total_price) VALUES
('bb500001-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500001-0000-0000-0000-000000000001', 'da500001-0000-0000-0000-000000000001', 2, 900.00, 635.00, 0, 1800.00),
('bb500002-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500002-0000-0000-0000-000000000001', 'da500002-0000-0000-0000-000000000001', 2, 950.00, 670.00, 0, 1900.00),
('bb500003-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500003-0000-0000-0000-000000000001', 'da500003-0000-0000-0000-000000000001', 2, 1000.00, 705.00, 0, 2000.00),
('bb500004-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500004-0000-0000-0000-000000000001', 'da500004-0000-0000-0000-000000000001', 2, 1050.00, 740.00, 0, 2100.00),
('bb500005-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500005-0000-0000-0000-000000000001', 'da500005-0000-0000-0000-000000000001', 2, 1100.00, 775.00, 0, 2200.00),
('bb500006-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500006-0000-0000-0000-000000000001', 'da500006-0000-0000-0000-000000000001', 2, 1150.00, 810.00, 0, 2300.00),
('bb500007-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500007-0000-0000-0000-000000000001', 'da500007-0000-0000-0000-000000000001', 2, 1200.00, 845.00, 0, 2400.00),
('bb500008-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500008-0000-0000-0000-000000000001', 'da500008-0000-0000-0000-000000000001', 2, 1250.00, 880.00, 0, 2500.00),
('bb500009-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500009-0000-0000-0000-000000000001', 'da500009-0000-0000-0000-000000000001', 2, 1300.00, 915.00, 0, 2600.00),
('bb50000a-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa50000a-0000-0000-0000-000000000001', 'da50000a-0000-0000-0000-000000000001', 2, 1350.00, 950.00, 0, 2700.00),
('bb50000b-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa50000b-0000-0000-0000-000000000001', 'da50000b-0000-0000-0000-000000000001', 2, 1400.00, 985.00, 0, 2800.00),
('bb50000c-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa50000c-0000-0000-0000-000000000001', 'da50000c-0000-0000-0000-000000000001', 2, 1450.00, 1020.00, 0, 2900.00),
('bb50000d-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa50000d-0000-0000-0000-000000000001', 'da50000d-0000-0000-0000-000000000001', 2, 1500.00, 1055.00, 0, 3000.00),
('bb50000e-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa50000e-0000-0000-0000-000000000001', 'da50000e-0000-0000-0000-000000000001', 2, 1550.00, 1090.00, 0, 3100.00),
('bb50000f-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa50000f-0000-0000-0000-000000000001', 'da50000f-0000-0000-0000-000000000001', 2, 1600.00, 1125.00, 0, 3200.00),
('bb500010-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500010-0000-0000-0000-000000000001', 'da500010-0000-0000-0000-000000000001', 2, 1650.00, 1160.00, 0, 3300.00),
('bb500011-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500011-0000-0000-0000-000000000001', 'da500011-0000-0000-0000-000000000001', 2, 1700.00, 1195.00, 0, 3400.00),
('bb500012-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500012-0000-0000-0000-000000000001', 'da500012-0000-0000-0000-000000000001', 2, 1750.00, 1230.00, 0, 3500.00),
('bb500013-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500013-0000-0000-0000-000000000001', 'da500013-0000-0000-0000-000000000001', 2, 1800.00, 1265.00, 0, 3600.00),
('bb500014-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500014-0000-0000-0000-000000000001', 'da500014-0000-0000-0000-000000000001', 2, 1850.00, 1300.00, 0, 3700.00),
('bb500015-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500015-0000-0000-0000-000000000001', 'da500015-0000-0000-0000-000000000001', 2, 1900.00, 1335.00, 0, 3800.00),
('bb500016-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500016-0000-0000-0000-000000000001', 'da500016-0000-0000-0000-000000000001', 2, 1950.00, 1370.00, 0, 3900.00),
('bb500017-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500017-0000-0000-0000-000000000001', 'da500017-0000-0000-0000-000000000001', 2, 2000.00, 1405.00, 0, 4000.00),
('bb500018-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500018-0000-0000-0000-000000000001', 'da500018-0000-0000-0000-000000000001', 2, 2050.00, 1440.00, 0, 4100.00),
('bb500019-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500019-0000-0000-0000-000000000001', 'da500019-0000-0000-0000-000000000001', 2, 2100.00, 1475.00, 0, 4200.00),
('bb50001a-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa50001a-0000-0000-0000-000000000001', 'da50001a-0000-0000-0000-000000000001', 2, 2150.00, 1510.00, 0, 4300.00),
('bb50001b-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa50001b-0000-0000-0000-000000000001', 'da50001b-0000-0000-0000-000000000001', 2, 2200.00, 1545.00, 0, 4400.00),
('bb50001c-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa50001c-0000-0000-0000-000000000001', 'da50001c-0000-0000-0000-000000000001', 2, 2250.00, 1580.00, 0, 4500.00),
('bb50001d-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa50001d-0000-0000-0000-000000000001', 'da50001d-0000-0000-0000-000000000001', 2, 2300.00, 1615.00, 0, 4600.00),
('bb50001e-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa50001e-0000-0000-0000-000000000001', 'da50001e-0000-0000-0000-000000000001', 2, 2350.00, 1650.00, 0, 4700.00),
('bb50001f-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa50001f-0000-0000-0000-000000000001', 'da500001-0000-0000-0000-000000000001', 2, 2400.00, 1685.00, 0, 4800.00),
('bb500020-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500020-0000-0000-0000-000000000001', 'da500002-0000-0000-0000-000000000001', 2, 2450.00, 1720.00, 0, 4900.00),
('bb500021-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500021-0000-0000-0000-000000000001', 'da500003-0000-0000-0000-000000000001', 2, 2500.00, 1755.00, 0, 5000.00),
('bb500022-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500022-0000-0000-0000-000000000001', 'da500004-0000-0000-0000-000000000001', 2, 2550.00, 1790.00, 0, 5100.00),
('bb500023-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500023-0000-0000-0000-000000000001', 'da500005-0000-0000-0000-000000000001', 2, 2600.00, 1825.00, 0, 5200.00),
('bb500024-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500024-0000-0000-0000-000000000001', 'da500006-0000-0000-0000-000000000001', 2, 2650.00, 1860.00, 0, 5300.00),
('bb500025-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500025-0000-0000-0000-000000000001', 'da500007-0000-0000-0000-000000000001', 2, 2700.00, 1895.00, 0, 5400.00),
('bb500026-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500026-0000-0000-0000-000000000001', 'da500008-0000-0000-0000-000000000001', 2, 2750.00, 1930.00, 0, 5500.00),
('bb500027-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500027-0000-0000-0000-000000000001', 'da500009-0000-0000-0000-000000000001', 2, 2800.00, 1965.00, 0, 5600.00),
('bb500028-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500028-0000-0000-0000-000000000001', 'da50000a-0000-0000-0000-000000000001', 2, 2850.00, 2000.00, 0, 5700.00)
ON CONFLICT (id) DO NOTHING;

-- 10. INVOICES FOR P1 (15 Invoices)
INSERT INTO invoices (id, business_id, order_id, customer_id, invoice_number, issue_date, due_date, subtotal, discount_amount, tax_amount, total_amount, paid_amount, balance_amount, status, notes) VALUES
('ba500001-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500001-0000-0000-0000-000000000001', 'cc500001-0000-0000-0000-000000000001', 'HA-INV-50101', CURRENT_DATE - INTERVAL '1 days', CURRENT_DATE + INTERVAL '13 days', 4800.00, 0, 0, 4800.00, 4800.00, 0, 'paid', 'Official VAT Receipt 1'),
('ba500002-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500002-0000-0000-0000-000000000001', 'cc500002-0000-0000-0000-000000000001', 'HA-INV-50102', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '12 days', 5400.00, 0, 0, 5400.00, 5400.00, 0, 'paid', 'Official VAT Receipt 2'),
('ba500003-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500003-0000-0000-0000-000000000001', 'cc500003-0000-0000-0000-000000000001', 'HA-INV-50103', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '11 days', 6000.00, 0, 0, 6000.00, 6000.00, 0, 'paid', 'Official VAT Receipt 3'),
('ba500004-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500004-0000-0000-0000-000000000001', 'cc500004-0000-0000-0000-000000000001', 'HA-INV-50104', CURRENT_DATE - INTERVAL '4 days', CURRENT_DATE + INTERVAL '10 days', 6600.00, 0, 0, 6600.00, 6600.00, 0, 'paid', 'Official VAT Receipt 4'),
('ba500005-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500005-0000-0000-0000-000000000001', 'cc500005-0000-0000-0000-000000000001', 'HA-INV-50105', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '9 days', 7200.00, 0, 0, 7200.00, 7200.00, 0, 'paid', 'Official VAT Receipt 5'),
('ba500006-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500006-0000-0000-0000-000000000001', 'cc500006-0000-0000-0000-000000000001', 'HA-INV-50106', CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE + INTERVAL '8 days', 7800.00, 0, 0, 7800.00, 7800.00, 0, 'paid', 'Official VAT Receipt 6'),
('ba500007-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500007-0000-0000-0000-000000000001', 'cc500007-0000-0000-0000-000000000001', 'HA-INV-50107', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE + INTERVAL '7 days', 8400.00, 0, 0, 8400.00, 8400.00, 0, 'paid', 'Official VAT Receipt 7'),
('ba500008-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500008-0000-0000-0000-000000000001', 'cc500008-0000-0000-0000-000000000001', 'HA-INV-50108', CURRENT_DATE - INTERVAL '8 days', CURRENT_DATE + INTERVAL '6 days', 9000.00, 0, 0, 9000.00, 9000.00, 0, 'paid', 'Official VAT Receipt 8'),
('ba500009-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa500009-0000-0000-0000-000000000001', 'cc500009-0000-0000-0000-000000000001', 'HA-INV-50109', CURRENT_DATE - INTERVAL '9 days', CURRENT_DATE + INTERVAL '5 days', 9600.00, 0, 0, 9600.00, 9600.00, 0, 'paid', 'Official VAT Receipt 9'),
('ba50000a-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa50000a-0000-0000-0000-000000000001', 'cc50000a-0000-0000-0000-000000000001', 'HA-INV-50110', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '4 days', 10200.00, 0, 0, 10200.00, 10200.00, 0, 'paid', 'Official VAT Receipt 10'),
('ba50000b-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa50000b-0000-0000-0000-000000000001', 'cc50000b-0000-0000-0000-000000000001', 'HA-INV-50111', CURRENT_DATE - INTERVAL '11 days', CURRENT_DATE + INTERVAL '3 days', 10800.00, 0, 0, 10800.00, 10800.00, 0, 'paid', 'Official VAT Receipt 11'),
('ba50000c-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa50000c-0000-0000-0000-000000000001', 'cc50000c-0000-0000-0000-000000000001', 'HA-INV-50112', CURRENT_DATE - INTERVAL '12 days', CURRENT_DATE + INTERVAL '2 days', 11400.00, 0, 0, 11400.00, 11400.00, 0, 'paid', 'Official VAT Receipt 12'),
('ba50000d-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa50000d-0000-0000-0000-000000000001', 'cc50000d-0000-0000-0000-000000000001', 'HA-INV-50113', CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE + INTERVAL '1 days', 12000.00, 0, 0, 12000.00, 12000.00, 0, 'paid', 'Official VAT Receipt 13'),
('ba50000e-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa50000e-0000-0000-0000-000000000001', 'cc50000e-0000-0000-0000-000000000001', 'HA-INV-50114', CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE + INTERVAL '0 days', 12600.00, 0, 0, 12600.00, 12600.00, 0, 'paid', 'Official VAT Receipt 14'),
('ba50000f-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000005', 'aa50000f-0000-0000-0000-000000000001', 'cc50000f-0000-0000-0000-000000000001', 'HA-INV-50115', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '-1 days', 13200.00, 0, 0, 13200.00, 13200.00, 0, 'paid', 'Official VAT Receipt 15')
ON CONFLICT (business_id, invoice_number) DO NOTHING;


-- ============================================================
-- WORKSPACE P2: DEMO_PREMIUM_02 - Apex Global Industrial (Jaffna)
-- ============================================================

-- 1. CATEGORIES FOR P2
INSERT INTO categories (id, business_id, name, slug, description, image_url) VALUES
('ca600001-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Beverages & Refreshments', 'cat-p2-1', 'Beverages & Refreshments for Jaffna branch', '/demo-assets/categories/cat-1.webp'),
('ca600002-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Rice, Grains & Pulses', 'cat-p2-2', 'Rice, Grains & Pulses for Jaffna branch', '/demo-assets/categories/cat-2.webp'),
('ca600003-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Spices, Herbs & Seasoning', 'cat-p2-3', 'Spices, Herbs & Seasoning for Jaffna branch', '/demo-assets/categories/cat-3.webp'),
('ca600004-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Bakery & Confectionery', 'cat-p2-4', 'Bakery & Confectionery for Jaffna branch', '/demo-assets/categories/cat-4.webp'),
('ca600005-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Dairy, Eggs & Butter', 'cat-p2-5', 'Dairy, Eggs & Butter for Jaffna branch', '/demo-assets/categories/cat-5.webp'),
('ca600006-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Snacks & Crisps', 'cat-p2-6', 'Snacks & Crisps for Jaffna branch', '/demo-assets/categories/cat-6.webp'),
('ca600007-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Household Cleaning & Laundry', 'cat-p2-7', 'Household Cleaning & Laundry for Jaffna branch', '/demo-assets/categories/cat-7.webp'),
('ca600008-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Personal Care & Toiletries', 'cat-p2-8', 'Personal Care & Toiletries for Jaffna branch', '/demo-assets/categories/cat-8.webp'),
('ca600009-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Stationery & Office Supplies', 'cat-p2-9', 'Stationery & Office Supplies for Jaffna branch', '/demo-assets/categories/cat-9.webp'),
('ca60000a-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Fresh Produce & Essentials', 'cat-p2-10', 'Fresh Produce & Essentials for Jaffna branch', '/demo-assets/categories/cat-10.webp')
ON CONFLICT (business_id, slug) DO NOTHING;

-- 2. PRODUCTS FOR P2 (30 Products)
INSERT INTO products (id, business_id, category_id, name, sku, barcode, description, cost_price, selling_price, stock_quantity, min_stock_level, image_url, status) VALUES
('da600001-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ca600001-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P2 #1', 'SKU-P2-001', '79357600001', 'Commercial Grade Item 1 for DEMO_PREMIUM_02 - Apex Global Industrial', 295.00, 400.00, 22, 8, '/demo-assets/products/prod-2.webp', 'active'),
('da600002-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ca600002-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P2 #2', 'SKU-P2-002', '79357600002', 'Commercial Grade Item 2 for DEMO_PREMIUM_02 - Apex Global Industrial', 340.00, 460.00, 29, 8, '/demo-assets/products/prod-3.webp', 'active'),
('da600003-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ca600003-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P2 #3', 'SKU-P2-003', '79357600003', 'Commercial Grade Item 3 for DEMO_PREMIUM_02 - Apex Global Industrial', 385.00, 520.00, 36, 8, '/demo-assets/products/prod-4.webp', 'active'),
('da600004-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ca600004-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P2 #4', 'SKU-P2-004', '79357600004', 'Commercial Grade Item 4 for DEMO_PREMIUM_02 - Apex Global Industrial', 430.00, 580.00, 43, 8, '/demo-assets/products/prod-5.webp', 'active'),
('da600005-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ca600005-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P2 #5', 'SKU-P2-005', '79357600005', 'Commercial Grade Item 5 for DEMO_PREMIUM_02 - Apex Global Industrial', 475.00, 640.00, 50, 8, '/demo-assets/products/prod-6.webp', 'active'),
('da600006-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ca600006-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P2 #6', 'SKU-P2-006', '79357600006', 'Commercial Grade Item 6 for DEMO_PREMIUM_02 - Apex Global Industrial', 520.00, 700.00, 57, 8, '/demo-assets/products/prod-7.webp', 'active'),
('da600007-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ca600007-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P2 #7', 'SKU-P2-007', '79357600007', 'Commercial Grade Item 7 for DEMO_PREMIUM_02 - Apex Global Industrial', 565.00, 760.00, 64, 8, '/demo-assets/products/prod-8.webp', 'active'),
('da600008-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ca600008-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P2 #8', 'SKU-P2-008', '79357600008', 'Commercial Grade Item 8 for DEMO_PREMIUM_02 - Apex Global Industrial', 610.00, 820.00, 71, 8, '/demo-assets/products/prod-9.webp', 'active'),
('da600009-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ca600009-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P2 #9', 'SKU-P2-009', '79357600009', 'Commercial Grade Item 9 for DEMO_PREMIUM_02 - Apex Global Industrial', 655.00, 880.00, 78, 8, '/demo-assets/products/prod-10.webp', 'active'),
('da60000a-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ca60000a-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P2 #10', 'SKU-P2-010', '79357600010', 'Commercial Grade Item 10 for DEMO_PREMIUM_02 - Apex Global Industrial', 700.00, 950.00, 20, 8, '/demo-assets/products/prod-1.webp', 'active'),
('da60000b-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ca600001-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P2 #11', 'SKU-P2-011', '79357600011', 'Commercial Grade Item 11 for DEMO_PREMIUM_02 - Apex Global Industrial', 745.00, 1010.00, 27, 8, '/demo-assets/products/prod-2.webp', 'active'),
('da60000c-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ca600002-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P2 #12', 'SKU-P2-012', '79357600012', 'Commercial Grade Item 12 for DEMO_PREMIUM_02 - Apex Global Industrial', 790.00, 1070.00, 34, 8, '/demo-assets/products/prod-3.webp', 'active'),
('da60000d-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ca600003-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P2 #13', 'SKU-P2-013', '79357600013', 'Commercial Grade Item 13 for DEMO_PREMIUM_02 - Apex Global Industrial', 835.00, 1130.00, 41, 8, '/demo-assets/products/prod-4.webp', 'active'),
('da60000e-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ca600004-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P2 #14', 'SKU-P2-014', '79357600014', 'Commercial Grade Item 14 for DEMO_PREMIUM_02 - Apex Global Industrial', 880.00, 1190.00, 48, 8, '/demo-assets/products/prod-5.webp', 'active'),
('da60000f-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ca600005-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P2 #15', 'SKU-P2-015', '79357600015', 'Commercial Grade Item 15 for DEMO_PREMIUM_02 - Apex Global Industrial', 925.00, 1250.00, 55, 8, '/demo-assets/products/prod-6.webp', 'active'),
('da600010-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ca600006-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P2 #16', 'SKU-P2-016', '79357600016', 'Commercial Grade Item 16 for DEMO_PREMIUM_02 - Apex Global Industrial', 970.00, 1310.00, 62, 8, '/demo-assets/products/prod-7.webp', 'active'),
('da600011-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ca600007-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P2 #17', 'SKU-P2-017', '79357600017', 'Commercial Grade Item 17 for DEMO_PREMIUM_02 - Apex Global Industrial', 1015.00, 1370.00, 69, 8, '/demo-assets/products/prod-8.webp', 'active'),
('da600012-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ca600008-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P2 #18', 'SKU-P2-018', '79357600018', 'Commercial Grade Item 18 for DEMO_PREMIUM_02 - Apex Global Industrial', 1060.00, 1430.00, 76, 8, '/demo-assets/products/prod-9.webp', 'active'),
('da600013-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ca600009-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P2 #19', 'SKU-P2-019', '79357600019', 'Commercial Grade Item 19 for DEMO_PREMIUM_02 - Apex Global Industrial', 1105.00, 1490.00, 18, 8, '/demo-assets/products/prod-10.webp', 'active'),
('da600014-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ca60000a-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P2 #20', 'SKU-P2-020', '79357600020', 'Commercial Grade Item 20 for DEMO_PREMIUM_02 - Apex Global Industrial', 1150.00, 1550.00, 25, 8, '/demo-assets/products/prod-1.webp', 'active'),
('da600015-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ca600001-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P2 #21', 'SKU-P2-021', '79357600021', 'Commercial Grade Item 21 for DEMO_PREMIUM_02 - Apex Global Industrial', 1195.00, 1610.00, 32, 8, '/demo-assets/products/prod-2.webp', 'active'),
('da600016-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ca600002-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P2 #22', 'SKU-P2-022', '79357600022', 'Commercial Grade Item 22 for DEMO_PREMIUM_02 - Apex Global Industrial', 1240.00, 1670.00, 39, 8, '/demo-assets/products/prod-3.webp', 'active'),
('da600017-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ca600003-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P2 #23', 'SKU-P2-023', '79357600023', 'Commercial Grade Item 23 for DEMO_PREMIUM_02 - Apex Global Industrial', 1285.00, 1730.00, 46, 8, '/demo-assets/products/prod-4.webp', 'active'),
('da600018-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ca600004-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P2 #24', 'SKU-P2-024', '79357600024', 'Commercial Grade Item 24 for DEMO_PREMIUM_02 - Apex Global Industrial', 1330.00, 1800.00, 53, 8, '/demo-assets/products/prod-5.webp', 'active'),
('da600019-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ca600005-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P2 #25', 'SKU-P2-025', '79357600025', 'Commercial Grade Item 25 for DEMO_PREMIUM_02 - Apex Global Industrial', 1375.00, 1860.00, 60, 8, '/demo-assets/products/prod-6.webp', 'active'),
('da60001a-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ca600006-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P2 #26', 'SKU-P2-026', '79357600026', 'Commercial Grade Item 26 for DEMO_PREMIUM_02 - Apex Global Industrial', 1420.00, 1920.00, 67, 8, '/demo-assets/products/prod-7.webp', 'active'),
('da60001b-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ca600007-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P2 #27', 'SKU-P2-027', '79357600027', 'Commercial Grade Item 27 for DEMO_PREMIUM_02 - Apex Global Industrial', 1465.00, 1980.00, 74, 8, '/demo-assets/products/prod-8.webp', 'active'),
('da60001c-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ca600008-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P2 #28', 'SKU-P2-028', '79357600028', 'Commercial Grade Item 28 for DEMO_PREMIUM_02 - Apex Global Industrial', 1510.00, 2040.00, 16, 8, '/demo-assets/products/prod-9.webp', 'active'),
('da60001d-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ca600009-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P2 #29', 'SKU-P2-029', '79357600029', 'Commercial Grade Item 29 for DEMO_PREMIUM_02 - Apex Global Industrial', 1555.00, 2100.00, 23, 8, '/demo-assets/products/prod-10.webp', 'active'),
('da60001e-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ca60000a-0000-0000-0000-000000000001', 'Sri Lanka Quality Product P2 #30', 'SKU-P2-030', '79357600030', 'Commercial Grade Item 30 for DEMO_PREMIUM_02 - Apex Global Industrial', 1600.00, 2160.00, 30, 8, '/demo-assets/products/prod-1.webp', 'active')
ON CONFLICT (business_id, sku) DO NOTHING;

-- 3. INVENTORY FOR P2
INSERT INTO inventory (business_id, product_id, quantity, reserved_quantity, location)
SELECT business_id, id, stock_quantity, 0, 'Jaffna Main Store'
FROM products WHERE business_id = 'a6000000-0000-0000-0000-000000000006'
ON CONFLICT (business_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- 4. CUSTOMERS FOR P2 (20 Customers)
INSERT INTO customers (id, business_id, name, phone, email, address, total_purchases, total_orders, outstanding_balance, last_purchase_at) VALUES
('cc600001-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Sunil Jayawardena', '+94 77 234 5678', 'sunil.j.p2@gmail.com', '142 Havelock Road, Jaffna', 14400.00, 4, 0.00, NOW() - INTERVAL '1 days'),
('cc600002-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Kumari Alwis', '+94 71 876 5432', 'kumari.alwis.p2@gmail.com', '56 Rajagiriya Road, Jaffna', 16800.00, 5, 0.00, NOW() - INTERVAL '2 days'),
('cc600003-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Mohamed Rizwan', '+94 76 543 2198', 'm.rizwan.trading.p2@gmail.com', '88 Keyzer Street, Pettah, Jaffna', 19200.00, 6, 0.00, NOW() - INTERVAL '3 days'),
('cc600004-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Priyantha Gunasekara', '+94 77 654 3210', 'priyantha.guna.p2@gmail.com', '23 Temple Road, Nugegoda, Jaffna', 21600.00, 7, 0.00, NOW() - INTERVAL '4 days'),
('cc600005-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Chamari Dissanayake', '+94 72 345 6789', 'chamari.d.p2@gmail.com', '77 Stanley Tillakaratne Mawatha, Jaffna', 24000.00, 8, 3750.00, NOW() - INTERVAL '5 days'),
('cc600006-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Siva Subramaniam', '+94 77 889 9001', 'siva.subra.p2@gmail.com', '12 Sea Street, Jaffna', 26400.00, 9, 0.00, NOW() - INTERVAL '6 days'),
('cc600007-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Anushka Bandara', '+94 75 112 2334', 'anushka.b.p2@gmail.com', '98 High Level Road, Maharagama, Jaffna', 28800.00, 10, 0.00, NOW() - INTERVAL '7 days'),
('cc600008-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Malik Mansoor', '+94 77 998 8776', 'malik.mansoor.p2@gmail.com', '34 Wekande Road, Jaffna', 31200.00, 11, 0.00, NOW() - INTERVAL '8 days'),
('cc600009-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Kavindi Senaratne', '+94 71 445 5667', 'kavindi.sena.p2@gmail.com', '5 Anderson Road, Dehiwala, Jaffna', 33600.00, 12, 0.00, NOW() - INTERVAL '9 days'),
('cc60000a-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Dinesh Samarawickrama', '+94 70 334 4556', 'dinesh.sam.p2@gmail.com', '19 Galle Road, Mount Lavinia, Jaffna', 36000.00, 13, 7500.00, NOW() - INTERVAL '10 days'),
('cc60000b-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Shalini Weerasinghe', '+94 77 667 7889', 'shalini.w.p2@gmail.com', '40 Duplication Road, Jaffna', 38400.00, 14, 0.00, NOW() - INTERVAL '11 days'),
('cc60000c-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Ruwan Edirisinghe', '+94 76 778 8990', 'ruwan.ediri.p2@gmail.com', '62 Baseline Road, Dematagoda, Jaffna', 40800.00, 15, 0.00, NOW() - INTERVAL '12 days'),
('cc60000d-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Thilini Fonseka', '+94 71 223 3445', 'thilini.fonseka.p2@gmail.com', '110 Hospital Road, Kalubowila, Jaffna', 43200.00, 16, 0.00, NOW() - INTERVAL '13 days'),
('cc60000e-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Asanka Karunaratne', '+94 78 556 6778', 'asanka.k.p2@gmail.com', '85 Sri Saranankara Road, Jaffna', 45600.00, 17, 0.00, NOW() - INTERVAL '14 days'),
('cc60000f-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Fathima Zeenath', '+94 77 443 3221', 'zeenath.fathima.p2@gmail.com', '27 Maligawatta Place, Jaffna', 48000.00, 3, 11250.00, NOW() - INTERVAL '15 days'),
('cc600010-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Pradeep Kumara', '+94 70 889 9002', 'pradeep.kumara.p2@gmail.com', '14 Negombo Road, Peliyagoda, Jaffna', 50400.00, 4, 0.00, NOW() - INTERVAL '16 days'),
('cc600011-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Hiruni Rathnayake', '+94 77 119 9228', 'hiruni.rathna.p2@gmail.com', '73 Nawala Road, Jaffna', 52800.00, 5, 0.00, NOW() - INTERVAL '17 days'),
('cc600012-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Mahesh Wickramasinghe', '+94 76 123 9876', 'mahesh.wick.p2@gmail.com', '29 Jubilee Post, Mirihana, Jaffna', 55200.00, 6, 0.00, NOW() - INTERVAL '18 days'),
('cc600013-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Nimanthi Abeysekera', '+94 71 990 0112', 'nimanthi.a.p2@gmail.com', '91 Pagoda Road, Nugegoda, Jaffna', 57600.00, 7, 0.00, NOW() - INTERVAL '19 days'),
('cc600014-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Roshan Liyanage', '+94 77 554 4332', 'roshan.liya.p2@gmail.com', '52 Old Kesbewa Road, Jaffna', 60000.00, 8, 15000.00, NOW() - INTERVAL '20 days')
ON CONFLICT (id) DO NOTHING;

-- 5. EMPLOYEES FOR P2 (6 Employees)
INSERT INTO employees (id, business_id, employee_id_number, name, email, phone, position, department, salary, join_date, status, avatar_url) VALUES
('ee600001-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'EMP-001-P2', 'Kasun Perera', 'kasun.perera.p2@harshapex.lk', '+94 77 511 4512', 'Owner & General Director', 'Executive', 220000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-1.webp'),
('ee600002-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'EMP-002-P2', 'Buddhika Senanayake', 'buddhika.senanayake.p2@harshapex.lk', '+94 77 512 4522', 'Operations General Manager', 'Operations', 140000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-2.webp'),
('ee600003-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'EMP-003-P2', 'Sanduni Wijeratne', 'sanduni.wijeratne.p2@harshapex.lk', '+94 77 513 4532', 'Head of Sales & Billing', 'Sales', 85000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-3.webp'),
('ee600004-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'EMP-004-P2', 'Nuwan Jayalath', 'nuwan.jayalath.p2@harshapex.lk', '+94 77 514 4542', 'Inventory & Logistics Lead', 'Logistics', 90000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-4.webp'),
('ee600005-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'EMP-005-P2', 'Kavinda Maduranga', 'kavinda.maduranga.p2@harshapex.lk', '+94 77 515 4552', 'Senior Counter Cashier', 'Sales', 65000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-5.webp'),
('ee600006-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'EMP-006-P2', 'Dharshani Mendis', 'dharshani.mendis.p2@harshapex.lk', '+94 77 516 4562', 'Financial Analyst & Accounts', 'Finance', 105000.00, '2023-01-15', 'active', '/demo-assets/employees/emp-6.webp')
ON CONFLICT (business_id, employee_id_number) DO NOTHING;

-- 6. EXPENSE CATEGORIES FOR P2
INSERT INTO expense_categories (id, business_id, name, description) VALUES
('ec600001-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Store & Office Rent', 'Monthly commercial premises lease'),
('ec600002-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Electricity & Water Utilities', 'CEB & commercial utilities'),
('ec600003-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Staff Salaries & Overtime', 'Monthly payroll disbursements'),
('ec600004-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Logistics, Delivery & Fuel', 'Fleet fuel and transport charges'),
('ec600005-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Equipment & IT Maintenance', 'Hardware, thermal rolls, and network maintenance'),
('ec600006-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Marketing & Customer Loyalty', 'Promotional campaigns and SMS alerts'),
('ec600007-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Security & Municipal Taxes', 'Premises security and local council rates'),
('ec600008-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Packaging & Consumables', 'Eco bags, boxes, and parcel wrap'),
('ec600009-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Accounting & Professional Fees', 'Auditing, secretarial and legal retainer'),
('ec60000a-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'Miscellaneous Operational Contingency', 'Store daily operational petty expenses')
ON CONFLICT (business_id, name) DO NOTHING;

-- 7. EXPENSES FOR P2 (10 Expenses)
INSERT INTO expenses (id, business_id, category_id, expense_number, expense_date, description, amount, payment_method, notes) VALUES
('ea600001-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ec600001-0000-0000-0000-000000000001', 'EXP-P2-2026-001', CURRENT_DATE - INTERVAL '2 days', 'Store & Office Rent - Jaffna', 11700.00, 'card', 'Disbursed for Jaffna branch operational expenses'),
('ea600002-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ec600002-0000-0000-0000-000000000001', 'EXP-P2-2026-002', CURRENT_DATE - INTERVAL '4 days', 'Electricity & Water Utilities - Jaffna', 14900.00, 'bank_transfer', 'Disbursed for Jaffna branch operational expenses'),
('ea600003-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ec600003-0000-0000-0000-000000000001', 'EXP-P2-2026-003', CURRENT_DATE - INTERVAL '6 days', 'Staff Salaries & Overtime - Jaffna', 18100.00, 'cash', 'Disbursed for Jaffna branch operational expenses'),
('ea600004-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ec600004-0000-0000-0000-000000000001', 'EXP-P2-2026-004', CURRENT_DATE - INTERVAL '8 days', 'Logistics, Delivery & Fuel - Jaffna', 21300.00, 'card', 'Disbursed for Jaffna branch operational expenses'),
('ea600005-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ec600005-0000-0000-0000-000000000001', 'EXP-P2-2026-005', CURRENT_DATE - INTERVAL '10 days', 'Equipment & IT Maintenance - Jaffna', 24500.00, 'bank_transfer', 'Disbursed for Jaffna branch operational expenses'),
('ea600006-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ec600006-0000-0000-0000-000000000001', 'EXP-P2-2026-006', CURRENT_DATE - INTERVAL '12 days', 'Marketing & Customer Loyalty - Jaffna', 27700.00, 'cash', 'Disbursed for Jaffna branch operational expenses'),
('ea600007-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ec600007-0000-0000-0000-000000000001', 'EXP-P2-2026-007', CURRENT_DATE - INTERVAL '14 days', 'Security & Municipal Taxes - Jaffna', 30900.00, 'card', 'Disbursed for Jaffna branch operational expenses'),
('ea600008-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ec600008-0000-0000-0000-000000000001', 'EXP-P2-2026-008', CURRENT_DATE - INTERVAL '16 days', 'Packaging & Consumables - Jaffna', 34100.00, 'bank_transfer', 'Disbursed for Jaffna branch operational expenses'),
('ea600009-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ec600009-0000-0000-0000-000000000001', 'EXP-P2-2026-009', CURRENT_DATE - INTERVAL '18 days', 'Accounting & Professional Fees - Jaffna', 37300.00, 'cash', 'Disbursed for Jaffna branch operational expenses'),
('ea60000a-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ec60000a-0000-0000-0000-000000000001', 'EXP-P2-2026-010', CURRENT_DATE - INTERVAL '20 days', 'Miscellaneous Operational Contingency - Jaffna', 40500.00, 'card', 'Disbursed for Jaffna branch operational expenses')
ON CONFLICT (business_id, expense_number) DO NOTHING;

-- 8. ORDERS FOR P2 (40 Orders)
INSERT INTO orders (id, business_id, order_number, customer_id, status, payment_status, payment_method, subtotal, discount_amount, tax_amount, total_amount, notes, created_at) VALUES
('aa600001-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1001', 'cc600001-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 2850.00, 0.00, 0, 2850.00, 'Order 1 processed in Jaffna', NOW() - INTERVAL '4 hours'),
('aa600002-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1002', 'cc600002-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 3200.00, 0.00, 0, 3200.00, 'Order 2 processed in Jaffna', NOW() - INTERVAL '8 hours'),
('aa600003-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1003', 'cc600003-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 3550.00, 0.00, 0, 3550.00, 'Order 3 processed in Jaffna', NOW() - INTERVAL '12 hours'),
('aa600004-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1004', 'cc600004-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 3900.00, 200.00, 0, 3700.00, 'Order 4 processed in Jaffna', NOW() - INTERVAL '16 hours'),
('aa600005-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1005', 'cc600005-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 4250.00, 0.00, 0, 4250.00, 'Order 5 processed in Jaffna', NOW() - INTERVAL '20 hours'),
('aa600006-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1006', 'cc600006-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 4600.00, 0.00, 0, 4600.00, 'Order 6 processed in Jaffna', NOW() - INTERVAL '24 hours'),
('aa600007-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1007', 'cc600007-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 4950.00, 0.00, 0, 4950.00, 'Order 7 processed in Jaffna', NOW() - INTERVAL '28 hours'),
('aa600008-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1008', 'cc600008-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 5300.00, 200.00, 0, 5100.00, 'Order 8 processed in Jaffna', NOW() - INTERVAL '32 hours'),
('aa600009-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1009', 'cc600009-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 5650.00, 0.00, 0, 5650.00, 'Order 9 processed in Jaffna', NOW() - INTERVAL '36 hours'),
('aa60000a-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1010', 'cc60000a-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 6000.00, 0.00, 0, 6000.00, 'Order 10 processed in Jaffna', NOW() - INTERVAL '40 hours'),
('aa60000b-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1011', 'cc60000b-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 6350.00, 0.00, 0, 6350.00, 'Order 11 processed in Jaffna', NOW() - INTERVAL '44 hours'),
('aa60000c-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1012', 'cc60000c-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 6700.00, 200.00, 0, 6500.00, 'Order 12 processed in Jaffna', NOW() - INTERVAL '48 hours'),
('aa60000d-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1013', 'cc60000d-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 7050.00, 0.00, 0, 7050.00, 'Order 13 processed in Jaffna', NOW() - INTERVAL '52 hours'),
('aa60000e-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1014', 'cc60000e-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 7400.00, 0.00, 0, 7400.00, 'Order 14 processed in Jaffna', NOW() - INTERVAL '56 hours'),
('aa60000f-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1015', 'cc60000f-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 7750.00, 0.00, 0, 7750.00, 'Order 15 processed in Jaffna', NOW() - INTERVAL '60 hours'),
('aa600010-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1016', 'cc600010-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 8100.00, 200.00, 0, 7900.00, 'Order 16 processed in Jaffna', NOW() - INTERVAL '64 hours'),
('aa600011-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1017', 'cc600011-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 8450.00, 0.00, 0, 8450.00, 'Order 17 processed in Jaffna', NOW() - INTERVAL '68 hours'),
('aa600012-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1018', 'cc600012-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 8800.00, 0.00, 0, 8800.00, 'Order 18 processed in Jaffna', NOW() - INTERVAL '72 hours'),
('aa600013-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1019', 'cc600013-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 9150.00, 0.00, 0, 9150.00, 'Order 19 processed in Jaffna', NOW() - INTERVAL '76 hours'),
('aa600014-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1020', 'cc600014-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 9500.00, 200.00, 0, 9300.00, 'Order 20 processed in Jaffna', NOW() - INTERVAL '80 hours'),
('aa600015-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1021', 'cc600001-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 9850.00, 0.00, 0, 9850.00, 'Order 21 processed in Jaffna', NOW() - INTERVAL '84 hours'),
('aa600016-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1022', 'cc600002-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 10200.00, 0.00, 0, 10200.00, 'Order 22 processed in Jaffna', NOW() - INTERVAL '88 hours'),
('aa600017-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1023', 'cc600003-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 10550.00, 0.00, 0, 10550.00, 'Order 23 processed in Jaffna', NOW() - INTERVAL '92 hours'),
('aa600018-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1024', 'cc600004-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 10900.00, 200.00, 0, 10700.00, 'Order 24 processed in Jaffna', NOW() - INTERVAL '96 hours'),
('aa600019-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1025', 'cc600005-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 11250.00, 0.00, 0, 11250.00, 'Order 25 processed in Jaffna', NOW() - INTERVAL '100 hours'),
('aa60001a-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1026', 'cc600006-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 11600.00, 0.00, 0, 11600.00, 'Order 26 processed in Jaffna', NOW() - INTERVAL '104 hours'),
('aa60001b-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1027', 'cc600007-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 11950.00, 0.00, 0, 11950.00, 'Order 27 processed in Jaffna', NOW() - INTERVAL '108 hours'),
('aa60001c-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1028', 'cc600008-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 12300.00, 200.00, 0, 12100.00, 'Order 28 processed in Jaffna', NOW() - INTERVAL '112 hours'),
('aa60001d-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1029', 'cc600009-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 12650.00, 0.00, 0, 12650.00, 'Order 29 processed in Jaffna', NOW() - INTERVAL '116 hours'),
('aa60001e-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1030', 'cc60000a-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 13000.00, 0.00, 0, 13000.00, 'Order 30 processed in Jaffna', NOW() - INTERVAL '120 hours'),
('aa60001f-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1031', 'cc60000b-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 13350.00, 0.00, 0, 13350.00, 'Order 31 processed in Jaffna', NOW() - INTERVAL '124 hours'),
('aa600020-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1032', 'cc60000c-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 13700.00, 200.00, 0, 13500.00, 'Order 32 processed in Jaffna', NOW() - INTERVAL '128 hours'),
('aa600021-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1033', 'cc60000d-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 14050.00, 0.00, 0, 14050.00, 'Order 33 processed in Jaffna', NOW() - INTERVAL '132 hours'),
('aa600022-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1034', 'cc60000e-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 14400.00, 0.00, 0, 14400.00, 'Order 34 processed in Jaffna', NOW() - INTERVAL '136 hours'),
('aa600023-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1035', 'cc60000f-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 14750.00, 0.00, 0, 14750.00, 'Order 35 processed in Jaffna', NOW() - INTERVAL '140 hours'),
('aa600024-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1036', 'cc600010-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 15100.00, 200.00, 0, 14900.00, 'Order 36 processed in Jaffna', NOW() - INTERVAL '144 hours'),
('aa600025-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1037', 'cc600011-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 15450.00, 0.00, 0, 15450.00, 'Order 37 processed in Jaffna', NOW() - INTERVAL '148 hours'),
('aa600026-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1038', 'cc600012-0000-0000-0000-000000000001', 'completed', 'paid', 'bank_transfer', 15800.00, 0.00, 0, 15800.00, 'Order 38 processed in Jaffna', NOW() - INTERVAL '152 hours'),
('aa600027-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1039', 'cc600013-0000-0000-0000-000000000001', 'completed', 'paid', 'cash', 16150.00, 0.00, 0, 16150.00, 'Order 39 processed in Jaffna', NOW() - INTERVAL '156 hours'),
('aa600028-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'ORD-P2-1040', 'cc600014-0000-0000-0000-000000000001', 'completed', 'paid', 'card', 16500.00, 200.00, 0, 16300.00, 'Order 40 processed in Jaffna', NOW() - INTERVAL '160 hours')
ON CONFLICT (business_id, order_number) DO NOTHING;

-- 9. ORDER ITEMS FOR P2
INSERT INTO order_items (id, business_id, order_id, product_id, quantity, unit_price, cost_price, discount_amount, total_price) VALUES
('bb600001-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600001-0000-0000-0000-000000000001', 'da600001-0000-0000-0000-000000000001', 2, 900.00, 635.00, 0, 1800.00),
('bb600002-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600002-0000-0000-0000-000000000001', 'da600002-0000-0000-0000-000000000001', 2, 950.00, 670.00, 0, 1900.00),
('bb600003-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600003-0000-0000-0000-000000000001', 'da600003-0000-0000-0000-000000000001', 2, 1000.00, 705.00, 0, 2000.00),
('bb600004-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600004-0000-0000-0000-000000000001', 'da600004-0000-0000-0000-000000000001', 2, 1050.00, 740.00, 0, 2100.00),
('bb600005-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600005-0000-0000-0000-000000000001', 'da600005-0000-0000-0000-000000000001', 2, 1100.00, 775.00, 0, 2200.00),
('bb600006-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600006-0000-0000-0000-000000000001', 'da600006-0000-0000-0000-000000000001', 2, 1150.00, 810.00, 0, 2300.00),
('bb600007-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600007-0000-0000-0000-000000000001', 'da600007-0000-0000-0000-000000000001', 2, 1200.00, 845.00, 0, 2400.00),
('bb600008-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600008-0000-0000-0000-000000000001', 'da600008-0000-0000-0000-000000000001', 2, 1250.00, 880.00, 0, 2500.00),
('bb600009-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600009-0000-0000-0000-000000000001', 'da600009-0000-0000-0000-000000000001', 2, 1300.00, 915.00, 0, 2600.00),
('bb60000a-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa60000a-0000-0000-0000-000000000001', 'da60000a-0000-0000-0000-000000000001', 2, 1350.00, 950.00, 0, 2700.00),
('bb60000b-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa60000b-0000-0000-0000-000000000001', 'da60000b-0000-0000-0000-000000000001', 2, 1400.00, 985.00, 0, 2800.00),
('bb60000c-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa60000c-0000-0000-0000-000000000001', 'da60000c-0000-0000-0000-000000000001', 2, 1450.00, 1020.00, 0, 2900.00),
('bb60000d-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa60000d-0000-0000-0000-000000000001', 'da60000d-0000-0000-0000-000000000001', 2, 1500.00, 1055.00, 0, 3000.00),
('bb60000e-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa60000e-0000-0000-0000-000000000001', 'da60000e-0000-0000-0000-000000000001', 2, 1550.00, 1090.00, 0, 3100.00),
('bb60000f-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa60000f-0000-0000-0000-000000000001', 'da60000f-0000-0000-0000-000000000001', 2, 1600.00, 1125.00, 0, 3200.00),
('bb600010-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600010-0000-0000-0000-000000000001', 'da600010-0000-0000-0000-000000000001', 2, 1650.00, 1160.00, 0, 3300.00),
('bb600011-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600011-0000-0000-0000-000000000001', 'da600011-0000-0000-0000-000000000001', 2, 1700.00, 1195.00, 0, 3400.00),
('bb600012-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600012-0000-0000-0000-000000000001', 'da600012-0000-0000-0000-000000000001', 2, 1750.00, 1230.00, 0, 3500.00),
('bb600013-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600013-0000-0000-0000-000000000001', 'da600013-0000-0000-0000-000000000001', 2, 1800.00, 1265.00, 0, 3600.00),
('bb600014-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600014-0000-0000-0000-000000000001', 'da600014-0000-0000-0000-000000000001', 2, 1850.00, 1300.00, 0, 3700.00),
('bb600015-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600015-0000-0000-0000-000000000001', 'da600015-0000-0000-0000-000000000001', 2, 1900.00, 1335.00, 0, 3800.00),
('bb600016-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600016-0000-0000-0000-000000000001', 'da600016-0000-0000-0000-000000000001', 2, 1950.00, 1370.00, 0, 3900.00),
('bb600017-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600017-0000-0000-0000-000000000001', 'da600017-0000-0000-0000-000000000001', 2, 2000.00, 1405.00, 0, 4000.00),
('bb600018-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600018-0000-0000-0000-000000000001', 'da600018-0000-0000-0000-000000000001', 2, 2050.00, 1440.00, 0, 4100.00),
('bb600019-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600019-0000-0000-0000-000000000001', 'da600019-0000-0000-0000-000000000001', 2, 2100.00, 1475.00, 0, 4200.00),
('bb60001a-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa60001a-0000-0000-0000-000000000001', 'da60001a-0000-0000-0000-000000000001', 2, 2150.00, 1510.00, 0, 4300.00),
('bb60001b-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa60001b-0000-0000-0000-000000000001', 'da60001b-0000-0000-0000-000000000001', 2, 2200.00, 1545.00, 0, 4400.00),
('bb60001c-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa60001c-0000-0000-0000-000000000001', 'da60001c-0000-0000-0000-000000000001', 2, 2250.00, 1580.00, 0, 4500.00),
('bb60001d-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa60001d-0000-0000-0000-000000000001', 'da60001d-0000-0000-0000-000000000001', 2, 2300.00, 1615.00, 0, 4600.00),
('bb60001e-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa60001e-0000-0000-0000-000000000001', 'da60001e-0000-0000-0000-000000000001', 2, 2350.00, 1650.00, 0, 4700.00),
('bb60001f-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa60001f-0000-0000-0000-000000000001', 'da600001-0000-0000-0000-000000000001', 2, 2400.00, 1685.00, 0, 4800.00),
('bb600020-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600020-0000-0000-0000-000000000001', 'da600002-0000-0000-0000-000000000001', 2, 2450.00, 1720.00, 0, 4900.00),
('bb600021-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600021-0000-0000-0000-000000000001', 'da600003-0000-0000-0000-000000000001', 2, 2500.00, 1755.00, 0, 5000.00),
('bb600022-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600022-0000-0000-0000-000000000001', 'da600004-0000-0000-0000-000000000001', 2, 2550.00, 1790.00, 0, 5100.00),
('bb600023-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600023-0000-0000-0000-000000000001', 'da600005-0000-0000-0000-000000000001', 2, 2600.00, 1825.00, 0, 5200.00),
('bb600024-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600024-0000-0000-0000-000000000001', 'da600006-0000-0000-0000-000000000001', 2, 2650.00, 1860.00, 0, 5300.00),
('bb600025-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600025-0000-0000-0000-000000000001', 'da600007-0000-0000-0000-000000000001', 2, 2700.00, 1895.00, 0, 5400.00),
('bb600026-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600026-0000-0000-0000-000000000001', 'da600008-0000-0000-0000-000000000001', 2, 2750.00, 1930.00, 0, 5500.00),
('bb600027-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600027-0000-0000-0000-000000000001', 'da600009-0000-0000-0000-000000000001', 2, 2800.00, 1965.00, 0, 5600.00),
('bb600028-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600028-0000-0000-0000-000000000001', 'da60000a-0000-0000-0000-000000000001', 2, 2850.00, 2000.00, 0, 5700.00)
ON CONFLICT (id) DO NOTHING;

-- 10. INVOICES FOR P2 (15 Invoices)
INSERT INTO invoices (id, business_id, order_id, customer_id, invoice_number, issue_date, due_date, subtotal, discount_amount, tax_amount, total_amount, paid_amount, balance_amount, status, notes) VALUES
('ba600001-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600001-0000-0000-0000-000000000001', 'cc600001-0000-0000-0000-000000000001', 'HA-INV-60101', CURRENT_DATE - INTERVAL '1 days', CURRENT_DATE + INTERVAL '13 days', 4800.00, 0, 0, 4800.00, 4800.00, 0, 'paid', 'Official VAT Receipt 1'),
('ba600002-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600002-0000-0000-0000-000000000001', 'cc600002-0000-0000-0000-000000000001', 'HA-INV-60102', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '12 days', 5400.00, 0, 0, 5400.00, 5400.00, 0, 'paid', 'Official VAT Receipt 2'),
('ba600003-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600003-0000-0000-0000-000000000001', 'cc600003-0000-0000-0000-000000000001', 'HA-INV-60103', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '11 days', 6000.00, 0, 0, 6000.00, 6000.00, 0, 'paid', 'Official VAT Receipt 3'),
('ba600004-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600004-0000-0000-0000-000000000001', 'cc600004-0000-0000-0000-000000000001', 'HA-INV-60104', CURRENT_DATE - INTERVAL '4 days', CURRENT_DATE + INTERVAL '10 days', 6600.00, 0, 0, 6600.00, 6600.00, 0, 'paid', 'Official VAT Receipt 4'),
('ba600005-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600005-0000-0000-0000-000000000001', 'cc600005-0000-0000-0000-000000000001', 'HA-INV-60105', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '9 days', 7200.00, 0, 0, 7200.00, 7200.00, 0, 'paid', 'Official VAT Receipt 5'),
('ba600006-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600006-0000-0000-0000-000000000001', 'cc600006-0000-0000-0000-000000000001', 'HA-INV-60106', CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE + INTERVAL '8 days', 7800.00, 0, 0, 7800.00, 7800.00, 0, 'paid', 'Official VAT Receipt 6'),
('ba600007-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600007-0000-0000-0000-000000000001', 'cc600007-0000-0000-0000-000000000001', 'HA-INV-60107', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE + INTERVAL '7 days', 8400.00, 0, 0, 8400.00, 8400.00, 0, 'paid', 'Official VAT Receipt 7'),
('ba600008-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600008-0000-0000-0000-000000000001', 'cc600008-0000-0000-0000-000000000001', 'HA-INV-60108', CURRENT_DATE - INTERVAL '8 days', CURRENT_DATE + INTERVAL '6 days', 9000.00, 0, 0, 9000.00, 9000.00, 0, 'paid', 'Official VAT Receipt 8'),
('ba600009-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa600009-0000-0000-0000-000000000001', 'cc600009-0000-0000-0000-000000000001', 'HA-INV-60109', CURRENT_DATE - INTERVAL '9 days', CURRENT_DATE + INTERVAL '5 days', 9600.00, 0, 0, 9600.00, 9600.00, 0, 'paid', 'Official VAT Receipt 9'),
('ba60000a-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa60000a-0000-0000-0000-000000000001', 'cc60000a-0000-0000-0000-000000000001', 'HA-INV-60110', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '4 days', 10200.00, 0, 0, 10200.00, 10200.00, 0, 'paid', 'Official VAT Receipt 10'),
('ba60000b-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa60000b-0000-0000-0000-000000000001', 'cc60000b-0000-0000-0000-000000000001', 'HA-INV-60111', CURRENT_DATE - INTERVAL '11 days', CURRENT_DATE + INTERVAL '3 days', 10800.00, 0, 0, 10800.00, 10800.00, 0, 'paid', 'Official VAT Receipt 11'),
('ba60000c-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa60000c-0000-0000-0000-000000000001', 'cc60000c-0000-0000-0000-000000000001', 'HA-INV-60112', CURRENT_DATE - INTERVAL '12 days', CURRENT_DATE + INTERVAL '2 days', 11400.00, 0, 0, 11400.00, 11400.00, 0, 'paid', 'Official VAT Receipt 12'),
('ba60000d-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa60000d-0000-0000-0000-000000000001', 'cc60000d-0000-0000-0000-000000000001', 'HA-INV-60113', CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE + INTERVAL '1 days', 12000.00, 0, 0, 12000.00, 12000.00, 0, 'paid', 'Official VAT Receipt 13'),
('ba60000e-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa60000e-0000-0000-0000-000000000001', 'cc60000e-0000-0000-0000-000000000001', 'HA-INV-60114', CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE + INTERVAL '0 days', 12600.00, 0, 0, 12600.00, 12600.00, 0, 'paid', 'Official VAT Receipt 14'),
('ba60000f-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000006', 'aa60000f-0000-0000-0000-000000000001', 'cc60000f-0000-0000-0000-000000000001', 'HA-INV-60115', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '-1 days', 13200.00, 0, 0, 13200.00, 13200.00, 0, 'paid', 'Official VAT Receipt 15')
ON CONFLICT (business_id, invoice_number) DO NOTHING;



-- >>>>>>>>>>>>>>>>>> END FILE: 05_seed_demo_workspaces_data.sql <<<<<<<<<<<<<<<<<<


-- >>>>>>>>>>>>>>>>>> BEGIN FILE: 06_storage_buckets.sql <<<<<<<<<<<<<<<<<<

-- ============================================================
-- HARSH APEX SMART BUSINESS SUITE - 06_STORAGE_BUCKETS.SQL
-- Supabase Storage Buckets & Tenant-Aware RLS Policies
-- ============================================================

-- 1. CREATE STORAGE BUCKETS IF NOT EXISTS
-- Required Buckets:
-- - product-images (public)
-- - customer-avatars (public)
-- - employee-avatars (public)
-- - business-logos (public)
-- - invoice-assets (private, tenant-isolated)
-- - demo-assets (public)

DO $$
BEGIN
    -- Check if storage schema and buckets table exist (standard in Supabase)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES 
            ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
            ('customer-avatars', 'customer-avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
            ('employee-avatars', 'employee-avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
            ('business-logos', 'business-logos', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
            ('invoice-assets', 'invoice-assets', false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
            ('demo-assets', 'demo-assets', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
        ON CONFLICT (id) DO UPDATE SET
            public = EXCLUDED.public,
            file_size_limit = EXCLUDED.file_size_limit,
            allowed_mime_types = EXCLUDED.allowed_mime_types;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 2. CREATE STORAGE RLS POLICIES
-- Tenant-aware path format: {business_id}/{resource_id}/{filename}
-- NOTE: In Supabase Cloud, storage.objects ALREADY has RLS enabled by default.
-- DO NOT call 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY' as it causes error 42501.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
        -- Drop existing policies if any to ensure idempotency on re-run
        BEGIN
            DROP POLICY IF EXISTS "Public buckets are viewable by everyone" ON storage.objects;
            DROP POLICY IF EXISTS "Private invoice assets viewable only by tenant" ON storage.objects;
            DROP POLICY IF EXISTS "Tenant users can upload files to their business folder" ON storage.objects;
            DROP POLICY IF EXISTS "Tenant users can update files in their business folder" ON storage.objects;
            DROP POLICY IF EXISTS "Tenant users can delete files in their business folder" ON storage.objects;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;

        -- 1. Read Public Buckets
        CREATE POLICY "Public buckets are viewable by everyone"
        ON storage.objects FOR SELECT
        USING (bucket_id IN ('product-images', 'customer-avatars', 'employee-avatars', 'business-logos', 'demo-assets'));

        -- 2. Read Private Invoice Assets (Scoped strictly by business_id)
        CREATE POLICY "Private invoice assets viewable only by tenant"
        ON storage.objects FOR SELECT
        USING (
            bucket_id = 'invoice-assets' AND (
                (storage.foldername(name))[1] = get_auth_business_id()::text
                OR is_super_admin()
                OR auth.jwt() ->> 'role' = 'service_role'
            )
        );

        -- 3. Insert Objects: Tenant users can only upload into their own {business_id} folder
        CREATE POLICY "Tenant users can upload files to their business folder"
        ON storage.objects FOR INSERT
        WITH CHECK (
            (storage.foldername(name))[1] = get_auth_business_id()::text
            OR is_super_admin()
            OR auth.jwt() ->> 'role' = 'service_role'
        );

        -- 4. Update Objects: Tenant users can only update within their own {business_id} folder
        CREATE POLICY "Tenant users can update files in their business folder"
        ON storage.objects FOR UPDATE
        USING (
            (storage.foldername(name))[1] = get_auth_business_id()::text
            OR is_super_admin()
            OR auth.jwt() ->> 'role' = 'service_role'
        );

        -- 5. Delete Objects: Tenant users can only delete within their own {business_id} folder
        CREATE POLICY "Tenant users can delete files in their business folder"
        ON storage.objects FOR DELETE
        USING (
            (storage.foldername(name))[1] = get_auth_business_id()::text
            OR is_super_admin()
            OR auth.jwt() ->> 'role' = 'service_role'
        );
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;


-- >>>>>>>>>>>>>>>>>> END FILE: 06_storage_buckets.sql <<<<<<<<<<<<<<<<<<


-- >>>>>>>>>>>>>>>>>> BEGIN FILE: 07_auth_users_and_triggers.sql <<<<<<<<<<<<<<<<<<

-- ============================================================
-- HARSH APEX SMART BUSINESS SUITE - 07_AUTH_USERS_AND_TRIGGERS.SQL
-- Supabase GoTrue Auth Profile Sync Trigger
-- (Safe and idempotent for Supabase Cloud managed environment)
-- ============================================================

-- 1. PROFILE AUTO-SYNC TRIGGER FUNCTION
-- Automatically creates or syncs public.profiles when a new user is created in GoTrue Auth
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id UUID;
    default_business_id UUID;
BEGIN
    SELECT id INTO default_role_id FROM public.roles WHERE code = 'OWNER' LIMIT 1;
    SELECT id INTO default_business_id FROM public.businesses WHERE is_demo = true LIMIT 1;

    INSERT INTO public.profiles (user_id, email, full_name, role_id, business_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(default_role_id, 'd0000001-0000-0000-0000-000000000001'::UUID),
        COALESCE(default_business_id, 'a1000000-0000-0000-0000-000000000001'::UUID)
    )
    ON CONFLICT (email) DO UPDATE SET 
        user_id = EXCLUDED.user_id,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. BIND TRIGGER TO auth.users SAFELY
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;


-- >>>>>>>>>>>>>>>>>> END FILE: 07_auth_users_and_triggers.sql <<<<<<<<<<<<<<<<<<

