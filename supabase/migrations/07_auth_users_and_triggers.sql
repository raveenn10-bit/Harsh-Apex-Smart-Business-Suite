-- ============================================================
-- HARSH APEX SMART BUSINESS SUITE - 07_AUTH_USERS_AND_TRIGGERS.SQL
-- Supabase GoTrue Auth Users, Identities, and Profile Sync Trigger
-- ============================================================

-- 1. PROFILE AUTO-SYNC TRIGGER FUNCTION
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

-- Bind trigger if auth.users exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
    END IF;
END $$;

-- 2. SEED DEMO AUTH USERS IN AUTH.USERS
-- Passwords:
-- basic1@demo.harshapex.com.lk    -> BasicDemo@1
-- basic2@demo.harshapex.com.lk    -> BasicDemo@2
-- business1@demo.harshapex.com.lk -> BusinessDemo@1
-- business2@demo.harshapex.com.lk -> BusinessDemo@2
-- premium1@demo.harshapex.com.lk  -> PremiumDemo@1
-- premium2@demo.harshapex.com.lk  -> PremiumDemo@2
-- admin@harshapex.com.lk         -> ApexAdmin@2026

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES
        (
            '00000000-0000-0000-0000-000000000000',
            'c1000000-0000-0000-0000-000000000001',
            'authenticated',
            'authenticated',
            'basic1@demo.harshapex.com.lk',
            crypt('BasicDemo@1', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Kasun Perera"}',
            NOW(),
            NOW()
        ),
        (
            '00000000-0000-0000-0000-000000000000',
            'c2000000-0000-0000-0000-000000000002',
            'authenticated',
            'authenticated',
            'basic2@demo.harshapex.com.lk',
            crypt('BasicDemo@2', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Nadeesha Silva"}',
            NOW(),
            NOW()
        ),
        (
            '00000000-0000-0000-0000-000000000000',
            'c3000000-0000-0000-0000-000000000003',
            'authenticated',
            'authenticated',
            'business1@demo.harshapex.com.lk',
            crypt('BusinessDemo@1', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Rohan Jayasinghe"}',
            NOW(),
            NOW()
        ),
        (
            '00000000-0000-0000-0000-000000000000',
            'c4000000-0000-0000-0000-000000000004',
            'authenticated',
            'authenticated',
            'business2@demo.harshapex.com.lk',
            crypt('BusinessDemo@2', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Dilini Fernando"}',
            NOW(),
            NOW()
        ),
        (
            '00000000-0000-0000-0000-000000000000',
            'c5000000-0000-0000-0000-000000000005',
            'authenticated',
            'authenticated',
            'premium1@demo.harshapex.com.lk',
            crypt('PremiumDemo@1', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Harshana Wickramasinghe"}',
            NOW(),
            NOW()
        ),
        (
            '00000000-0000-0000-0000-000000000000',
            'c6000000-0000-0000-0000-000000000006',
            'authenticated',
            'authenticated',
            'premium2@demo.harshapex.com.lk',
            crypt('PremiumDemo@2', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Tharindu Rathnayake"}',
            NOW(),
            NOW()
        ),
        (
            '00000000-0000-0000-0000-000000000000',
            'c9000000-0000-0000-0000-000000000009',
            'authenticated',
            'authenticated',
            'admin@harshapex.com.lk',
            crypt('ApexAdmin@2026', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Harsh Apex Super Admin"}',
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            encrypted_password = EXCLUDED.encrypted_password,
            email_confirmed_at = EXCLUDED.email_confirmed_at;
    END IF;

    -- 3. SEED AUTH IDENTITIES FOR GOTRUE EMAIL/PASSWORD AUTHENTICATION
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'identities') THEN
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            provider_id,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES
        ('c1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', '{"sub":"c1000000-0000-0000-0000-000000000001","email":"basic1@demo.harshapex.com.lk"}', 'email', 'basic1@demo.harshapex.com.lk', NOW(), NOW(), NOW()),
        ('c2000000-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000002', '{"sub":"c2000000-0000-0000-0000-000000000002","email":"basic2@demo.harshapex.com.lk"}', 'email', 'basic2@demo.harshapex.com.lk', NOW(), NOW(), NOW()),
        ('c3000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-000000000003', '{"sub":"c3000000-0000-0000-0000-000000000003","email":"business1@demo.harshapex.com.lk"}', 'email', 'business1@demo.harshapex.com.lk', NOW(), NOW(), NOW()),
        ('c4000000-0000-0000-0000-000000000004', 'c4000000-0000-0000-0000-000000000004', '{"sub":"c4000000-0000-0000-0000-000000000004","email":"business2@demo.harshapex.com.lk"}', 'email', 'business2@demo.harshapex.com.lk', NOW(), NOW(), NOW()),
        ('c5000000-0000-0000-0000-000000000005', 'c5000000-0000-0000-0000-000000000005', '{"sub":"c5000000-0000-0000-0000-000000000005","email":"premium1@demo.harshapex.com.lk"}', 'email', 'premium1@demo.harshapex.com.lk', NOW(), NOW(), NOW()),
        ('c6000000-0000-0000-0000-000000000006', 'c6000000-0000-0000-0000-000000000006', '{"sub":"c6000000-0000-0000-0000-000000000006","email":"premium2@demo.harshapex.com.lk"}', 'email', 'premium2@demo.harshapex.com.lk', NOW(), NOW(), NOW()),
        ('c9000000-0000-0000-0000-000000000009', 'c9000000-0000-0000-0000-000000000009', '{"sub":"c9000000-0000-0000-0000-000000000009","email":"admin@harshapex.com.lk"}', 'email', 'admin@harshapex.com.lk', NOW(), NOW(), NOW())
        ON CONFLICT (provider, provider_id) DO NOTHING;
    END IF;
END $$;
