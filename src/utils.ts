export function getGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'E';
}

// Warna nilai mengikuti grade: ≥80 (A/B) hijau, 60–79 (C/D) kuning, <60 (E) merah.
// Samakan dengan scoreTone di portal_kolab/views/ScoresView.tsx.
export function scoreTone(score: number): 'good' | 'mid' | 'low' {
  return score >= 80 ? 'good' : score >= 60 ? 'mid' : 'low';
}

export const SCORE_MAX = 100;
// Batas poin per laporan bila aspek belum punya max_points (atau laporan tanpa aspek). Samakan dengan server/routes/reports.js.
export const DEFAULT_MAX_POINTS = 20;

export function maxPointsFor(aspect?: { max_points?: number | null } | null): number {
  return aspect?.max_points || DEFAULT_MAX_POINTS;
}

type ScoreUser = { id: string; startup?: string | null; rubricScores?: Record<string, number> | null };
type ScoreReport = { targetId: string; targetType?: string; pointsImpact?: number; aspectId?: string | null };

const clampScore = (n: number) => Math.max(0, Math.min(SCORE_MAX, n));
const sumPoints = (list: ScoreReport[]) => list.reduce((sum, r) => sum + (r.pointsImpact || 0), 0);

// Rincian skor intern. Nilai akhir = rata-rata berbobot nilai aspek:
// - aspects[i].value = rubric_scores[aspek], dibatasi 0–100. Poin laporan beraspek SUDAH termasuk di sini
//   (ditambahkan saat laporan dibuat, lihat applyReportPoints di server/routes/reports.js), jadi jangan ditambah lagi.
// - rubricPart       = round(Σ value × bobot%)
// - noAspectPart     = poin laporan tanpa aspek; tidak masuk rubric_scores, jadi ditambahkan langsung
// - total            = rubricPart + noAspectPart, dibatasi 0–100
export function scoreBreakdown(user: ScoreUser, rubrics: { id: string; weight: number }[], reports: ScoreReport[]) {
  const mine = reports.filter(r => r.targetId === user.id || (r.targetType === 'startup' && r.targetId === user.startup));

  const aspects = rubrics.map(r => ({ id: r.id, weight: r.weight, value: clampScore(user.rubricScores?.[r.id] || 0) }));
  const rubricPart = Math.round(aspects.reduce((sum, a) => sum + a.value * (a.weight / 100), 0));
  const noAspectPart = sumPoints(mine.filter(r => !r.aspectId));

  return { aspects, rubricPart, noAspectPart, total: clampScore(rubricPart + noAspectPart) };
}

export function computeInternScore(user: ScoreUser, rubrics: { id: string; weight: number }[], reports: ScoreReport[]): number {
  return scoreBreakdown(user, rubrics, reports).total;
}

// Perkiraan skor pada waktu `until` (ms) untuk grafik tren: poin laporan setelah waktu itu dikeluarkan dari nilai aspeknya.
// ponytail: perubahan nilai manual & sync presensi tidak punya riwayat, jadi dianggap sudah berlaku sejak awal.
export function computeInternScoreAt(user: ScoreUser, rubrics: { id: string; weight: number }[], reports: (ScoreReport & { date: string })[], until: number): number {
  const isMine = (r: ScoreReport) => r.targetId === user.id || (r.targetType === 'startup' && r.targetId === user.startup);
  const rubricScores = { ...(user.rubricScores || {}) };
  for (const r of reports) {
    if (r.aspectId && isMine(r) && new Date(r.date).getTime() > until) rubricScores[r.aspectId] = (rubricScores[r.aspectId] || 0) - (r.pointsImpact || 0);
  }
  return computeInternScore({ ...user, rubricScores }, rubrics, reports.filter(r => new Date(r.date).getTime() <= until));
}

// Nama aspek untuk ditampilkan di riwayat. null = laporan tanpa aspek.
export function aspectLabel(aspectId: string | null | undefined, rubrics: { id: string; name: string }[]): string | null {
  if (!aspectId) return null;
  return rubrics.find(a => a.id === aspectId)?.name ?? 'Aspek sudah dihapus';
}
