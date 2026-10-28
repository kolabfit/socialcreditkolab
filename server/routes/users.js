import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { supabase } from '../config/supabase.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { mapUser, ROLES } from '../utils/mapUser.js';

const router = Router();

// Field yang boleh diubah lewat PUT /users/:id (camelCase dari frontend → kolom DB).
// score, rubric_scores, status, id sengaja tidak ada di sini.
const EDITABLE_FIELDS = {
  name: 'name',
  email: 'email',
  nickname: 'nickname',
  phone: 'phone',
  nim: 'nim',
  startup: 'startup',
  lecturerCode: 'lecturer_code',
  advisedStartups: 'advised_startups',
  photoUrl: 'photo_url',
};

// All routes require authentication
router.use(authMiddleware);

// GET /api/users — List all users
router.get('/', async (req, res) => {
  try {
    const { role, startup } = req.query;

    let query = supabase.from('users').select('*').order('name');

    if (role) query = query.eq('role', role);
    if (startup) query = query.eq('startup', startup);

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Gagal mengambil data users.' });
    }

    let users = data;
    // Intern hanya boleh melihat dirinya sendiri + pembimbing (bukan data intern lain)
    if (req.user.role === 'intern') {
      users = users.filter(u => u.id === req.user.id || u.role !== 'intern');
    }

    res.json(users.map(mapUser));
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// GET /api/users/:id — Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }

    if (req.user.role === 'intern' && user.role === 'intern' && user.id !== req.user.id) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses untuk operasi ini.' });
    }

    res.json(mapUser(user));
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// PUT /api/users/:id — Update user (diri sendiri, atau HR untuk siapa saja)
router.put('/:id', async (req, res) => {
  try {
    const isField = req.user.role === 'field';
    if (!isField && req.params.id !== req.user.id) {
      return res.status(403).json({ error: 'Anda hanya dapat mengubah profil sendiri.' });
    }

    const updates = {};
    for (const [key, column] of Object.entries(EDITABLE_FIELDS)) {
      if (req.body[key] !== undefined) updates[column] = req.body[key];
    }

    // Hanya HR yang boleh mengganti role
    if (req.body.role !== undefined && isField) {
      if (!ROLES.includes(req.body.role)) {
        return res.status(400).json({ error: 'Role tidak valid.' });
      }
      updates.role = req.body.role;
    }

    if (req.body.password) {
      updates.password_hash = await bcrypt.hash(req.body.password, 10);
      updates.password_reset_requested_at = null;
      updates.pending_password_hash = null;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Tidak ada data yang diubah.' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Update user error:', error);
      return res.status(500).json({ error: 'Gagal mengupdate user.' });
    }

    res.json(mapUser(user));
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// DELETE /api/users/:id — Delete user (field only)
router.delete('/:id', requireRole('field'), async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Tidak dapat menghapus akun sendiri.' });
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(500).json({ error: 'Gagal menghapus user.' });
    }

    res.json({ message: 'User berhasil dihapus.' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// PATCH /api/users/:id/suspend — Suspend/unsuspend user (field only)
router.patch('/:id/suspend', requireRole('field'), async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Tidak dapat mensuspend akun sendiri.' });
    }

    const { suspended } = req.body;
    const status = suspended ? 'suspended' : 'active';

    const { data: user, error } = await supabase
      .from('users')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Gagal mengubah status user.' });
    }

    res.json(mapUser(user));
  } catch (err) {
    console.error('Suspend user error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// PATCH /api/users/:id/password-reset — HR setujui ({ approve: true }) atau tolak password baru
// yang diajukan user lewat /api/auth/forgot-password.
router.patch('/:id/password-reset', requireRole('field'), async (req, res) => {
  try {
    const { data: current } = await supabase
      .from('users')
      .select('pending_password_hash')
      .eq('id', req.params.id)
      .single();
    if (!current?.pending_password_hash) {
      return res.status(404).json({ error: 'Tidak ada permintaan reset password untuk user ini.' });
    }

    const updates = { pending_password_hash: null, password_reset_requested_at: null };
    if (req.body.approve === true) updates.password_hash = current.pending_password_hash;

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.params.id)
      .eq('pending_password_hash', current.pending_password_hash) // permintaan baru di tengah jalan tidak ikut disetujui
      .select()
      .single();

    if (error || !user) {
      return res.status(409).json({ error: 'Permintaan berubah, muat ulang data lalu coba lagi.' });
    }

    res.json(mapUser(user));
  } catch (err) {
    console.error('Password reset decision error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// PATCH /api/users/:id/score — Update user score (pembimbing / HR)
router.patch('/:id/score', requireRole('field', 'academic'), async (req, res) => {
  try {
    const { score, rubricScores } = req.body;

    if (typeof score !== 'number' || !Number.isFinite(score)) {
      return res.status(400).json({ error: 'Score wajib berupa angka.' });
    }
    if (rubricScores !== undefined && (typeof rubricScores !== 'object' || rubricScores === null || Array.isArray(rubricScores))) {
      return res.status(400).json({ error: 'rubricScores tidak valid.' });
    }

    // Skor maksimal 100
    const updates = { score: Math.min(100, score) };
    if (rubricScores !== undefined) {
      // Nilai aspek presensi hanya boleh diubah lewat sync presensi; pakai nilai yang tersimpan.
      const { data: presenceAspects } = await supabase.from('rubric_aspects').select('id').eq('source', 'presence');
      if (presenceAspects?.length) {
        const { data: current } = await supabase.from('users').select('rubric_scores').eq('id', req.params.id).single();
        for (const { id } of presenceAspects) {
          if (current?.rubric_scores?.[id] !== undefined) rubricScores[id] = current.rubric_scores[id];
          else delete rubricScores[id];
        }
      }
      updates.rubric_scores = rubricScores;
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.params.id)
      .eq('role', 'intern')
      .select()
      .single();

    if (error || !user) {
      return res.status(error ? 500 : 404).json({ error: 'Gagal mengupdate score.' });
    }

    res.json(mapUser(user));
  } catch (err) {
    console.error('Update score error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// POST /api/users — Add new user (field only)
router.post('/', requireRole('field'), async (req, res) => {
  try {
    const { name, email, password, role, nim, startup, lecturerCode, advisedStartups, nickname, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Nama, email, password, dan role wajib diisi.' });
    }
    if (!ROLES.includes(role)) {
      return res.status(400).json({ error: 'Role tidak valid.' });
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
      console.error('Add user error:', error);
      return res.status(error.code === '23505' ? 409 : 500).json({
        error: error.code === '23505' ? 'Email sudah terdaftar.' : 'Gagal menambahkan user.',
      });
    }

    res.status(201).json(mapUser(user));
  } catch (err) {
    console.error('Add user error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

export default router;
