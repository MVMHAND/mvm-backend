-- ================================================
-- SEED SUPER ADMIN USER
-- ================================================
-- This migration creates the Super Admin user with credentials:
-- Email: superadmin@mvm.com
-- Password: 12345678
-- ================================================

-- First, get the Super Admin role ID
DO $$
DECLARE
    super_admin_role_id UUID;
    new_user_id UUID;
BEGIN
    -- Get Super Admin role
    SELECT id INTO super_admin_role_id FROM public.roles WHERE is_super_admin = TRUE LIMIT 1;
    
    IF super_admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Super Admin role not found. Please run initial migration first.';
    END IF;

    -- Generate a new UUID for the user
    new_user_id := extensions.uuid_generate_v4();

    -- Check if user already exists
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'superadmin@mvm.com') THEN
        RAISE NOTICE 'Super Admin user already exists, skipping creation.';
        RETURN;
    END IF;

    -- Insert into auth.users
    -- Password: 12345678 (bcrypt hash with cost 10)
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change_token_current
    ) VALUES (
        new_user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'superadmin@mvm.com',
        -- bcrypt hash for '12345678' with cost 10
        '$2a$10$PynM7VqU8.gz42QV3gWDUeM2J2m3D2o3S7wR3K1FEJ/VBIqhT4ZHy',
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"name": "Super Admin"}',
        FALSE,
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );

    -- Insert into auth.identities (required for login)
    INSERT INTO auth.identities (
        id,
        provider_id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        extensions.uuid_generate_v4(),
        new_user_id::text,
        new_user_id,
        jsonb_build_object(
            'sub', new_user_id::text,
            'email', 'superadmin@mvm.com',
            'email_verified', true,
            'phone_verified', false
        ),
        'email',
        NOW(),
        NOW(),
        NOW()
    );

    -- Insert into profiles
    INSERT INTO public.profiles (
        id,
        name,
        email,
        status,
        role_id,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        'Super Admin',
        'superadmin@mvm.com',
        'active',
        super_admin_role_id,
        NOW(),
        NOW()
    );

    RAISE NOTICE 'Super Admin user created successfully with email: superadmin@mvm.com';
END $$;
