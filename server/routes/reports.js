import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

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

    // Convert snake_case to camelCase for frontend compatibility
    const reports = data.map(r => ({
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
    }));

    res.json(reports);
  } catch (err) {
    console.error('Get reports error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// POST /api/reports — Add behavior report + auto-update score
router.post('/', async (req, res) => {
  try {
    const { targetId, targetType, reporterId, date, type, description, photoUrl, pointsImpact, aspectId } = req.body;

    if (!targetId || !reporterId || !date || !type || !description) {
      return res.status(400).json({ error: 'Data report tidak lengkap.' });
    }

    const id = `r${Date.now()}`;

    const newReport = {
      id,
      target_id: targetId,
      target_type: targetType || 'intern',
      reporter_id: reporterId,
      date,
      type,
      description,
      photo_url: photoUrl || null,
      points_impact: pointsImpact || 0,
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

    const { data: aspects } = await supabase.from('rubric_aspects').select('*');
    const aspectWeights = {};
    if (aspects) {
      aspects.forEach(a => aspectWeights[a.id] = a.weight);
    }

    // Auto-update user score if target is an intern
    if (newReport.target_type === 'intern' || !newReport.target_type) {
      // Get current user score and rubric_scores
      const { data: user } = await supabase
        .from('users')
        .select('score, rubric_scores')
        .eq('id', targetId)
        .single();

      if (user) {
        let updateData = {};
        let currentScore = user.score || 0;

        if (aspectId) {
          const currentRubrics = user.rubric_scores || {};
          const aspectScore = (currentRubrics[aspectId] || 0) + (pointsImpact || 0);
          updateData.rubric_scores = { ...currentRubrics, [aspectId]: aspectScore };
        }

        updateData.score = currentScore + (pointsImpact || 0);

        await supabase
          .from('users')
          .update(updateData)
          .eq('id', targetId);
      }
    } else if (newReport.target_type === 'startup') {
      // Get all interns in this startup
      const { data: users } = await supabase
        .from('users')
        .select('id, score, rubric_scores')
        .eq('startup', targetId);

      if (users && users.length > 0) {
        for (const user of users) {
          let updateData = {};
          let currentScore = user.score || 0;

          if (aspectId) {
            const currentRubrics = user.rubric_scores || {};
            const aspectScore = (currentRubrics[aspectId] || 0) + (pointsImpact || 0);
            updateData.rubric_scores = { ...currentRubrics, [aspectId]: aspectScore };
          }

          updateData.score = currentScore + (pointsImpact || 0);

          await supabase
            .from('users')
            .update(updateData)
            .eq('id', user.id);
        }
      }
    }

    // Return in camelCase
    res.status(201).json({
      id: report.id,
      targetId: report.target_id,
      targetType: report.target_type,
      reporterId: report.reporter_id,
      date: report.date,
      type: report.type,
      description: report.description,
      photoUrl: report.photo_url,
      pointsImpact: report.points_impact,
      aspectId: report.aspect_id,
    });
  } catch (err) {
    console.error('Add report error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

// DELETE /api/reports/:id — Delete report and revert scores
router.delete('/:id', async (req, res) => {
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

    // Delete the report
    const { error: deleteError } = await supabase
      .from('behavior_reports')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return res.status(500).json({ error: 'Gagal menghapus laporan.' });
    }

    const { data: aspects } = await supabase.from('rubric_aspects').select('*');
    const aspectWeights = {};
    if (aspects) {
      aspects.forEach(a => aspectWeights[a.id] = a.weight);
    }

    const pointsImpact = report.points_impact || 0;

    // Revert user score if target is an intern
    if (report.target_type === 'intern' || !report.target_type) {
      const { data: user } = await supabase
        .from('users')
        .select('score, rubric_scores')
        .eq('id', report.target_id)
        .single();

      if (user) {
        let updateData = {};
        let currentScore = user.score || 0;

        if (report.aspect_id) {
          const currentRubrics = user.rubric_scores || {};
          const aspectScore = (currentRubrics[report.aspect_id] || 0) - pointsImpact;
          updateData.rubric_scores = { ...currentRubrics, [report.aspect_id]: aspectScore };
        }
        
        updateData.score = currentScore - pointsImpact;

        await supabase.from('users').update(updateData).eq('id', report.target_id);
      }
    } else if (report.target_type === 'startup') {
      const { data: users } = await supabase
        .from('users')
        .select('id, score, rubric_scores')
        .eq('startup', report.target_id);

      if (users && users.length > 0) {
        for (const user of users) {
          let updateData = {};
          let currentScore = user.score || 0;

          if (report.aspect_id) {
            const currentRubrics = user.rubric_scores || {};
            const aspectScore = (currentRubrics[report.aspect_id] || 0) - pointsImpact;
            updateData.rubric_scores = { ...currentRubrics, [report.aspect_id]: aspectScore };
          }
          
          updateData.score = currentScore - pointsImpact;

          await supabase.from('users').update(updateData).eq('id', user.id);
        }
      }
    }

    res.json({ message: 'Laporan berhasil dihapus dan skor disesuaikan.' });
  } catch (err) {
    console.error('Delete report error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server saat menghapus laporan.' });
  }
});

export default router;
