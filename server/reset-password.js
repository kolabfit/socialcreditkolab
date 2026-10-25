/**
 * Reset password satu akun (mis. pembimbing lapangan yang lupa password).
 * Password lama tidak bisa dilihat (hanya hash bcrypt), jadi diganti dengan yang baru.
 *
 * Usage:
 *   npm run reset-password -- hr.kolab@gmail.com            → password acak, dicetak sekali
 *   NEW_PASSWORD="..." npm run reset-password -- <email>     → password pilihan sendiri (min 8 karakter)
 *
 * Memakai SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY dari .env (lokal atau server production).
 */
import dotenv from 'dotenv';
dotenv.config();

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { supabase } from './config/supabase.js';

const email = String(process.argv[2] || '').trim().toLowerCase();
const password = process.env.NEW_PASSWORD || crypto.randomBytes(9).toString('base64url');

if (!email) {
  console.error('❌ Usage: npm run reset-password -- <email>');
  process.exit(1);
}
if (password.length < 8) {
  console.error('❌ NEW_PASSWORD minimal 8 karakter.');
  process.exit(1);
}

const { data, error } = await supabase
  .from('users')
  .update({ password_hash: await bcrypt.hash(password, 10) })
  .ilike('email', email)
  .select('email, role');

if (error) {
  console.error('❌ Gagal:', error.message);
  process.exit(1);
}
if (!data?.length) {
  console.error(`❌ Akun ${email} tidak ditemukan.`);
  process.exit(1);
}
console.log(`✅ Password ${data[0].email} (${data[0].role}) direset.`);
if (!process.env.NEW_PASSWORD) console.log(`   Password baru: ${password}  (simpan sekarang, tidak ditampilkan lagi)`);
