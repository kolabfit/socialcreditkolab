import { Router } from 'express';
import { timingSafeEqual } from 'crypto';
import { supabase } from '../config/supabase.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
// Rumus skor yang sama dengan tampilan (Node ≥ 22.18 bisa import .ts langsung)
import { scoreBreakdown, getGrade } from '../../src/utils.ts';

const router = Router();

// GET /api/integration/scores — Skor social credit semua intern untuk Portal Ko+Lab (server-to-server, X-Integration-Key)
router.get('/scores', async (req, res) => {
  const key = process.env.INTEGRATION_API_KEY || '';
  const given = String(req.headers['x-integration-key'] || '');
  if (!key || given.length !== key.length || !timingSafeEqual(Buffer.from(given), Buffer.from(key))) {
    return res.status(401).json({ error: 'Kunci integrasi tidak valid.' });
  }
  try {
    const [{ data: interns, error }, { data: rubrics }, { data: reports }] = await Promise.all([
      supabase.from('users').select('id, name, email, nim, startup, status, rubric_scores').eq('role', 'intern'),
      supabase.from('rubric_aspects').select('id, name, weight').order('id'),
      supabase.from('behavior_reports').select('target_id, target_type, points_impact, aspect_id'),
    ]);
    if (error) return res.status(500).json({ error: 'Gagal mengambil data intern.' });

    const scoreReports = (reports || []).map(r => ({ targetId: r.target_id, targetType: r.target_type, pointsImpact: r.points_impact, aspectId: r.aspect_id }));
    res.json({
      data: (interns || []).map(u => {
        const b = scoreBreakdown({ id: u.id, startup: u.startup, rubricScores: u.rubric_scores }, rubrics || [], scoreReports);
        return {
          nim: u.nim, email: u.email, name: u.name, startup: u.startup, status: u.status,
          score: b.total, grade: getGrade(b.total),
          aspects: b.aspects.map(a => ({ name: rubrics.find(r => r.id === a.id)?.name, weight: a.weight, value: a.value })),
          noAspectPoints: b.noAspectPart,
        };
      }),
    });
  } catch (err) {
    console.error('Integration scores error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

router.use(authMiddleware);

// Bobot komponen aspek "Kedisiplinan & Pelaporan" (total 100).
export const PRESENCE_WEIGHTS = { kehadiran: 40, konsistensi: 30, kualitas: 30 };
// Jumlah riwayat sync yang disimpan per intern (users.presence_stats)
const PRESENCE_HISTORY_MAX = 20;

// Nilai aspek 0–100 dari rekap presensi. null = tidak ada hari wajib hadir (nilai lama tidak disentuh).
// - kehadiran   = (tepat waktu + ½ telat) / (tepat waktu + telat + alpha). Izin/sakit tidak dihitung.
// - konsistensi = hari hadir yang ada laporan hariannya / hari hadir
// - kualitas    = laporan approved / laporan yang sudah dinilai admin (pending tidak dihitung)
// Komponen tanpa data (belum ada laporan yang dinilai) dilewati; bobotnya dibagi ke komponen lain.
export function disciplineScore(s) {
  const wajib = s.ontime + s.late + s.alpha;
  if (!wajib) return null;
  const hadir = s.ontime + s.late;
  const dinilai = s.reports.approved + s.reports.disapproved;
  const parts = {
    // ponytail: telat dihitung setengah tanpa melihat lamanya; pakai total_late_minutes kalau perlu lebih halus.
    kehadiran: (100 * (s.ontime + 0.5 * s.late)) / wajib,
    konsistensi: hadir ? (100 * Math.max(0, hadir - s.missing_daily_reports)) / hadir : 0,
    kualitas: dinilai ? (100 * s.reports.approved) / dinilai : null,
  };
  let sum = 0;
  let weight = 0;
  for (const [k, v] of Object.entries(parts)) {
    if (v == null) continue;
    sum += v * PRESENCE_WEIGHTS[k];
    weight += PRESENCE_WEIGHTS[k];
  }
  const rounded = Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, v == null ? null : Math.round(v)]));
  return { score: Math.round(sum / weight), parts: rounded };
}

const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const norm = (v) => String(v ?? '').trim().toLowerCase();
// JSON dengan key terurut: jsonb Postgres tidak menyimpan urutan key
const stableJson = (o) => JSON.stringify(o, (k, v) =>
  v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : 1))) : v);

