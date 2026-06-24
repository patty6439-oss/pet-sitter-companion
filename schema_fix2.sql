-- schema_fix2.sql
-- Fix: id columns are missing DEFAULT gen_random_uuid()
-- The original schema.sql defined them as UUID NOT NULL with no default,
-- so every INSERT fails because Supabase doesn't auto-generate a UUID.
--
-- Run this entire script in the Supabase SQL Editor.

ALTER TABLE users                ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE pets                 ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE medications          ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE daily_tasks          ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE care_logs            ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE proof_of_life_photos ALTER COLUMN id SET DEFAULT gen_random_uuid();
