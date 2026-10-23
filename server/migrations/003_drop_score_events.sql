-- ============================================
-- 003 — Hapus tabel score_events (tidak dipakai aplikasi)
-- ============================================
-- score_events berisi 103 baris "snapshot" migrasi lama (7 Juli 2026), tidak dibaca
-- maupun ditulis oleh kode aplikasi, tapi foreign key-nya ke rubric_aspects
-- membuat penghapusan aspek rubrik gagal berantai.
--
-- Backup isinya sudah ada di backups/before-remap-aspek2-*.json (key "score_events").
-- Tidak memengaruhi skor, rubric_scores, maupun laporan.

DROP TABLE IF EXISTS score_events;
