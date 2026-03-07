-- ContractorOS Database Schema
-- Run against Neon Postgres
-- Includes: tables, indexes, check constraints, RLS policies, triggers

-- ═══════════════════════════════════════════════════════════════
-- 1. TABLES
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS businesses (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  business_id bigint NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'worker',
  email text,
  password_hash text,
  pin_hash text,
  full_name text NOT NULL,
  hourly_rate numeric(10, 2) NOT NULL DEFAULT 0.00,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'worker')),
  CONSTRAINT profiles_admin_needs_email CHECK (
    role != 'admin' OR (email IS NOT NULL AND password_hash IS NOT NULL)
  ),
  CONSTRAINT profiles_worker_needs_pin CHECK (
    role != 'worker' OR pin_hash IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS jobs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  business_id bigint NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  address text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT jobs_status_check CHECK (status IN ('active', 'completed', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  business_id bigint NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  job_id bigint NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  assigned_to bigint REFERENCES profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  requires_photo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,

  CONSTRAINT tasks_status_check CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS time_entries (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  business_id bigint NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  profile_id bigint NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id bigint REFERENCES tasks(id) ON DELETE SET NULL,
  clock_in timestamptz NOT NULL DEFAULT now(),
  clock_out timestamptz
);

CREATE TABLE IF NOT EXISTS task_photos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  business_id bigint NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  task_id bigint NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  uploaded_by bigint NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  photo_data bytea NOT NULL,
  mime_type text NOT NULL DEFAULT 'image/jpeg',
  file_size_bytes bigint,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  profile_id bigint NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════
-- 2. INDEXES
-- ═══════════════════════════════════════════════════════════════

-- Profiles
CREATE INDEX IF NOT EXISTS profiles_business_id_idx ON profiles (business_id);
CREATE INDEX IF NOT EXISTS profiles_business_role_idx ON profiles (business_id, role);

-- Jobs
CREATE INDEX IF NOT EXISTS jobs_business_id_idx ON jobs (business_id);
CREATE INDEX IF NOT EXISTS jobs_business_status_idx ON jobs (business_id, status);

-- Tasks
CREATE INDEX IF NOT EXISTS tasks_business_id_idx ON tasks (business_id);
CREATE INDEX IF NOT EXISTS tasks_job_id_idx ON tasks (job_id);
CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx ON tasks (assigned_to);
CREATE INDEX IF NOT EXISTS tasks_business_status_idx ON tasks (business_id, status);

-- Time Entries
CREATE INDEX IF NOT EXISTS time_entries_business_id_idx ON time_entries (business_id);
CREATE INDEX IF NOT EXISTS time_entries_profile_id_idx ON time_entries (profile_id);
CREATE INDEX IF NOT EXISTS time_entries_task_id_idx ON time_entries (task_id);

-- CRITICAL: Only one open clock-in per worker at a time
CREATE UNIQUE INDEX IF NOT EXISTS time_entries_one_active_per_worker
  ON time_entries (profile_id)
  WHERE clock_out IS NULL;

-- Task Photos
CREATE INDEX IF NOT EXISTS task_photos_business_id_idx ON task_photos (business_id);
CREATE INDEX IF NOT EXISTS task_photos_task_id_idx ON task_photos (task_id);
CREATE INDEX IF NOT EXISTS task_photos_uploaded_by_idx ON task_photos (uploaded_by);

-- Push Subscriptions
CREATE INDEX IF NOT EXISTS push_subscriptions_profile_id_idx ON push_subscriptions (profile_id);
CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_endpoint_idx ON push_subscriptions (endpoint);


-- ═══════════════════════════════════════════════════════════════
-- 3. ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Helper: Get current business_id from session (wrapped in SELECT for performance)
-- Policies use (SELECT current_setting(...)) to avoid per-row function calls

-- Businesses: users can only see their own business
DROP POLICY IF EXISTS businesses_isolation ON businesses;
CREATE POLICY businesses_isolation ON businesses
  FOR ALL
  USING (id = (SELECT current_setting('app.current_business_id', true))::bigint);

-- Profiles: scoped by business_id
DROP POLICY IF EXISTS profiles_isolation ON profiles;
CREATE POLICY profiles_isolation ON profiles
  FOR ALL
  USING (business_id = (SELECT current_setting('app.current_business_id', true))::bigint);

-- Jobs: scoped by business_id
DROP POLICY IF EXISTS jobs_isolation ON jobs;
CREATE POLICY jobs_isolation ON jobs
  FOR ALL
  USING (business_id = (SELECT current_setting('app.current_business_id', true))::bigint);

-- Tasks: scoped by business_id
DROP POLICY IF EXISTS tasks_isolation ON tasks;
CREATE POLICY tasks_isolation ON tasks
  FOR ALL
  USING (business_id = (SELECT current_setting('app.current_business_id', true))::bigint);

-- Time Entries: scoped by business_id
DROP POLICY IF EXISTS time_entries_isolation ON time_entries;
CREATE POLICY time_entries_isolation ON time_entries
  FOR ALL
  USING (business_id = (SELECT current_setting('app.current_business_id', true))::bigint);

-- Task Photos: scoped by business_id
DROP POLICY IF EXISTS task_photos_isolation ON task_photos;
CREATE POLICY task_photos_isolation ON task_photos
  FOR ALL
  USING (business_id = (SELECT current_setting('app.current_business_id', true))::bigint);

-- Push Subscriptions: scoped via profile -> business_id
DROP POLICY IF EXISTS push_subscriptions_isolation ON push_subscriptions;
CREATE POLICY push_subscriptions_isolation ON push_subscriptions
  FOR ALL
  USING (profile_id IN (
    SELECT id FROM profiles
    WHERE business_id = (SELECT current_setting('app.current_business_id', true))::bigint
  ));


-- ═══════════════════════════════════════════════════════════════
-- 4. TRIGGER: Enforce photo requirement on task completion
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION check_task_photo_requirement()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only check when status is being set to 'completed'
  IF NEW.status = 'completed' AND NEW.requires_photo = true THEN
    IF NOT EXISTS (
      SELECT 1 FROM task_photos WHERE task_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Task requires at least one photo before completion'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- Auto-set completed_at timestamp
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_task_photo ON tasks;
CREATE TRIGGER enforce_task_photo
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION check_task_photo_requirement();


-- ═══════════════════════════════════════════════════════════════
-- 5. SEED DATA (Demo business + admin account)
-- ═══════════════════════════════════════════════════════════════
-- Password: "admin123" hashed with bcrypt (12 rounds)
-- PIN: "123456" hashed with bcrypt (12 rounds)
-- NOTE: Run the seed script (lib/db/seed.ts) instead for proper hashing

-- This creates a demo business for initial testing
INSERT INTO businesses (name) VALUES ('Demo Contractors LLC')
ON CONFLICT DO NOTHING;
