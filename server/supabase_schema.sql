-- ============================================
-- Ko+Lab Social Credit Score — Supabase Schema
-- ============================================
-- Jalankan SQL ini di Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('intern', 'academic', 'field')),
  score INTEGER DEFAULT 0,
  password_hash TEXT NOT NULL,
  nickname TEXT,
  phone TEXT,
  nim TEXT,
  startup TEXT,
  lecturer_code TEXT,
  advised_startups TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  photo_url TEXT,
  rubric_scores JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Behavior Reports table
CREATE TABLE IF NOT EXISTS behavior_reports (
  id TEXT PRIMARY KEY,
  target_id TEXT NOT NULL,
  target_type TEXT DEFAULT 'intern' CHECK (target_type IN ('intern', 'startup')),
  reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('good', 'bad')),
  description TEXT NOT NULL,
  photo_url TEXT,
  points_impact INTEGER NOT NULL DEFAULT 0,
  aspect_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Rubric Aspects table
CREATE TABLE IF NOT EXISTS rubric_aspects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  weight INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Startups table
CREATE TABLE IF NOT EXISTS startups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Batches table
CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date_range TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_startup ON users(startup);
CREATE INDEX IF NOT EXISTS idx_behavior_reports_target ON behavior_reports(target_id);
CREATE INDEX IF NOT EXISTS idx_behavior_reports_reporter ON behavior_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_behavior_reports_date ON behavior_reports(date);

-- ============================================
-- Disable RLS (backend handles auth via JWT)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavior_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubric_aspects ENABLE ROW LEVEL SECURITY;
ALTER TABLE startups ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (backend uses service role key)
CREATE POLICY "Service role full access" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON behavior_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON rubric_aspects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON startups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON batches FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rubric_aspects_updated_at
  BEFORE UPDATE ON rubric_aspects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_startups_updated_at
  BEFORE UPDATE ON startups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batches_updated_at
  BEFORE UPDATE ON batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INTERN FEATURES TABLES
-- ============================================

-- 6. Intern Activities table (Laporan Harian & Laporan Kejadian)
CREATE TABLE IF NOT EXISTS intern_activities (
  id TEXT PRIMARY KEY,
  intern_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('harian', 'kejadian')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  obstacle TEXT,
  attachment_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_intern_activities_intern ON intern_activities(intern_id);

-- Enable RLS and add policies
ALTER TABLE intern_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON intern_activities FOR ALL USING (true) WITH CHECK (true);

-- Updated_at triggers
CREATE TRIGGER update_intern_activities_updated_at
  BEFORE UPDATE ON intern_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
