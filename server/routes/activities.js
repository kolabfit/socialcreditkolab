import express from 'express';
import { supabase } from '../config/supabase.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all activities
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('intern_activities')
      .select('*')
      .order('created_at', { ascending: false });

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

    const newActivity = {
      id: uuidv4(),
      intern_id,
      date,
      type,
      title,
      description,
      obstacle: obstacle || null,
      attachment_url: attachment_url || null,
      status: status || 'pending'
    };

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
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

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

// Delete activity
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
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
