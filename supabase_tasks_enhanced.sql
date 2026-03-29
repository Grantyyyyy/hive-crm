-- Enhanced Task Management Migration
-- Run this in your Supabase SQL Editor

-- 1. Task Tags Table
CREATE TABLE IF NOT EXISTS task_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  owner_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_tags_owner ON task_tags(owner_id);

ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view task tags" ON task_tags;
CREATE POLICY "Authenticated users can view task tags"
  ON task_tags FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Owners can create task tags" ON task_tags;
CREATE POLICY "Owners can create task tags"
  ON task_tags FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = owner_id);

DROP POLICY IF EXISTS "Owners can update their tags" ON task_tags;
CREATE POLICY "Owners can update their tags"
  ON task_tags FOR UPDATE TO authenticated
  USING (auth.uid()::text = owner_id);

DROP POLICY IF EXISTS "Owners can delete their tags" ON task_tags;
CREATE POLICY "Owners can delete their tags"
  ON task_tags FOR DELETE TO authenticated
  USING (auth.uid()::text = owner_id);

-- 2. Task-Tag Junction Table
CREATE TABLE IF NOT EXISTS task_tag_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES task_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_task_tag_links_task ON task_tag_links(task_id);
CREATE INDEX IF NOT EXISTS idx_task_tag_links_tag ON task_tag_links(tag_id);

ALTER TABLE task_tag_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view task tag links" ON task_tag_links;
CREATE POLICY "Authenticated users can view task tag links"
  ON task_tag_links FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can create task tag links" ON task_tag_links;
CREATE POLICY "Authenticated users can create task tag links"
  ON task_tag_links FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete task tag links" ON task_tag_links;
CREATE POLICY "Authenticated users can delete task tag links"
  ON task_tag_links FOR DELETE TO authenticated USING (true);

-- 3. Task Subtasks Table
CREATE TABLE IF NOT EXISTS task_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_subtasks_task ON task_subtasks(task_id);

ALTER TABLE task_subtasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view subtasks" ON task_subtasks;
CREATE POLICY "Authenticated users can view subtasks"
  ON task_subtasks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can create subtasks" ON task_subtasks;
CREATE POLICY "Authenticated users can create subtasks"
  ON task_subtasks FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update subtasks" ON task_subtasks;
CREATE POLICY "Authenticated users can update subtasks"
  ON task_subtasks FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete subtasks" ON task_subtasks;
CREATE POLICY "Authenticated users can delete subtasks"
  ON task_subtasks FOR DELETE TO authenticated USING (true);

-- 4. Task Comments Table
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created ON task_comments(created_at DESC);

ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view comments" ON task_comments;
CREATE POLICY "Authenticated users can view comments"
  ON task_comments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON task_comments;
CREATE POLICY "Authenticated users can create comments"
  ON task_comments FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authors can update their comments" ON task_comments;
CREATE POLICY "Authors can update their comments"
  ON task_comments FOR UPDATE TO authenticated
  USING (auth.uid()::text = author_id);

DROP POLICY IF EXISTS "Authors can delete their comments" ON task_comments;
CREATE POLICY "Authors can delete their comments"
  ON task_comments FOR DELETE TO authenticated
  USING (auth.uid()::text = author_id);

-- 5. Task Activity Log Table
CREATE TABLE IF NOT EXISTS task_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('created', 'updated', 'completed', 'reopened', 'assigned', 'comment', 'attachment')),
  description TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_activities_task ON task_activities(task_id);
CREATE INDEX IF NOT EXISTS idx_task_activities_created ON task_activities(created_at DESC);

ALTER TABLE task_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view activity logs" ON task_activities;
CREATE POLICY "Authenticated users can view activity logs"
  ON task_activities FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "System can create activity logs" ON task_activities;
CREATE POLICY "System can create activity logs"
  ON task_activities FOR INSERT TO authenticated WITH CHECK (true);

-- 6. Task Time Entries Table
CREATE TABLE IF NOT EXISTS task_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_time_entries_task ON task_time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_task_time_entries_user ON task_time_entries(user_id);

ALTER TABLE task_time_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view time entries" ON task_time_entries;
CREATE POLICY "Authenticated users can view time entries"
  ON task_time_entries FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can create time entries" ON task_time_entries;
CREATE POLICY "Authenticated users can create time entries"
  ON task_time_entries FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their time entries" ON task_time_entries;
CREATE POLICY "Users can update their time entries"
  ON task_time_entries FOR UPDATE TO authenticated
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete their time entries" ON task_time_entries;
CREATE POLICY "Users can delete their time entries"
  ON task_time_entries FOR DELETE TO authenticated
  USING (auth.uid()::text = user_id);

-- 7. Add new columns to tasks table
DO $$ 
BEGIN 
  -- Assigned to (array of user IDs)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE tasks ADD COLUMN assigned_to TEXT[];
  END IF;

  -- Estimated hours
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'estimated_hours'
  ) THEN
    ALTER TABLE tasks ADD COLUMN estimated_hours INTEGER;
  END IF;

  -- Tracked seconds
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'tracked_seconds'
  ) THEN
    ALTER TABLE tasks ADD COLUMN tracked_seconds INTEGER DEFAULT 0;
  END IF;

  -- JSONB storage for subtasks/comments (complementary to separate tables)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'subtasks'
  ) THEN
    ALTER TABLE tasks ADD COLUMN subtasks JSONB DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'comments'
  ) THEN
    ALTER TABLE tasks ADD COLUMN comments JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- 8. Create or replace function to log task activity
CREATE OR REPLACE FUNCTION log_task_activity(
  p_task_id UUID,
  p_type TEXT,
  p_description TEXT,
  p_user_id TEXT,
  p_user_name TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO task_activities (task_id, type, description, user_id, user_name, metadata)
  VALUES (p_task_id, p_type, p_description, p_user_id, p_user_name, p_metadata)
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger to auto-log task status changes
CREATE OR REPLACE FUNCTION tasks_status_change_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'completed' THEN
      PERFORM log_task_activity(NEW.id, 'completed', 'Task marked as completed', NEW.owner_id, 'System');
    ELSIF OLD.status = 'completed' AND NEW.status != 'completed' THEN
      PERFORM log_task_activity(NEW.id, 'reopened', 'Task re-opened', NEW.owner_id, 'System');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_status_change ON tasks;
CREATE TRIGGER tasks_status_change
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION tasks_status_change_trigger();
