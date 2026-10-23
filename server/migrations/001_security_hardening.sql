-- ============================================
-- 001 — Security hardening (aman dijalankan ulang)
-- ============================================
-- Tidak mengubah data apa pun (score, rubric_scores, laporan tetap sama).
-- Jalankan di Supabase → SQL Editor.
--
-- Sebelumnya policy "Service role full access" memakai USING (true) tanpa TO,
-- sehingga berlaku juga untuk role anon/authenticated: siapa pun yang punya
-- anon/publishable key bisa membaca & mengubah semua tabel (termasuk password_hash).
-- Backend memakai service role key yang otomatis bypass RLS, jadi policy ini tidak dibutuhkan.

DROP POLICY IF EXISTS "Service role full access" ON users;
DROP POLICY IF EXISTS "Service role full access" ON behavior_reports;
DROP POLICY IF EXISTS "Service role full access" ON rubric_aspects;
DROP POLICY IF EXISTS "Service role full access" ON startups;
DROP POLICY IF EXISTS "Service role full access" ON batches;
DROP POLICY IF EXISTS "Service role full access" ON intern_activities;

-- batches sebelumnya belum pernah di-ENABLE RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavior_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubric_aspects ENABLE ROW LEVEL SECURITY;
ALTER TABLE startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE intern_activities ENABLE ROW LEVEL SECURITY;
-- RLS aktif tanpa policy = anon & authenticated ditolak; service_role tetap bisa.

-- Index untuk filter yang sering dipakai
CREATE INDEX IF NOT EXISTS idx_intern_activities_status ON intern_activities(status);
CREATE INDEX IF NOT EXISTS idx_behavior_reports_aspect ON behavior_reports(aspect_id);
