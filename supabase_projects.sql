-- Projects Table for Task Organization
-- Run this in your Supabase SQL Editor

-- First, drop the existing table if it has wrong schema
DROP TABLE IF EXISTS projects CASCADE;

-- Recreate with correct schema
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#6366f1',
  owner_id TEXT NOT NULL,
  user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- RLS Policies (Row Level Security)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all projects
CREATE POLICY "Authenticated users can view projects"
  ON projects FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert projects
CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'sub') = COALESCE(user_id, owner_id));

-- Allow owners to update their projects
CREATE POLICY "Owners can update their projects"
  ON projects FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'sub') = COALESCE(user_id, owner_id));

-- Allow owners to delete their projects
CREATE POLICY "Owners can delete their projects"
  ON projects FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'sub') = COALESCE(user_id, owner_id));

-- Add project_id column to tasks table if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
  END IF;
END $$;
