-- schema_fix3.sql
-- Make optional daily_tasks fields nullable.
-- The original schema.sql declared instructions and scheduled_time
-- as NOT NULL, but both are optional when creating a task.
-- Run this in the Supabase SQL Editor.

ALTER TABLE daily_tasks ALTER COLUMN instructions   DROP NOT NULL;
ALTER TABLE daily_tasks ALTER COLUMN scheduled_time DROP NOT NULL;
