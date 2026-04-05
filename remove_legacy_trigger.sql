-- Script to remove legacy activity logging trigger
-- This trigger is being replaced by frontend-driven logging which includes actual user names.

DROP TRIGGER IF EXISTS tasks_status_change ON tasks;
DROP FUNCTION IF EXISTS tasks_status_change_trigger();
