import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

// GET /api/rubrics — List rubric aspects
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('rubric_aspects')
      .select('*')
      .order('id');

    if (error) {
      return res.status(500).json({ error: 'Gagal mengambil data rubrik.' });
    }

    res.json(data);
  } catch (err) {
    console.error('Get rubrics error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// PUT /api/rubrics — Batch update rubric aspects (field only)
router.put('/', requireRole('field'), async (req, res) => {
  try {
    const { aspects } = req.body;

    if (!aspects || !Array.isArray(aspects)) {
      return res.status(400).json({ error: 'Data rubrik tidak valid.' });
    }

    // Upsert all aspects
    const { data, error } = await supabase
      .from('rubric_aspects')
      .upsert(aspects, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('Update rubrics error:', error);
      return res.status(500).json({ error: 'Gagal mengupdate rubrik.' });
    }

    res.json(data);
  } catch (err) {
    console.error('Update rubrics error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

export default router;
