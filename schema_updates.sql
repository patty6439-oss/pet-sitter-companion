-- =============================================
-- Run this ENTIRE script in Supabase SQL Editor
-- before starting the app.
-- =============================================

-- 1. Fix broken FK constraints (original schema used wrong column)
ALTER TABLE care_logs DROP CONSTRAINT IF EXISTS care_logs_id_foreign;
ALTER TABLE proof_of_life_photos DROP CONSTRAINT IF EXISTS proof_of_life_photos_id_foreign;

ALTER TABLE care_logs ADD CONSTRAINT care_logs_daily_task_id_foreign
  FOREIGN KEY (daily_task_id) REFERENCES daily_tasks(id) ON DELETE CASCADE;

ALTER TABLE proof_of_life_photos ADD CONSTRAINT proof_of_life_photos_care_log_id_foreign
  FOREIGN KEY (care_log_id) REFERENCES care_logs(id) ON DELETE CASCADE;

-- 2. Add DEFAULT NOW() to all timestamp columns
ALTER TABLE users          ALTER COLUMN created_at    SET DEFAULT NOW();
ALTER TABLE pets           ALTER COLUMN created_at    SET DEFAULT NOW();
ALTER TABLE medications    ALTER COLUMN created_at    SET DEFAULT NOW();
ALTER TABLE daily_tasks    ALTER COLUMN created_at    SET DEFAULT NOW();
ALTER TABLE care_logs      ALTER COLUMN created_at    SET DEFAULT NOW();
ALTER TABLE care_logs      ALTER COLUMN completed_at  SET DEFAULT NOW();
ALTER TABLE proof_of_life_photos ALTER COLUMN uploaded_at SET DEFAULT NOW();

-- 3. Make optional pet fields nullable
ALTER TABLE pets ALTER COLUMN photo_url             DROP NOT NULL;
ALTER TABLE pets ALTER COLUMN breed                 DROP NOT NULL;
ALTER TABLE pets ALTER COLUMN age                   DROP NOT NULL;
ALTER TABLE pets ALTER COLUMN feeding_instructions  DROP NOT NULL;
ALTER TABLE pets ALTER COLUMN approved_foods        DROP NOT NULL;
ALTER TABLE pets ALTER COLUMN forbidden_foods       DROP NOT NULL;
ALTER TABLE pets ALTER COLUMN emergency_notes       DROP NOT NULL;

-- 4. Make optional medication fields nullable
ALTER TABLE medications ALTER COLUMN dosage               DROP NOT NULL;
ALTER TABLE medications ALTER COLUMN route                DROP NOT NULL;
ALTER TABLE medications ALTER COLUMN schedule_time        DROP NOT NULL;
ALTER TABLE medications ALTER COLUMN special_instructions DROP NOT NULL;

-- 5. Make optional care_log fields nullable
ALTER TABLE care_logs ALTER COLUMN notes        DROP NOT NULL;
ALTER TABLE care_logs ALTER COLUMN completed_at DROP NOT NULL;

-- 6. Make optional photo fields nullable
ALTER TABLE proof_of_life_photos ALTER COLUMN caption DROP NOT NULL;

-- 7. Trigger: auto-create public.users row when auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (new.id, new.email, NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. Enable Row Level Security on all tables
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets               ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE proof_of_life_photos ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies
CREATE POLICY "users_own_data" ON users
  FOR ALL USING (id = auth.uid());

CREATE POLICY "pets_own_data" ON pets
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "medications_own_data" ON medications
  FOR ALL USING (
    pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid())
  );

CREATE POLICY "daily_tasks_own_data" ON daily_tasks
  FOR ALL USING (
    pet_id IN (SELECT id FROM pets WHERE user_id = auth.uid())
  );

CREATE POLICY "care_logs_own_data" ON care_logs
  FOR ALL USING (
    daily_task_id IN (
      SELECT dt.id FROM daily_tasks dt
      JOIN pets p ON dt.pet_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "proof_photos_own_data" ON proof_of_life_photos
  FOR ALL USING (
    care_log_id IN (
      SELECT cl.id FROM care_logs cl
      JOIN daily_tasks dt ON cl.daily_task_id = dt.id
      JOIN pets p ON dt.pet_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );
