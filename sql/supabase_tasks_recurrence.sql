-- Recurring Tasks Migration
-- Run this in your Supabase SQL Editor

-- Add recurrence columns to tasks table
DO $$ 
BEGIN 
  -- Recurrence pattern
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'recurrence_pattern'
  ) THEN
    ALTER TABLE tasks ADD COLUMN recurrence_pattern TEXT;
  END IF;

  -- Recurrence interval (every X days/weeks/months)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'recurrence_interval'
  ) THEN
    ALTER TABLE tasks ADD COLUMN recurrence_interval INTEGER DEFAULT 1;
  END IF;

  -- Recurrence end date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'recurrence_end_date'
  ) THEN
    ALTER TABLE tasks ADD COLUMN recurrence_end_date TIMESTAMPTZ;
  END IF;

  -- Parent task ID (for linking recurring instances)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'parent_task_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN parent_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;
  END IF;

  -- Next occurrence date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'next_occurrence'
  ) THEN
    ALTER TABLE tasks ADD COLUMN next_occurrence TIMESTAMPTZ;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_recurrence_pattern ON tasks(recurrence_pattern);
CREATE INDEX IF NOT EXISTS idx_tasks_next_occurrence ON tasks(next_occurrence);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);

-- Create function to calculate next occurrence date
CREATE OR REPLACE FUNCTION calculate_next_occurrence(
  input_date TIMESTAMPTZ,
  pattern TEXT,
  interval_num INTEGER
)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  CASE pattern
    WHEN 'daily' THEN
      RETURN input_date + (interval_num || ' days')::INTERVAL;
    WHEN 'weekly' THEN
      RETURN input_date + (interval_num || ' weeks')::INTERVAL;
    WHEN 'monthly' THEN
      RETURN input_date + (interval_num || ' months')::INTERVAL;
    WHEN 'yearly' THEN
      RETURN input_date + (interval_num || ' years')::INTERVAL;
    WHEN 'custom' THEN
      RETURN input_date + (interval_num || ' days')::INTERVAL;
    ELSE
      RETURN NULL;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to create next recurring task instance
CREATE OR REPLACE FUNCTION create_recurring_task_instance(
  parent_task_id UUID
)
RETURNS UUID AS $$
DECLARE
  parent_task RECORD;
  new_task_id UUID;
  new_due_date TIMESTAMPTZ;
BEGIN
  -- Get parent task details
  SELECT * INTO parent_task
  FROM tasks
  WHERE id = parent_task_id;

  IF parent_task IS NULL THEN
    RETURN NULL;
  END IF;

  -- Calculate new due date
  new_due_date := calculate_next_occurrence(
    parent_task.due_date::TIMESTAMPTZ,
    parent_task.recurrence_pattern,
    COALESCE(parent_task.recurrence_interval, 1)
  );

  -- Check if we've passed the end date
  IF parent_task.recurrence_end_date IS NOT NULL 
     AND new_due_date > parent_task.recurrence_end_date::TIMESTAMPTZ THEN
    -- Clear recurrence on parent task
    UPDATE tasks
    SET recurrence_pattern = NULL,
        recurrence_interval = NULL,
        recurrence_end_date = NULL,
        next_occurrence = NULL
    WHERE id = parent_task_id;
    
    RETURN NULL;
  END IF;

  -- Create new task instance
  INSERT INTO tasks (
    title,
    description,
    due_date,
    priority,
    status,
    owner_id,
    created_by,
    entity_type,
    entity_id,
    contact_id,
    deal_id,
    lead_id,
    project_id,
    parent_task_id,
    recurrence_pattern,
    recurrence_interval,
    recurrence_end_date,
    next_occurrence,
    created_at,
    updated_at
  )
  VALUES (
    parent_task.title,
    parent_task.description,
    new_due_date,
    parent_task.priority,
    'open',
    parent_task.owner_id,
    parent_task.created_by,
    parent_task.entity_type,
    parent_task.entity_id,
    parent_task.contact_id,
    parent_task.deal_id,
    parent_task.lead_id,
    parent_task.project_id,
    parent_task_id,
    parent_task.recurrence_pattern,
    parent_task.recurrence_interval,
    parent_task.recurrence_end_date,
    calculate_next_occurrence(
      new_due_date,
      parent_task.recurrence_pattern,
      COALESCE(parent_task.recurrence_interval, 1)
    ),
    NOW(),
    NOW()
  )
  RETURNING id INTO new_task_id;

  -- Update parent task's next_occurrence
  UPDATE tasks
  SET next_occurrence = new_due_date
  WHERE id = parent_task_id;

  RETURN new_task_id;
END;
$$ LANGUAGE plpgsql;
