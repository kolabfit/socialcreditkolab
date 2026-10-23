import { Router } from 'express';
import { randomUUID } from 'crypto';
import { supabase } from '../config/supabase.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

// Samakan dengan DEFAULT_MAX_POINTS di src/utils.ts
export const DEFAULT_MAX_POINTS = 20;

router.use(authMiddleware);

const toCamel = (r) => ({
  id: r.id,
  targetId: r.target_id,
  targetType: r.target_type,
  reporterId: r.reporter_id,
  date: r.date,
  type: r.type,
  description: r.description,
  photoUrl: r.photo_url,
  pointsImpact: r.points_impact,
  aspectId: r.aspect_id,
});

// Tambah (sign = 1) atau kembalikan (sign = -1) poin report ke score & rubric_scores user target.
// ponytail: read-modify-write tanpa transaksi; pindah ke RPC Postgres kalau ada penilaian paralel.
async function applyReportPoints(report, sign) {
  const points = (report.points_impact || 0) * sign;

  let users = [];
  if (report.target_type === 'startup') {
    const { data } = await supabase
      .from('users')
      .select('id, score, rubric_scores')
      .eq('startup', report.target_id);
    users = data || [];
  } else {
    const { data } = await supabase
      .from('users')
      .select('id, score, rubric_scores')
      .eq('id', report.target_id)
      .single();
    if (data) users = [data];
  }

  for (const user of users) {
    const updateData = { score: (user.score || 0) + points };
    if (report.aspect_id) {
      const currentRubrics = user.rubric_scores || {};
      updateData.rubric_scores = {
        ...currentRubrics,
        [report.aspect_id]: (currentRubrics[report.aspect_id] || 0) + points,
      };
    }
    const { error } = await supabase.from('users').update(updateData).eq('id', user.id);
    if (error) console.error('Apply report points error:', error);
  }
}

// GET /api/reports — List behavior reports
router.get('/', async (req, res) => {
  try {
    const { targetId, reporterId, type } = req.query;

    let query = supabase
      .from('behavior_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (targetId) query = query.eq('target_id', targetId);
    if (reporterId) query = query.eq('reporter_id', reporterId);
    if (type) query = query.eq('type', type);

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Gagal mengambil data reports.' });
    }

    let reports = data;
    // Intern hanya melihat laporan tentang dirinya atau startup-nya
    if (req.user.role === 'intern') {
      reports = reports.filter(r =>
        (r.target_type !== 'startup' && r.target_id === req.user.id) ||
        (r.target_type === 'startup' && req.user.startup && r.target_id === req.user.startup)
      );
    }

    res.json(reports.map(toCamel));
  } catch (err) {
    console.error('Get reports error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// POST /api/reports — Add behavior report + auto-update score
router.post('/', requireRole('field', 'academic'), async (req, res) => {
  try {
    const { targetId, targetType, date, type, description, photoUrl, pointsImpact, aspectId } = req.body;

    if (!targetId || !date || !type || !description) {
      return res.status(400).json({ error: 'Data report tidak lengkap.' });
    }
    if (!['good', 'bad'].includes(type)) {
      return res.status(400).json({ error: 'Tipe report tidak valid.' });
    }
    if (targetType !== undefined && !['intern', 'startup'].includes(targetType)) {
      return res.status(400).json({ error: 'Target report tidak valid.' });
    }
    if (pointsImpact !== undefined && !Number.isFinite(Number(pointsImpact))) {
      return res.status(400).json({ error: 'Poin harus berupa angka.' });
    }

    // Batas poin per laporan: max_points milik aspek, atau DEFAULT_MAX_POINTS
    let maxPoints = DEFAULT_MAX_POINTS;
    let aspectName = 'laporan tanpa aspek';
    if (aspectId) {
      const { data: aspect } = await supabase.from('rubric_aspects').select('*').eq('id', aspectId).single();
      if (!aspect) {
        return res.status(400).json({ error: 'Aspek penilaian tidak ditemukan.' });
      }
      maxPoints = aspect.max_points || DEFAULT_MAX_POINTS;
      aspectName = `aspek "${aspect.name}"`;
    }
    if (Math.abs(Number(pointsImpact) || 0) > maxPoints) {
      return res.status(400).json({ error: `Poin maksimal untuk ${aspectName} adalah ±${maxPoints}.` });
    }

    const newReport = {
      id: randomUUID(),
      target_id: targetId,
      target_type: targetType || 'intern',
      // Pelapor selalu user yang login, bukan dari body
      reporter_id: req.user.id,
      date,
      type,
      description,
      photo_url: photoUrl || null,
      points_impact: Number(pointsImpact) || 0,
      aspect_id: aspectId || null,
    };

    const { data: report, error } = await supabase
      .from('behavior_reports')
      .insert(newReport)
      .select()
      .single();

    if (error) {
      console.error('Add report error:', error);
      return res.status(500).json({ error: 'Gagal menambahkan report.' });
    }

    await applyReportPoints(report, 1);

    res.status(201).json(toCamel(report));
  } catch (err) {
    console.error('Add report error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// DELETE /api/reports/:id — Delete report and revert scores
router.delete('/:id', requireRole('field', 'academic'), async (req, res) => {
  try {
    const { id } = req.params;

    // Get report first to know points impact
    const { data: report, error: getError } = await supabase
      .from('behavior_reports')
      .select('*')
      .eq('id', id)
      .single();

    if (getError || !report) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
    }

    // Pembimbing akademik hanya boleh menghapus laporan miliknya sendiri
    if (req.user.role === 'academic' && report.reporter_id !== req.user.id) {
      return res.status(403).json({ error: 'Anda hanya dapat menghapus laporan yang Anda buat.' });
    }

    // Delete the report
    const { error: deleteError } = await supabase
      .from('behavior_reports')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return res.status(500).json({ error: 'Gagal menghapus laporan.' });
    }

    await applyReportPoints(report, -1);

    res.json({ message: 'Laporan berhasil dihapus dan skor disesuaikan.' });
  } catch (err) {
    console.error('Delete report error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server saat menghapus laporan.' });
  }
});

export default router;
