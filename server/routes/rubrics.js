import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { DEFAULT_MAX_POINTS } from './reports.js';

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

    if (!aspects || !Array.isArray(aspects) || aspects.length === 0) {
      return res.status(400).json({ error: 'Data rubrik tidak valid.' });
    }

    // Validate total weight = 100
    const totalWeight = aspects.reduce((sum, a) => sum + (Number(a.weight) || 0), 0);
    if (totalWeight !== 100) {
      return res.status(400).json({ error: `Total bobot harus 100% (sekarang ${totalWeight}%).` });
    }

    const invalidMax = aspects.find(a => a.max_points != null && a.max_points !== '' &&
      !(Number.isInteger(Number(a.max_points)) && Number(a.max_points) >= 1 && Number(a.max_points) <= 100));
    if (invalidMax) {
      return res.status(400).json({ error: `Maks poin untuk "${invalidMax.name}" harus bilangan bulat 1–100.` });
    }

    if (aspects.filter(a => a.source === 'presence').length > 1) {
      return res.status(400).json({ error: 'Hanya satu aspek yang boleh diisi dari presensi.' });
    }

    const incomingIds = aspects.map(a => String(a.id));
    // reassign: { [idAspekDihapus]: idAspekTujuan } — laporan & nilai aspek yang dihapus dipindah ke aspek tujuan
    const reassign = req.body.reassign || {};

    const { data: existingAspects, error: fetchError } = await supabase
      .from('rubric_aspects')
      .select('id, name');

    if (fetchError) {
      console.error('Fetch rubrics error:', fetchError);
      return res.status(500).json({ error: 'Gagal mengambil data rubrik existing.' });
    }

    const toDelete = (existingAspects || []).filter(a => !incomingIds.includes(String(a.id)));

    // Aspek yang masih dipakai (ada laporan / nilai intern) wajib dipindahkan, bukan dibuang
    const { data: allUsers } = await supabase.from('users').select('id, rubric_scores').not('rubric_scores', 'is', null);
    for (const aspect of toDelete) {
      const { data: used } = await supabase.from('behavior_reports').select('id').eq('aspect_id', aspect.id);
      const hasValues = (allUsers || []).some(u => u.rubric_scores && aspect.id in u.rubric_scores && u.rubric_scores[aspect.id] !== 0);
      const targetId = reassign[aspect.id];
      if ((used?.length || hasValues) && !targetId) {
        return res.status(400).json({
          error: `Aspek "${aspect.name}" masih dipakai ${used?.length || 0} laporan / nilai intern. Pilih aspek tujuan untuk memindahkan datanya.`,
          code: 'REASSIGN_REQUIRED',
          aspectId: aspect.id,
        });
      }
      if (targetId && !incomingIds.includes(String(targetId))) {
        return res.status(400).json({ error: `Aspek tujuan untuk "${aspect.name}" tidak valid.` });
      }
    }

    // Step 1: Upsert aspek (dulu, supaya aspek tujuan yang baru sudah ada)
    const cleanAspects = aspects.map(a => ({
      id: String(a.id),
      name: String(a.name),
      weight: Number(a.weight),
      max_points: a.max_points == null || a.max_points === '' ? DEFAULT_MAX_POINTS : Number(a.max_points),
      source: a.source === 'presence' ? 'presence' : null,
    }));

    const { error } = await supabase
      .from('rubric_aspects')
      .upsert(cleanAspects, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('Upsert rubrics error:', error);
      // PGRST204 = kolom tidak ada → migrasi 002 / 004 belum dijalankan
      const msg = error.code === 'PGRST204'
        ? 'Kolom rubrik belum lengkap. Jalankan server/migrations/002_rubric_max_points.sql dan 004_presence_integration.sql di Supabase.'
        : 'Gagal mengupdate rubrik.';
      return res.status(500).json({ error: msg });
    }

    // Step 2: Pindahkan laporan & nilai, lalu hapus aspek
    // ponytail: tanpa transaksi; kalau gagal di tengah, aspek lama belum terhapus sehingga aman diulang.
    for (const aspect of toDelete) {
      const targetId = reassign[aspect.id] && String(reassign[aspect.id]);
      if (targetId) {
        const { error: moveError } = await supabase
          .from('behavior_reports')
          .update({ aspect_id: targetId })
          .eq('aspect_id', aspect.id);
        if (moveError) {
          console.error('Move reports error:', moveError);
          return res.status(500).json({ error: 'Gagal memindahkan laporan aspek.' });
        }
      }

      for (const user of allUsers || []) {
        const scores = { ...(user.rubric_scores || {}) };
        if (!(aspect.id in scores)) continue;
        if (targetId) scores[targetId] = (scores[targetId] || 0) + (scores[aspect.id] || 0);
        delete scores[aspect.id];
        user.rubric_scores = scores;
        await supabase.from('users').update({ rubric_scores: scores }).eq('id', user.id);
      }

      const { error: deleteError } = await supabase.from('rubric_aspects').delete().eq('id', aspect.id);
      if (deleteError) {
        console.error('Delete rubrics error:', deleteError);
        return res.status(500).json({ error: `Gagal menghapus aspek "${aspect.name}".` });
      }
    }

    const { data } = await supabase.from('rubric_aspects').select('*').order('id');
    res.json(data);
  } catch (err) {
    console.error('Update rubrics error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

export default router;
