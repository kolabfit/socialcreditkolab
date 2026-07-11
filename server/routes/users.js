import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

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

    const users = data.map(mapUser);
    res.json(users);
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

    res.json(mapUser(user));
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// PUT /api/users/:id — Update user
router.put('/:id', async (req, res) => {
  try {
    const updates = { ...req.body };
    
    // If password is being updated, hash it
    if (updates.password) {
      updates.password_hash = await bcrypt.hash(updates.password, 10);
      delete updates.password;
    }

    // Don't allow updating these fields directly
    delete updates.id;
    delete updates.created_at;

    // Convert camelCase to snake_case for specific fields
    if (updates.lecturerCode !== undefined) {
      updates.lecturer_code = updates.lecturerCode;
      delete updates.lecturerCode;
    }
    if (updates.advisedStartups !== undefined) {
      updates.advised_startups = updates.advisedStartups;
      delete updates.advisedStartups;
    }
    if (updates.photoUrl !== undefined) {
      updates.photo_url = updates.photoUrl;
      delete updates.photoUrl;
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

// PATCH /api/users/:id/score — Update user score
router.patch('/:id/score', async (req, res) => {
  try {
    const { score, rubricScores } = req.body;

    if (score === undefined) {
      return res.status(400).json({ error: 'Score wajib diisi.' });
    }

    const updates = { score };
    if (rubricScores !== undefined) {
      updates.rubric_scores = rubricScores;
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Gagal mengupdate score.' });
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
    const { name, email, password, role, nim, startup, lecturerCode, advisedStartups } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Nama, email, password, dan role wajib diisi.' });
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
      console.error('Add user error:', error);
      return res.status(500).json({ error: 'Gagal menambahkan user.' });
    }

    res.status(201).json(mapUser(user));
  } catch (err) {
    console.error('Add user error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

export default router;
