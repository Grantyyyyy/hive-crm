-- ============================================================
-- DEMO ACCOUNT SEEDER — Supabase Auth Migration
-- ============================================================
-- Creates 1 demo user + supporting data for every module.
-- Run this in the Supabase SQL Editor.
--
-- LOGIN: demo@crmhub.dev
-- PASSWORD: password123
-- ============================================================

DO $$
DECLARE
  v_user_id UUID;
  v_uid TEXT; -- text version for owner_id columns
BEGIN
  -- ── 1. Create the Supabase Auth user ─────────────────────────
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'demo@crmhub.dev') THEN
    RAISE NOTICE 'Demo user already exists, skipping auth.user creation.';
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'demo@crmhub.dev';
  ELSE
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_sent_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'demo@crmhub.dev',
      crypt('password123', gen_salt('bf', 10)),
      NOW(),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Demo User","role":"Admin"}'::jsonb,
      false
    )
    RETURNING id INTO v_user_id;

    RAISE NOTICE '✅ Auth user created: %', v_user_id;
  END IF;

  v_uid := v_user_id::text;

  -- ── 2. Ensure default roles exist ─────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Admin') THEN
    INSERT INTO roles (name, description, color, is_system, owner_id)
    VALUES ('Admin', 'Full system access', '#6366f1', true, v_uid);
    RAISE NOTICE '✅ Admin role created.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Manager') THEN
    INSERT INTO roles (name, description, color, is_system, owner_id)
    VALUES ('Manager', 'Team management access', '#10b981', true, v_uid);
    RAISE NOTICE '✅ Manager role created.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Agent') THEN
    INSERT INTO roles (name, description, color, is_system, owner_id)
    VALUES ('Agent', 'Basic CRM access', '#f59e0b', true, v_uid);
    RAISE NOTICE '✅ Agent role created.';
  END IF;

  -- ── 3. Create app_users entry ───────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = v_user_id) THEN
    INSERT INTO app_users (
      auth_user_id,
      email,
      name,
      username,
      role_id,
      owner_id
    ) VALUES (
      v_user_id,
      'demo@crmhub.dev',
      'Demo User',
      'demouser',
      (SELECT id FROM roles WHERE name = 'Admin' LIMIT 1),
      v_uid
    );
    RAISE NOTICE '✅ app_users entry created.';
  END IF;

  -- ── 4. Seed sample data for every module ────────────────────

  -- 4a. Contacts
  IF NOT EXISTS (SELECT 1 FROM contacts WHERE owner_id = v_uid) THEN
    INSERT INTO contacts (
      first_name, last_name, email, phone, company,
      status, source, owner_id
    ) VALUES
      ('Alice', 'Johnson', 'alice@acme.io', '+1-555-0101', 'Acme Corp', 'active', 'referral', v_uid),
      ('Bob', 'Smith', 'bob@widgets.com', '+1-555-0102', 'Widgets Inc', 'active', 'website', v_uid),
      ('Carol', 'Davis', 'carol@techstart.io', '+1-555-0103', 'TechStart', 'inactive', 'cold_call', v_uid),
      ('David', 'Lee', 'david@globalco.com', '+1-555-0104', 'GlobalCo', 'active', 'linkedin', v_uid),
      ('Eva', 'Martinez', 'eva@innovate.io', '+1-555-0105', 'Innovate Labs', 'active', 'referral', v_uid);
    RAISE NOTICE '✅ 5 sample contacts seeded.';
  END IF;

  -- 4b. Leads
  IF NOT EXISTS (SELECT 1 FROM leads WHERE owner_id = v_uid) THEN
    INSERT INTO leads (
      name, email, phone, company, status,
      score, source, owner_id
    ) VALUES
      ('Frank Wilson', 'frank@startup.io', '+1-555-0201', 'Startup.io', 'new', 65, 'website', v_uid),
      ('Grace Kim', 'grace@enterprise.com', '+1-555-0202', 'Enterprise Co', 'contacted', 80, 'referral', v_uid),
      ('Henry Chen', 'henry@dataflow.io', '+1-555-0203', 'DataFlow', 'qualified', 90, 'linkedin', v_uid),
      ('Iris Patel', 'iris@cloudnine.com', '+1-555-0204', 'CloudNine', 'new', 45, 'website', v_uid);
    RAISE NOTICE '✅ 4 sample leads seeded.';
  END IF;

  -- 4c. Deals
  IF NOT EXISTS (SELECT 1 FROM deals WHERE owner_id = v_uid) THEN
    INSERT INTO deals (
      title, value, stage, status,
      close_date, contact_id, owner_id
    ) VALUES
      ('Acme Corp Annual License', 48000, 'proposal', 'open',
        '2026-06-15',
        (SELECT id FROM contacts WHERE email = 'alice@acme.io' LIMIT 1),
        v_uid),
      ('Widgets Inc Integration', 32000, 'negotiation', 'open',
        '2026-05-20',
        (SELECT id FROM contacts WHERE email = 'bob@widgets.com' LIMIT 1),
        v_uid),
      ('TechStart Pilot Program', 15000, 'discovery', 'open',
        '2026-08-01',
        (SELECT id FROM contacts WHERE email = 'carol@techstart.io' LIMIT 1),
        v_uid),
      ('GlobalCo Enterprise Suite', 120000, 'closed_won', 'won',
        '2026-03-10',
        (SELECT id FROM contacts WHERE email = 'david@globalco.com' LIMIT 1),
        v_uid),
      ('Innovate Labs Expansion', 67000, 'proposal', 'open',
        '2026-07-01',
        (SELECT id FROM contacts WHERE email = 'eva@innovate.io' LIMIT 1),
        v_uid);
    RAISE NOTICE '✅ 5 sample deals seeded.';
  END IF;

  -- 4d. Tasks
  IF NOT EXISTS (SELECT 1 FROM tasks WHERE owner_id = v_uid) THEN
    INSERT INTO tasks (
      title, description, status, priority,
      due_date, owner_id
    ) VALUES
      ('Follow up with Acme Corp on proposal', 'Send revised pricing after their feedback', 'open', 'high',
        '2026-04-12', v_uid),
      ('Prepare Q2 sales forecast', 'Aggregate all open deals and pipeline data', 'in_progress', 'medium',
        '2026-04-20', v_uid),
      ('Review contract with GlobalCo', 'Legal team flagged 3 clauses for revision', 'open', 'high',
        '2026-04-10', v_uid),
      ('Schedule demo for Widgets Inc', 'Set up product walkthrough with engineering team', 'open', 'medium',
        '2026-04-18', v_uid),
      ('Update CRM pipeline stages', 'Remove obsolete stage "Follow-up Scheduled"', 'completed', 'low',
        '2026-04-05', v_uid),
      ('Send onboarding materials to Innovate Labs', 'Include API docs and pricing sheet', 'open', 'medium',
        '2026-04-22', v_uid);
    RAISE NOTICE '✅ 6 sample tasks seeded.';
  END IF;

  -- 4e. Projects
  IF NOT EXISTS (SELECT 1 FROM projects WHERE owner_id = v_uid) THEN
    INSERT INTO projects (
      name, description, color, owner_id
    ) VALUES
      ('Q2 Revenue Push', 'Drive all Q2 deals to close', '#6366f1', v_uid),
      ('Enterprise Onboarding', 'Standardize onboarding for enterprise clients', '#10b981', v_uid),
      ('CRM Data Cleanup', 'Audit and clean all CRM records', '#f59e0b', v_uid);
    RAISE NOTICE '✅ 3 sample projects seeded.';
  END IF;

  -- 4f. Quotes
  IF NOT EXISTS (SELECT 1 FROM quotes WHERE user_id = v_uid) THEN
    INSERT INTO quotes (
      quote_number, customer_name, amount, status,
      valid_until, notes, user_id
    ) VALUES
      ('QT-2026-001', 'Acme Corp', 48000, 'sent',
        '2026-05-15', 'Annual license with 10% discount for early signing', v_uid),
      ('QT-2026-002', 'Widgets Inc', 32000, 'draft',
        '2026-05-30', 'Integration package + 12-month support', v_uid),
      ('QT-2026-003', 'GlobalCo', 120000, 'accepted',
        '2026-04-30', 'Enterprise suite — 3-year commitment', v_uid);
    RAISE NOTICE '✅ 3 sample quotes seeded.';
  END IF;

  -- 4g. Sales Orders
  IF NOT EXISTS (SELECT 1 FROM sales_orders WHERE user_id = v_uid) THEN
    INSERT INTO sales_orders (
      order_number, customer_name, amount, status,
      order_date, stock_reserved, stock_deducted, user_id
    ) VALUES
      ('SO-2026-001', 'GlobalCo', 120000, 'delivered',
        '2026-03-15', true, true, v_uid),
      ('SO-2026-002', 'Acme Corp', 48000, 'processing',
        '2026-04-05', true, false, v_uid),
      ('SO-2026-003', 'TechStart', 15000, 'pending',
        '2026-04-10', false, false, v_uid);
    RAISE NOTICE '✅ 3 sample sales orders seeded.';
  END IF;

  -- 4h. Inventory
  IF NOT EXISTS (SELECT 1 FROM inventory WHERE user_id = v_uid) THEN
    INSERT INTO inventory (
      name, sku, category, quantity, unit_price,
      low_stock_threshold, user_id
    ) VALUES
      ('Enterprise License - Tier 1', 'ENT-T1-001', 'Software', 500, 12000, 50, v_uid),
      ('Enterprise License - Tier 2', 'ENT-T2-001', 'Software', 300, 24000, 30, v_uid),
      ('Integration Module A', 'INT-A-001', 'Add-on', 150, 5000, 20, v_uid),
      ('Support Package - Gold', 'SUP-GLD-001', 'Service', 1000, 3000, 100, v_uid),
      ('Training Session Bundle', 'TRN-BDL-001', 'Service', 200, 8000, 10, v_uid),
      ('API Access - Monthly', 'API-MO-001', 'Software', 9999, 500, 500, v_uid);
    RAISE NOTICE '✅ 6 sample inventory items seeded.';
  END IF;

  -- 4i. Vendors
  IF NOT EXISTS (SELECT 1 FROM vendors WHERE user_id = v_uid) THEN
    INSERT INTO vendors (
      name, email, phone, category, status,
      user_id
    ) VALUES
      ('CloudHost Solutions', 'sales@cloudhost.io', '+1-555-0301', 'Hosting', 'active', v_uid),
      ('DataPipe Inc', 'info@datapipe.com', '+1-555-0302', 'Networking', 'active', v_uid),
      ('SecureVault Ltd', 'contact@securevault.io', '+1-555-0303', 'Security', 'inactive', v_uid),
      ('DevTools Pro', 'sales@devtools.pro', '+1-555-0304', 'Software', 'active', v_uid);
    RAISE NOTICE '✅ 4 sample vendors seeded.';
  END IF;

  -- 4j. Purchase Orders
  IF NOT EXISTS (SELECT 1 FROM purchase_orders WHERE user_id = v_uid) THEN
    INSERT INTO purchase_orders (
      po_number, vendor_name, amount, status,
      order_date, user_id
    ) VALUES
      ('PO-2026-001', 'CloudHost Solutions', 18000, 'received',
        '2026-03-01', v_uid),
      ('PO-2026-002', 'DevTools Pro', 12000, 'pending',
        '2026-04-10', v_uid),
      ('PO-2026-003', 'DataPipe Inc', 25000, 'ordered',
        '2026-04-15', v_uid);
    RAISE NOTICE '✅ 3 sample purchase orders seeded.';
  END IF;

  -- 4k. Purchase Requests
  IF NOT EXISTS (SELECT 1 FROM purchase_requests WHERE user_id = v_uid) THEN
    INSERT INTO purchase_requests (
      request_number, requester_name, reason, estimated_cost,
      status, department, user_id
    ) VALUES
      ('PR-2026-001', 'Demo User', 'Additional server capacity for Q2 launch', 30000,
        'approved', 'Engineering', v_uid),
      ('PR-2026-002', 'Demo User', 'Annual DevTools Pro license renewal', 12000,
        'pending', 'Engineering', v_uid),
      ('PR-2026-003', 'Demo User', 'New security audit tools', 8500,
        'draft', 'Security', v_uid);
    RAISE NOTICE '✅ 3 sample purchase requests seeded.';
  END IF;

  -- 4l. Activities
  IF NOT EXISTS (SELECT 1 FROM activities WHERE user_id = v_uid) THEN
    INSERT INTO activities (
      type, description, contact_id, user_id
    ) VALUES
      ('call', 'Discussed renewal terms — 10% discount agreed',
        (SELECT id FROM contacts WHERE email = 'alice@acme.io' LIMIT 1), v_uid),
      ('email', 'Sent product documentation package',
        (SELECT id FROM contacts WHERE email = 'bob@widgets.com' LIMIT 1), v_uid),
      ('meeting', 'Onboarding kickoff with GlobalCo team',
        (SELECT id FROM contacts WHERE email = 'david@globalco.com' LIMIT 1), v_uid),
      ('note', 'Interested in expanding to 3 more departments next quarter',
        (SELECT id FROM contacts WHERE email = 'eva@innovate.io' LIMIT 1), v_uid);
    RAISE NOTICE '✅ 4 sample activities seeded.';
  END IF;

  -- 4m. Task Tags
  IF NOT EXISTS (SELECT 1 FROM task_tags WHERE owner_id = v_uid) THEN
    INSERT INTO task_tags (name, color, owner_id) VALUES
      ('urgent', '#ef4444', v_uid),
      ('follow-up', '#3b82f6', v_uid),
      ('blocked', '#f59e0b', v_uid),
      ('review', '#8b5cf6', v_uid);
    RAISE NOTICE '✅ 4 sample task tags seeded.';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '  🚀 DEMO ACCOUNT READY';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '  Email:    demo@crmhub.dev';
  RAISE NOTICE '  Password: password123';
  RAISE NOTICE '  User ID:  %', v_user_id;
  RAISE NOTICE '';
  RAISE NOTICE '  Modules seeded: Contacts, Leads, Deals, Tasks, Projects,';
  RAISE NOTICE '  Quotes, Sales Orders, Inventory, Vendors,';
  RAISE NOTICE '  Purchase Orders, Purchase Requests, Activities, Task Tags';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';

END $$;