// POST /api/integration/sync-presence — Tarik rekap presensi satu batch, isi nilai aspek presensi (HR only)
router.post('/sync-presence', requireRole('field'), async (req, res) => {
  try {
    const { from, to } = req.body || {};
    if (!isDate(from) || !isDate(to) || from > to) {
      return res.status(400).json({ error: 'Tanggal mulai & selesai batch tidak valid.' });
    }
    const baseUrl = process.env.PRESENCE_API_URL;
    const key = process.env.PRESENCE_API_KEY;
    if (!baseUrl || !key) {
      return res.status(500).json({ error: 'Integrasi presensi belum dikonfigurasi (PRESENCE_API_URL / PRESENCE_API_KEY).' });
    }

    const { data: aspects } = await supabase.from('rubric_aspects').select('id').eq('source', 'presence');
    const aspectId = aspects?.[0]?.id;
    if (!aspectId) {
      return res.status(400).json({ error: 'Tandai satu aspek rubrik sebagai "Dari presensi" terlebih dahulu.' });
    }

    let rows;
    try {
      const url = `${baseUrl.replace(/\/+$/, '')}/api/integration/discipline?from=${from}&to=${to}`;
      // redirect manual: endpoint yang belum di-deploy biasanya diarahkan ke halaman login
      const r = await fetch(url, {
        headers: { 'X-Integration-Key': key, Accept: 'application/json' },
        redirect: 'manual',
        signal: AbortSignal.timeout(60_000),
      });
      if (r.status === 401) throw new Error('kunci integrasi ditolak, samakan PRESENCE_API_KEY dengan INTEGRATION_API_KEY');
      if (r.status >= 300 && r.status < 400) throw new Error('diarahkan ke halaman lain, endpoint integrasi belum ada di PRESENCE_API_URL');
      if (r.status === 404) throw new Error('endpoint integrasi belum ada di PRESENCE_API_URL');
      if (!r.ok) throw new Error(`presensi membalas HTTP ${r.status}`);
      rows = (await r.json().catch(() => ({}))).data;
      if (!Array.isArray(rows)) throw new Error('respons presensi bukan data integrasi');
    } catch (err) {
      console.error('Fetch presence error:', err);
      const reason = err.name === 'TimeoutError' ? 'aplikasi presensi tidak merespons'
        : err.cause?.code === 'ECONNREFUSED' ? 'aplikasi presensi tidak berjalan di PRESENCE_API_URL'
        : err.message;
      return res.status(502).json({ error: `Gagal mengambil data dari aplikasi presensi: ${reason}.` });
    }

    const byNim = new Map(rows.filter(r => norm(r.nim)).map(r => [norm(r.nim), r]));
    const byEmail = new Map(rows.map(r => [norm(r.email), r]));

    const { data: interns, error } = await supabase
      .from('users')
      .select('id, name, email, nim, startup, rubric_scores, presence_stats')
      .eq('role', 'intern');
    if (error) {
      return res.status(500).json({ error: 'Gagal mengambil data intern.' });
    }
    // Laporan perilaku beraspek presensi tetap dihitung: nilai aspek = nilai presensi + poin laporan itu
    const { data: aspectReports } = await supabase
      .from('behavior_reports')
      .select('target_id, target_type, points_impact')
      .eq('aspect_id', aspectId);
    const reportPoints = (user) => (aspectReports || [])
      .filter(r => r.target_id === user.id || (r.target_type === 'startup' && r.target_id === user.startup))
      .reduce((sum, r) => sum + (r.points_impact || 0), 0);

    const syncedAt = new Date().toISOString();
    const unmatched = [];
    const noData = [];
    let updated = 0;
    // Cocokkan pakai NIM dulu, lalu email.
    for (const user of interns || []) {
      const stats = (norm(user.nim) && byNim.get(norm(user.nim))) || byEmail.get(norm(user.email));
      if (!stats) { unmatched.push(user.name); continue; }
      const result = disciplineScore(stats);
      if (!result) { noData.push(user.name); continue; }

      const { nama, email, nim, ...rest } = stats;
      // Riwayat sync, terbaru di depan. Hasil yang sama persis dengan sync terakhir cukup memperbarui tanggalnya.
      const entry = { ...rest, ...result };
      const old = Array.isArray(user.presence_stats) ? user.presence_stats : [];
      const { synced_at: _, ...lastEntry } = old[0] || {};
      const same = old.length > 0 && stableJson(lastEntry) === stableJson(entry);
      const history = [{ ...entry, synced_at: syncedAt }, ...old.slice(same ? 1 : 0)].slice(0, PRESENCE_HISTORY_MAX);
      const { error: updateError } = await supabase
        .from('users')
        .update({
          rubric_scores: { ...(user.rubric_scores || {}), [aspectId]: result.score + reportPoints(user) },
          presence_stats: history,
        })
        .eq('id', user.id);
      if (updateError) {
        console.error('Update presence score error:', updateError);
        const msg = updateError.code === 'PGRST204'
          ? 'Kolom presence_stats belum ada. Jalankan server/migrations/004_presence_integration.sql di Supabase.'
          : 'Gagal menyimpan nilai presensi.';
        return res.status(500).json({ error: msg, updated });
      }
      updated++;
    }

    res.json({ updated, unmatched, noData });
  } catch (err) {
    console.error('Sync presence error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

export default router;
