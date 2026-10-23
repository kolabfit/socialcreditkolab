import { test, mock, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createFakeSupabase } from './fakeSupabase.js';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.SUPABASE_URL = 'http://fake';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake';
process.env.PRESENCE_API_KEY = 'kunci';
process.env.INTEGRATION_API_KEY = 'portal';

const fake = createFakeSupabase({
  users: [
    { id: 'hr', name: 'HR', email: 'hr@x.id', role: 'field', status: 'active' },
    { id: 'dosen', name: 'Dosen', email: 'dosen@x.id', role: 'academic', status: 'active' },
    { id: 'i1', name: 'Intern 1', email: 'beda@x.id', nim: '111', role: 'intern', status: 'active', rubric_scores: { a: 70 } },
    { id: 'i2', name: 'Intern 2', email: 'I2@X.id ', role: 'intern', status: 'active', rubric_scores: {} },
    { id: 'i3', name: 'Intern 3', email: 'i3@x.id', role: 'intern', status: 'active', rubric_scores: {} },
  ],
  behavior_reports: [{ id: 'br1', target_id: 'i1', target_type: 'intern', points_impact: 5, aspect_id: 'p' }],
  rubric_aspects: [
    { id: 'a', name: 'Sikap', weight: 70 },
    { id: 'p', name: 'Kedisiplinan & Pelaporan', weight: 30, source: 'presence' },
  ],
});

mock.module(new URL('../server/config/supabase.js', import.meta.url).href, {
  namedExports: { supabase: fake },
});

const { default: app } = await import('../server/index.js');
const { generateToken } = await import('../server/middleware/auth.js');
const { disciplineScore } = await import('../server/routes/integration.js');

const stat = (o) => ({ ontime: 0, late: 0, alpha: 0, missing_daily_reports: 0, reports: { approved: 0, disapproved: 0, pending: 0 }, ...o });
let lastQuery;
const presence = http.createServer((req, res) => {
  if (req.headers['x-integration-key'] !== 'kunci') { res.writeHead(401); return res.end(); }
  lastQuery = new URL(req.url, 'http://x').searchParams;
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true, data: [
    { nama: 'A', email: 'lain@x.id', nim: '111', period_start: lastQuery.get('from'), period_end: lastQuery.get('to'), ...stat({ ontime: 8, late: 2, missing_daily_reports: 1, reports: { approved: 3, disapproved: 1, pending: 5 } }) },
    { nama: 'B', email: 'i2@x.id', nim: '999', ...stat({ izin_sakit: 3 }) },
  ] }));
});

let server, base;
before(async () => {
  await new Promise(r => presence.listen(0, r));
  process.env.PRESENCE_API_URL = `http://127.0.0.1:${presence.address().port}/`;
  await new Promise(r => { server = app.listen(0, () => { base = `http://127.0.0.1:${server.address().port}/api`; r(); }); });
});
after(() => { server.close(); presence.close(); });

async function call(method, path, as, body) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${generateToken(fake.db.users.find(u => u.id === as))}` },
    body: body && JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

test('rumus 40/30/30: telat setengah, izin/sakit & pending tidak dihitung', () => {
  // kehadiran (8 + 1) / 10 = 90, konsistensi 9/10 = 90, kualitas 3/4 = 75 → 36 + 27 + 22.5 = 85.5
  assert.deepEqual(
    disciplineScore(stat({ ontime: 8, late: 2, izin_sakit: 5, missing_daily_reports: 1, reports: { approved: 3, disapproved: 1, pending: 9 } })),
    { score: 86, parts: { kehadiran: 90, konsistensi: 90, kualitas: 75 } },
  );
  // Belum ada laporan dinilai → bobot kualitas dibagi ke kehadiran & konsistensi: (100×40 + 50×30) / 70
  assert.equal(disciplineScore(stat({ ontime: 4, missing_daily_reports: 2 })).score, 79);
  assert.equal(disciplineScore(stat({ alpha: 4 })).score, 0);
  assert.equal(disciplineScore(stat({ izin_sakit: 4 })), null);
});

test('sync presensi hanya untuk HR & tanggal wajib valid', async () => {
  assert.equal((await call('POST', '/integration/sync-presence', 'dosen', { from: '2026-01-01', to: '2026-06-30' })).status, 403);
  assert.equal((await call('POST', '/integration/sync-presence', 'hr', { from: '2026-06-30', to: '2026-01-01' })).status, 400);
  assert.equal((await call('POST', '/integration/sync-presence', 'hr', { from: 'x', to: '2026-01-01' })).status, 400);
});

test('sync presensi mengisi aspek presensi, cocokkan NIM lalu email', async () => {
  const res = await call('POST', '/integration/sync-presence', 'hr', { from: '2026-01-01', to: '2026-06-30' });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { updated: 1, unmatched: ['Intern 3'], noData: ['Intern 2'] });
  assert.equal(lastQuery.get('from'), '2026-01-01');
  assert.equal(lastQuery.get('to'), '2026-06-30');

  const i1 = fake.db.users.find(u => u.id === 'i1');
  // nilai presensi 86 + laporan beraspek presensi +5
  assert.deepEqual(i1.rubric_scores, { a: 70, p: 91 });
  assert.equal(i1.presence_stats.length, 1);
  assert.equal(i1.presence_stats[0].parts.kualitas, 75);
  assert.equal(i1.presence_stats[0].nama, undefined);

  // Sync berikutnya menambah riwayat di depan
  await call('POST', '/integration/sync-presence', 'hr', { from: '2026-01-01', to: '2026-07-31' });
  const again = fake.db.users.find(u => u.id === 'i1').presence_stats;
  assert.equal(again.length, 2);
  assert.equal(again[0].period_end, '2026-07-31');

  // Hasil sama persis dengan sync terakhir → tidak menambah riwayat (urutan key jsonb diabaikan)
  const i1now = fake.db.users.find(u => u.id === 'i1');
  i1now.presence_stats = i1now.presence_stats.map(e => Object.fromEntries(Object.entries(e).reverse()));
  await call('POST', '/integration/sync-presence', 'hr', { from: '2026-01-01', to: '2026-07-31' });
  assert.equal(fake.db.users.find(u => u.id === 'i1').presence_stats.length, 2);
});

test('nilai aspek presensi tidak bisa ditimpa lewat input manual', async () => {
  const res = await call('PATCH', '/users/i1/score', 'dosen', { score: 90, rubricScores: { a: 95, p: 100 } });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.rubricScores, { a: 95, p: 91 });
});

test('hanya satu aspek boleh bersumber presensi', async () => {
  const res = await call('PUT', '/rubrics', 'hr', { aspects: [
    { id: 'a', name: 'Sikap', weight: 70, source: 'presence' },
    { id: 'p', name: 'Kedisiplinan', weight: 30, source: 'presence' },
  ] });
  assert.equal(res.status, 400);
});

test('skor untuk portal: wajib kunci integrasi, rumus sama dengan tampilan', async () => {
  const get = (key) => fetch(base + '/integration/scores', { headers: key ? { 'X-Integration-Key': key } : {} });
  assert.equal((await get()).status, 401);
  assert.equal((await get('salah')).status, 401);
  const res = await get('portal');
  assert.equal(res.status, 200);
  const i1 = (await res.json()).data.find(r => r.nim === '111');
  // a 95 × 70% + p 91 × 30% = 66.5 + 27.3 = 93.8 → 94
  assert.deepEqual([i1.score, i1.grade, i1.aspects.length], [94, 'A', 2]);
  assert.equal('password_hash' in i1 || 'rubric_scores' in i1, false);
});
