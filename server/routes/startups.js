import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

// GET /api/startups — List all startups
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('startups')
      .select('*')
      .order('name');

    if (error) {
      return res.status(500).json({ error: 'Gagal mengambil data startups.' });
    }

    res.json(data);
  } catch (err) {
    console.error('Get startups error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// POST /api/startups — Add startup (field only)
router.post('/', requireRole('field'), async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nama startup wajib diisi.' });
    }

    const id = `s${Date.now()}`;

    const { data: startup, error } = await supabase
      .from('startups')
      .insert({ id, name, description: description || '' })
      .select()
      .single();

    if (error) {
      console.error('Add startup error:', error);
      return res.status(500).json({ error: 'Gagal menambahkan startup.' });
    }

    res.status(201).json(startup);
  } catch (err) {
    console.error('Add startup error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// PUT /api/startups/:id — Update startup (field only)
router.put('/:id', requireRole('field'), async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.id;
    delete updates.created_at;

    const { data: startup, error } = await supabase
      .from('startups')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Gagal mengupdate startup.' });
    }

    res.json(startup);
  } catch (err) {
    console.error('Update startup error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// DELETE /api/startups/:id — Delete startup (field only)
router.delete('/:id', requireRole('field'), async (req, res) => {
  try {
    const { error } = await supabase
      .from('startups')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(500).json({ error: 'Gagal menghapus startup.' });
    }

    res.json({ message: 'Startup berhasil dihapus.' });
  } catch (err) {
    console.error('Delete startup error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

export default router;
