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
