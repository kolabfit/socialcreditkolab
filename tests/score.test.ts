import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeInternScore, getGrade, maxPointsFor, DEFAULT_MAX_POINTS } from '../src/utils.ts';

const rubrics = [
  { id: '1', weight: 30 },
  { id: '2', weight: 40 },
  { id: '3', weight: 30 },
];

test('rumus skor sama dengan versi lama di store.tsx', () => {
  const user = { id: 'i1', startup: 'Alpha', rubricScores: { '1': 80, '2': 70, '3': 90 } };
  const reports = [
    { targetId: 'i1', pointsImpact: 5 },
    { targetId: 'Alpha', targetType: 'startup', pointsImpact: -3 },
    { targetId: 'i2', pointsImpact: 100 },
    { targetId: 'Beta', targetType: 'startup', pointsImpact: 100 },
  ];
  // 80*.3 + 70*.4 + 90*.3 = 79, + 5 - 3
  assert.equal(computeInternScore(user, rubrics, reports), 81);
});

test('pembulatan rubrik dan data kosong', () => {
  assert.equal(computeInternScore({ id: 'x', rubricScores: { '1': 85 } }, rubrics, []), 26); // 25.5 → 26
  assert.equal(computeInternScore({ id: 'x' }, rubrics, []), 0);
  assert.equal(computeInternScore({ id: 'x', startup: null }, [], [{ targetId: 'x' }]), 0);
});

test('grade', () => {
  assert.deepEqual([90, 89, 70, 60, 59].map(getGrade), ['A', 'B', 'C', 'D', 'E']);
});

test('skor dibatasi maksimal 100 (kasus 82 rubrik + 60 bonus = 142)', () => {
  const r4 = [{ id: 'a', weight: 30 }, { id: 'b', weight: 10 }, { id: 'c', weight: 30 }, { id: 'd', weight: 30 }];
  const user = { id: 'af', startup: 'JagoAI', rubricScores: { a: 80, b: 85, c: 80, d: 85 } };
  const reports = [10, 10, 20].map(p => ({ targetId: 'af', pointsImpact: p }))
    .concat([10, 10].map(p => ({ targetId: 'JagoAI', targetType: 'startup', pointsImpact: p })));
  assert.equal(computeInternScore(user, r4, reports), 100);
});

test('skor tidak pernah di bawah 0', () => {
  assert.equal(computeInternScore({ id: 'x' }, rubrics, [{ targetId: 'x', pointsImpact: -15 }]), 0);
});

test('nilai akhir = rata-rata berbobot aspek; poin laporan beraspek tidak dihitung dua kali (kasus screenshot Afrisya = 49)', async () => {
  const { scoreBreakdown } = await import('../src/utils.ts');
  const r4 = [{ id: 'K', weight: 30 }, { id: 'O', weight: 10 }, { id: 'D', weight: 30 }, { id: 'S', weight: 30 }];
  // rubric_scores sudah termasuk poin laporan (applyReportPoints): K 10 = laporan +10, S 40 = laporan 10+10+20
  const user = { id: 'af', startup: 'JagoAI', rubricScores: { K: 10, O: 50, D: 95, S: 40 } };
  const reports = [
    { targetId: 'JagoAI', targetType: 'startup', pointsImpact: 10, aspectId: 'D' },
    { targetId: 'af', pointsImpact: 10, aspectId: 'S' },
    { targetId: 'af', pointsImpact: 10, aspectId: 'S' },
    { targetId: 'af', pointsImpact: 20, aspectId: 'S' },
    { targetId: 'JagoAI', targetType: 'startup', pointsImpact: 10, aspectId: 'K' },
  ];
  const b = scoreBreakdown(user, r4, reports);
  // 10×.3 + 50×.1 + 95×.3 + 40×.3 = 48.5 → 49
  assert.deepEqual(b.aspects.map(a => a.value), [10, 50, 95, 40]);
  assert.equal(b.total, 49);
});

test('nilai aspek di luar 0–100 dibatasi', async () => {
  const { scoreBreakdown } = await import('../src/utils.ts');
  const b = scoreBreakdown({ id: 'x', rubricScores: { a: 130, b: -20 } }, [{ id: 'a', weight: 50 }, { id: 'b', weight: 50 }], []);
  assert.deepEqual([b.aspects[0].value, b.aspects[1].value, b.total], [100, 0, 50]);
});

test('skor di masa lalu untuk grafik: poin laporan setelah tanggal itu dikeluarkan', async () => {
  const { computeInternScoreAt } = await import('../src/utils.ts');
  const user = { id: 'x', rubricScores: { a: 70 } };
  const reports = [{ targetId: 'x', pointsImpact: 20, aspectId: 'a', date: '2026-08-10' }, { targetId: 'x', pointsImpact: 5, date: '2026-08-10' }];
  const r = [{ id: 'a', weight: 100 }];
  assert.equal(computeInternScoreAt(user, r, reports, new Date('2026-08-01').getTime()), 50);
  assert.equal(computeInternScoreAt(user, r, reports, new Date('2026-08-31').getTime()), 75);
});

test('maxPointsFor', () => {
  assert.equal(maxPointsFor(undefined), DEFAULT_MAX_POINTS);
  assert.equal(maxPointsFor({ max_points: null }), 20);
  assert.equal(maxPointsFor({ max_points: 5 }), 5);
});

test('rincian skor: laporan beraspek (termasuk aspek dihapus) tidak ditambah lagi', async () => {
  const { scoreBreakdown, aspectLabel } = await import('../src/utils.ts');
  const r4 = [
    { id: 'K', name: 'Kebersihan', weight: 30 }, { id: 'O', name: 'Olahraga', weight: 10 },
    { id: '1', name: 'Kedisiplinan', weight: 30 }, { id: '3', name: 'Sikap', weight: 30 },
  ];
  const user = { id: 'af', startup: 'JagoAI', rubricScores: { K: 10, O: 0, '1': 10, '3': 0 } };
  const reports = [
    { targetId: 'JagoAI', targetType: 'startup', pointsImpact: 10, aspectId: 'K' },
    { targetId: 'af', pointsImpact: 20, aspectId: '2' },
    { targetId: 'af', pointsImpact: 10, aspectId: '2' },
    { targetId: 'af', pointsImpact: 10, aspectId: '2' },
    { targetId: 'JagoAI', targetType: 'startup', pointsImpact: 10, aspectId: '1' },
  ];
  // Poin aspek '2' yang dihapus sudah dipindah ke aspek tujuan saat penghapusan → 10×.3 + 10×.3 = 6
  const b = scoreBreakdown(user, r4, reports);
  assert.deepEqual([b.rubricPart, b.noAspectPart, b.total], [6, 0, 6]);
  assert.equal(aspectLabel('2', r4), 'Aspek sudah dihapus');
  assert.equal(aspectLabel('K', r4), 'Kebersihan');
  assert.equal(aspectLabel(null, r4), null);
});

test('warna nilai: ≥80 hijau, 60–79 kuning, <60 merah', async () => {
  const { scoreTone } = await import('../src/utils.ts');
  assert.deepEqual([100, 80, 79, 60, 59, 0].map(scoreTone), ['good', 'good', 'mid', 'mid', 'low', 'low']);
});
