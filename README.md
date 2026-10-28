# Ko+Lab Social Credit Score

Aplikasi penilaian sosial (social credit score) peserta magang Ko+Lab.

- **Frontend:** React 19 + Vite + Tailwind (`src/`)
- **Backend:** Express (`server/`), auth JWT
- **Database:** Supabase (Postgres), diakses hanya dari backend dengan service role key

## Role

| Role | Akses |
|---|---|
| `field` (HR / Pembimbing Lapangan) | Kelola semua user, startup, batch, rubrik, laporan & approval aktivitas |
| `academic` (Pembimbing Akademik) | Menilai intern, membuat laporan, menghapus laporan miliknya, approval aktivitas |
| `intern` (Peserta Magang) | Melihat skor & laporan dirinya/startup-nya, mengirim laporan kejadian, edit profil sendiri |

Pendaftaran mandiri hanya untuk `intern` dan `academic`. Akun HR dibuat oleh HR lain.

## Setup

1. `npm install`
2. Salin `.env.example` → `.env`, isi `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET` (wajib, server tidak mau jalan tanpanya).
3. Database baru: jalankan `server/supabase_schema.sql` di Supabase SQL Editor.
   Database lama: jalankan `server/migrations/001_security_hardening.sql` (tidak mengubah data).
4. (Opsional) `npm run seed` — hanya menambah data awal yang belum ada; data & skor yang sudah ada tidak ditimpa.
   Segera ganti password default akun seed setelah login.
5. `npm run dev:all` → frontend http://localhost:3000, API http://localhost:3002/api

## Script

| Script | Fungsi |
|---|---|
| `npm run dev:all` | Frontend + backend |
| `npm test` | Test API (Supabase palsu in-memory, tidak menyentuh DB asli) + rumus skor |
| `npm run lint` | Typecheck TypeScript |
| `npm run build` | Build produksi ke `dist/` |

## Rumus skor intern

Skor tampil = rata-rata berbobot nilai aspek, rentang 0–100:

- Nilai aspek = `rubric_scores[aspek]`, dibatasi 0–100. Poin laporan beraspek sudah masuk ke sini saat laporan dibuat (`applyReportPoints`), jadi tidak ditambah lagi.
- Skor = `round(Σ nilai aspek × bobot%)` + poin laporan tanpa aspek, lalu dibatasi 0–100.

Lihat `computeInternScore` di `src/utils.ts`. Kolom `users.score` di DB tidak dipakai untuk tampilan.

## Integrasi presensi

Satu aspek rubrik bisa diisi otomatis dari aplikasi presensi (`presencekolab`).

1. Jalankan `server/migrations/004_presence_integration.sql` di Supabase.
2. Isi kunci acak yang sama di kedua `.env`: `INTEGRATION_API_KEY` (presensi) dan `PRESENCE_API_KEY` + `PRESENCE_API_URL` (di sini).
3. Settings → Edit Rubrik → centang **Dari presensi** pada aspek kedisiplinan.
4. Klik **Sync Presensi**, isi tanggal mulai & selesai batch.

Nilai aspek = 40% kehadiran + 30% konsistensi laporan + 30% kualitas laporan. Lihat `disciplineScore` di `server/routes/integration.js`.
Intern dicocokkan lewat NIM, lalu email. Nilai aspek ini tidak bisa diubah manual.

## Deploy

Set `CORS_ORIGIN` ke domain frontend bila frontend dan API beda origin.
