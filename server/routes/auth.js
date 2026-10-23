import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { supabase } from '../config/supabase.js';
import { generateToken, authMiddleware, rateLimit } from '../middleware/auth.js';
import { mapUser } from '../utils/mapUser.js';

const router = Router();

// Role yang boleh daftar sendiri. HR (field) hanya bisa dibuat oleh HR lain.
const SELF_REGISTER_ROLES = ['intern', 'academic'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  key: (req) => String(req.body?.email || '').toLowerCase(),
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi.' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Akun Anda telah disuspend. Hubungi admin.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: mapUser(user),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// POST /api/auth/register
router.post('/register', rateLimit({ windowMs: 60 * 60 * 1000, max: 20 }), async (req, res) => {
  try {
    const { name, email, password, role, nim, startup, lecturerCode, advisedStartups, nickname, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Nama, email, password, dan role wajib diisi.' });
    }
    if (!SELF_REGISTER_ROLES.includes(role)) {
      return res.status(403).json({ error: 'Role tidak diizinkan untuk pendaftaran mandiri.' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Format email tidak valid.' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter.' });
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Email sudah terdaftar.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = {
      id: randomUUID(),
      name,
      email,
      role,
      score: 0,
      password_hash,
      nickname: nickname || null,
      phone: phone || null,
      nim: nim || null,
      startup: startup || null,
      lecturer_code: lecturerCode || null,
      advised_startups: advisedStartups || [],
      status: 'active',
    };

    const { data: user, error } = await supabase
      .from('users')
      .insert(newUser)
      .select()
      .single();

    if (error) {
      console.error('Register error:', error);
      return res.status(500).json({ error: 'Gagal mendaftarkan user.' });
    }

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: mapUser(user),
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }

    res.json(mapUser(user));
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

export default router;
