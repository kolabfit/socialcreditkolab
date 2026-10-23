import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ Missing JWT_SECRET in .env');
  process.exit(1);
}

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token tidak ditemukan. Silakan login.' });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Token tidak valid atau sudah kedaluwarsa.' });
  }

  // Ambil role & status terbaru dari DB, supaya user yang disuspend / diganti role
  // tidak tetap punya akses sampai token kedaluwarsa.
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, email, role, status, startup')
      .eq('id', decoded.id)
      .single();

    if (!user) {
      return res.status(401).json({ error: 'User tidak ditemukan. Silakan login ulang.' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Akun Anda telah disuspend. Hubungi admin.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
}

// Middleware to check specific roles
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses untuk operasi ini.' });
    }
    next();
  };
}

// Simple in-memory rate limiter (per IP + key).
// ponytail: memory per proses, hilang saat restart & tidak shared antar instance; pakai Redis kalau scale-out.
export function rateLimit({ windowMs, max, key = () => '' }) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const id = `${req.ip}|${key(req)}`;
    const entry = hits.get(id);
    if (!entry || entry.reset < now) {
      hits.set(id, { count: 1, reset: now + windowMs });
      return next();
    }
    if (++entry.count > max) {
      return res.status(429).json({ error: 'Terlalu banyak percobaan. Coba lagi nanti.' });
    }
    next();
  };
}
