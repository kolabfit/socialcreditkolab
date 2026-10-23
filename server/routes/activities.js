import express from 'express';
import { randomUUID } from 'crypto';
import { supabase } from '../config/supabase.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

const TYPES = ['harian', 'kejadian'];
const STATUSES = ['pending', 'approved', 'rejected'];

// Get all activities (intern hanya miliknya sendiri)
router.get('/', async (req, res) => {
  try {
    let query = supabase
      .from('intern_activities')
      .select('*')
      .order('created_at', { ascending: false });

    if (req.user.role === 'intern') query = query.eq('intern_id', req.user.id);

    const { data, error } = await query;

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Gagal mengambil data aktivitas' });
  }
});

// Create new activity
router.post('/', async (req, res) => {
  try {
    const { intern_id, date, type, title, description, obstacle, attachment_url, status } = req.body;
    const isIntern = req.user.role === 'intern';

    if (!date || !type || !title || !description) {
      return res.status(400).json({ error: 'Tanggal, tipe, judul, dan deskripsi wajib diisi.' });
    }
    if (!TYPES.includes(type)) {
      return res.status(400).json({ error: 'Tipe aktivitas tidak valid.' });
    }

    const newActivity = {
      id: randomUUID(),
      // Intern selalu membuat laporan atas nama dirinya sendiri dan berstatus pending
      intern_id: isIntern ? req.user.id : intern_id,
      date,
      type,
      title,
      description,
      obstacle: obstacle || null,
      attachment_url: attachment_url || null,
      status: isIntern ? 'pending' : (STATUSES.includes(status) ? status : 'pending'),
    };

    if (!newActivity.intern_id) {
      return res.status(400).json({ error: 'intern_id wajib diisi.' });
    }

    const { data, error } = await supabase
      .from('intern_activities')
      .insert([newActivity])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ error: 'Gagal membuat laporan aktivitas' });
  }
});

// Update activity status (for HR/Academic approval)
router.patch('/:id', requireRole('field', 'academic'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid.' });
    }

    const { data, error } = await supabase
      .from('intern_activities')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ error: 'Gagal memperbarui aktivitas' });
  }
});

// Delete activity (HR, atau intern pemiliknya selama masih pending)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'field') {
      const { data: activity } = await supabase
        .from('intern_activities')
        .select('intern_id, status')
        .eq('id', id)
        .single();

      if (!activity) {
        return res.status(404).json({ error: 'Aktivitas tidak ditemukan' });
      }
      if (activity.intern_id !== req.user.id || activity.status !== 'pending') {
        return res.status(403).json({ error: 'Anda tidak memiliki akses untuk operasi ini.' });
      }
    }

    const { error } = await supabase
      .from('intern_activities')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ error: 'Gagal menghapus aktivitas' });
  }
});

export default router;
