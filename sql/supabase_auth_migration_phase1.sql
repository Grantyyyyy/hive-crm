-- Phase 1: Migrate app_users from Clerk to Supabase Auth
-- Run this in your Supabase SQL Editor

-- 1. Drop the old Clerk user ID column
ALTER TABLE app_users DROP COLUMN IF EXISTS clerk_user_id;

-- 2. Add the new Supabase auth user ID column (UUID, references auth.users)
ALTER TABLE app_users ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Clean up old index
DROP INDEX IF EXISTS idx_app_users_clerk_user_id;

-- 4. Create new index
CREATE INDEX IF NOT EXISTS idx_app_users_auth_user_id ON app_users(auth_user_id);
