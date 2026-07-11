import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// GET /api/batches - List all batches
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Fetch batches error:', error);
    res.status(500).json({ error: 'Gagal mengambil data batch.' });
  }
});

// POST /api/batches - Create new batch
router.post('/', async (req, res) => {
  try {
    const { name, date_range, status } = req.body;
    
    if (!name || !date_range || !status) {
      return res.status(400).json({ error: 'Semua field (name, date_range, status) harus diisi.' });
    }

    const newBatch = {
      id: `b${Date.now()}`,
      name,
      date_range,
      status
    };

    const { data, error } = await supabase
      .from('batches')
      .insert([newBatch])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Create batch error:', error);
    res.status(500).json({ error: 'Gagal membuat batch baru.' });
  }
});

// PUT /api/batches/:id - Update batch
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, date_range, status } = req.body;
    
    const updates = { updated_at: new Date() };
    if (name !== undefined) updates.name = name;
    if (date_range !== undefined) updates.date_range = date_range;
    if (status !== undefined) updates.status = status;

    const { data, error } = await supabase
      .from('batches')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Update batch error:', error);
    res.status(500).json({ error: 'Gagal mengupdate batch.' });
  }
});

// DELETE /api/batches/:id - Delete batch
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('batches')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Batch berhasil dihapus.' });
  } catch (error) {
    console.error('Delete batch error:', error);
    res.status(500).json({ error: 'Gagal menghapus batch.' });
  }
});

export default router;
