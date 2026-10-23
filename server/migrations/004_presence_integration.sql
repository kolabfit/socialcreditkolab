-- Integrasi aplikasi presensi Ko+Lab.
-- rubric_aspects.source = 'presence' → nilai aspek diisi otomatis dari presensi (maks 1 aspek).
-- users.presence_stats  = riwayat sync presensi (array, terbaru di depan, maks 20).
ALTER TABLE rubric_aspects ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN ('presence'));
CREATE UNIQUE INDEX IF NOT EXISTS uniq_rubric_aspects_presence ON rubric_aspects(source) WHERE source IS NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS presence_stats JSONB;
