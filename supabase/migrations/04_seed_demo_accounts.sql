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
