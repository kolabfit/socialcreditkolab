import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';

const router = Router();

// Helper function to convert DB snake_case to camelCase
const mapUser = (user) => {
  if (!user) return user;
  const { 
    password_hash, 
    lecturer_code, 
    advised_startups, 
    photo_url, 
    rubric_scores,
    ...rest 
  } = user;
  
  return {
    ...rest,
    ...(lecturer_code !== undefined && { lecturerCode: lecturer_code }),
    ...(advised_startups !== undefined && { advisedStartups: advised_startups }),
    ...(photo_url !== undefined && { photoUrl: photo_url }),
    ...(rubric_scores !== undefined && { rubricScores: rubric_scores }),
  };
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
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
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, nim, startup, lecturerCode, advisedStartups } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Nama, email, password, dan role wajib diisi.' });
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
    const id = `u${Date.now()}`;

    const newUser = {
      id,
      name,
      email,
      role,
      score: 0,
      password_hash,
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
