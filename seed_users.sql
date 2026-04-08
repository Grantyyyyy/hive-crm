-- ============================================================
-- USER SEEDER — Supabase Auth
-- ============================================================
-- Creates test accounts with different roles.
-- Run this in the Supabase SQL Editor.
--
-- PASSWORDS: password123 (for all accounts)
-- ============================================================

DO $$
DECLARE
  v_admin_id UUID;
  v_manager_id UUID;
  v_agent_id UUID;
  
  v_admin_role_id UUID;
  v_manager_role_id UUID;
  v_agent_role_id UUID;
BEGIN
  -- ── 1. Ensure Roles Exist ───────────────────────────────────
  -- We use a dummy owner_id for system roles initially, 
  -- or update them after admin is created.
  
  -- Admin Role
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Admin') THEN
    INSERT INTO roles (name, description, color, is_system, owner_id)
    VALUES ('Admin', 'Full system access', '#ef4444', true, 'system')
    RETURNING id INTO v_admin_role_id;
  ELSE
    SELECT id INTO v_admin_role_id FROM roles WHERE name = 'Admin' LIMIT 1;
  END IF;

  -- Manager Role
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Manager') THEN
    INSERT INTO roles (name, description, color, is_system, owner_id)
    VALUES ('Manager', 'Team management', '#3b82f6', true, 'system')
    RETURNING id INTO v_manager_role_id;
  ELSE
    SELECT id INTO v_manager_role_id FROM roles WHERE name = 'Manager' LIMIT 1;
  END IF;

  -- Agent Role
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Agent') THEN
    INSERT INTO roles (name, description, color, is_system, owner_id)
    VALUES ('Agent', 'Basic access', '#10b981', true, 'system')
    RETURNING id INTO v_agent_role_id;
  ELSE
    SELECT id INTO v_agent_role_id FROM roles WHERE name = 'Agent' LIMIT 1;
  END IF;


  -- ── 2. Create Admin User ────────────────────────────────────
  -- admin@example.com
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@example.com') THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, 
      email_confirmed_at, created_at, updated_at, 
      raw_app_meta_data, raw_user_meta_data, is_super_admin,
      confirmation_token, recovery_token, email_change_token_new, email_change, phone_change, reauthentication_token, email_change_token_current, phone_change_token
    ) VALUES (
      gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'admin@example.com', crypt('password123', gen_salt('bf', 10)),
      NOW(), NOW(), NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"System Admin","role":"Admin"}'::jsonb,
      false,
      '', '', '', '', '', '', '', ''
    ) RETURNING id INTO v_admin_id;

    -- Identity for login
    INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    VALUES (
      v_admin_id, v_admin_id, v_admin_id::text, 'email', 
      jsonb_build_object('sub', v_admin_id::text, 'email', 'admin@example.com', 'email_verified', true, 'phone_verified', false),
      NOW(), NOW(), NOW()
    );


    INSERT INTO public.app_users (auth_user_id, email, name, role_id, owner_id)
    VALUES (v_admin_id, 'admin@example.com', 'System Admin', v_admin_role_id, v_admin_id::text);
    
    -- Update roles to be owned by this admin
    UPDATE roles SET owner_id = v_admin_id::text WHERE owner_id = 'system';
    
    RAISE NOTICE '✅ Admin created: admin@example.com';
  ELSE
    SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@example.com';
    RAISE NOTICE 'ℹ️ Admin already exists.';
  END IF;


  -- ── 3. Create Manager User ──────────────────────────────────
  -- manager@example.com
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'manager@example.com') THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, 
      email_confirmed_at, created_at, updated_at, 
      raw_app_meta_data, raw_user_meta_data, is_super_admin,
      confirmation_token, recovery_token, email_change_token_new, email_change, phone_change, reauthentication_token, email_change_token_current, phone_change_token
    ) VALUES (
      gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'manager@example.com', crypt('password123', gen_salt('bf', 10)),
      NOW(), NOW(), NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Team Manager","role":"Manager"}'::jsonb,
      false,
      '', '', '', '', '', '', '', ''
    ) RETURNING id INTO v_manager_id;

    -- Identity for login
    INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    VALUES (
      v_manager_id, v_manager_id, v_manager_id::text, 'email', 
      jsonb_build_object('sub', v_manager_id::text, 'email', 'manager@example.com', 'email_verified', true, 'phone_verified', false),
      NOW(), NOW(), NOW()
    );


    INSERT INTO public.app_users (auth_user_id, email, name, role_id, owner_id)
    VALUES (v_manager_id, 'manager@example.com', 'Team Manager', v_manager_role_id, v_admin_id::text);
    
    RAISE NOTICE '✅ Manager created: manager@example.com';
  ELSE
    RAISE NOTICE 'ℹ️ Manager already exists.';
  END IF;


  -- ── 4. Create Agent User ────────────────────────────────────
  -- agent@example.com
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'agent@example.com') THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, 
      email_confirmed_at, created_at, updated_at, 
      raw_app_meta_data, raw_user_meta_data, is_super_admin,
      confirmation_token, recovery_token, email_change_token_new, email_change, phone_change, reauthentication_token, email_change_token_current, phone_change_token
    ) VALUES (
      gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'agent@example.com', crypt('password123', gen_salt('bf', 10)),
      NOW(), NOW(), NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Sales Agent","role":"Agent"}'::jsonb,
      false,
      '', '', '', '', '', '', '', ''
    ) RETURNING id INTO v_agent_id;

    -- Identity for login
    INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    VALUES (
      v_agent_id, v_agent_id, v_agent_id::text, 'email', 
      jsonb_build_object('sub', v_agent_id::text, 'email', 'agent@example.com', 'email_verified', true, 'phone_verified', false),
      NOW(), NOW(), NOW()
    );


    INSERT INTO public.app_users (auth_user_id, email, name, role_id, owner_id)
    VALUES (v_agent_id, 'agent@example.com', 'Sales Agent', v_agent_role_id, v_admin_id::text);
    
    RAISE NOTICE '✅ Agent created: agent@example.com';
  ELSE
    RAISE NOTICE 'ℹ️ Agent already exists.';
  END IF;

  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '  🚀 USER SEEDING COMPLETE';
  RAISE NOTICE '  Passwords for all accounts: password123';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';

END $$;
