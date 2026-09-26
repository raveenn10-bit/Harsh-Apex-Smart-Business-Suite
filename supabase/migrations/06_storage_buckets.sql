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
END $$;

-- 2. CREATE STORAGE RLS POLICIES
-- Tenant-aware path format: {business_id}/{resource_id}/{filename}

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
        -- Enable RLS on storage.objects
        ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies if any
        DROP POLICY IF EXISTS "Public buckets are viewable by everyone" ON storage.objects;
        DROP POLICY IF EXISTS "Private invoice assets viewable only by tenant" ON storage.objects;
        DROP POLICY IF EXISTS "Tenant users can upload files to their business folder" ON storage.objects;
        DROP POLICY IF EXISTS "Tenant users can update files in their business folder" ON storage.objects;
        DROP POLICY IF EXISTS "Tenant users can delete files in their business folder" ON storage.objects;

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
END $$;
