-- ============================================
-- 005 — Lupa password dengan persetujuan HR
-- ============================================
-- User mengisi email + password baru di halaman login → hash disimpan di pending_password_hash
-- dan waktu permintaan di password_reset_requested_at. Password lama tetap berlaku sampai HR
-- menyetujui di Kelola User (POST /api/users/:id/password-reset/approve) atau menolak (/reject).
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_requested_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_password_hash TEXT;
