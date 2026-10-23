-- ============================================
-- 002 — Batas poin per laporan untuk tiap aspek rubrik (aman dijalankan ulang)
-- ============================================
-- Hanya menambah kolom pengaturan. Tidak mengubah score, rubric_scores, atau laporan.
-- Aspek yang sudah ada otomatis mendapat batas default ±20 (poin terbesar yang pernah dipakai).

ALTER TABLE rubric_aspects ADD COLUMN IF NOT EXISTS max_points INTEGER NOT NULL DEFAULT 20;

ALTER TABLE rubric_aspects DROP CONSTRAINT IF EXISTS rubric_aspects_max_points_check;
ALTER TABLE rubric_aspects ADD CONSTRAINT rubric_aspects_max_points_check CHECK (max_points BETWEEN 1 AND 100);

-- Supaya PostgREST langsung mengenali kolom baru
NOTIFY pgrst, 'reload schema';
