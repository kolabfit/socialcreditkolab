import { test, mock, before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { createFakeSupabase } from './fakeSupabase.js';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.SUPABASE_URL = 'http://fake';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake';

const hash = bcrypt.hashSync('rahasia123', 4);
const fake = createFakeSupabase({
  users: [
    { id: 'hr', name: 'HR', email: 'hr@x.id', role: 'field', status: 'active', score: 0, password_hash: hash },
    { id: 'dosen', name: 'Dosen', email: 'dosen@x.id', role: 'academic', status: 'active', score: 0, password_hash: hash },
    { id: 'dosen2', name: 'Dosen 2', email: 'dosen2@x.id', role: 'academic', status: 'active', score: 0, password_hash: hash },
    { id: 'i1', name: 'Intern 1', email: 'i1@x.id', role: 'intern', status: 'active', startup: 'Alpha', score: 50, rubric_scores: { '1': 80 }, password_hash: hash },
    { id: 'i2', name: 'Intern 2', email: 'i2@x.id', role: 'intern', status: 'active', startup: 'Alpha', score: 40, rubric_scores: {}, password_hash: hash },
    { id: 'sus', name: 'Suspended', email: 'sus@x.id', role: 'intern', status: 'suspended', score: 10, password_hash: hash },
  ],
  behavior_reports: [],
  rubric_aspects: [{ id: '1', name: 'Disiplin', weight: 100, max_points: 10 }],
  startups: [],
  batches: [],
  intern_activities: [
    { id: 'a1', intern_id: 'i1', date: '2026-10-01', type: 'harian', title: 't', description: 'd', status: 'pending' },
    { id: 'a2', intern_id: 'i2', date: '2026-10-01', type: 'harian', title: 't', description: 'd', status: 'pending' },
  ],
});

mock.module(new URL('../server/config/supabase.js', import.meta.url).href, {
  namedExports: { supabase: fake },
});

const { default: app } = await import('../server/index.js');
const { generateToken } = await import('../server/middleware/auth.js');

let server, base;
before(() => new Promise(r => { server = app.listen(0, () => { base = `http://127.0.0.1:${server.address().port}/api`; r(); }); }));
after(() => server.close());

const tok = (id) => generateToken(fake.db.users.find(u => u.id === id));
async function call(method, path, { as, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(as && { Authorization: `Bearer ${tok(as)}` }) },
    body: body && JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}
const user = (id) => fake.db.users.find(u => u.id === id);

test('endpoint tanpa token ditolak 401', async () => {
  for (const path of ['/users', '/reports', '/activities', '/batches', '/rubrics', '/startups']) {
    assert.equal((await call('GET', path)).status, 401, path);
  }
  assert.equal((await call('POST', '/batches', { body: { name: 'x', date_range: 'y', status: 'active' } })).status, 401);
});

test('register tidak bisa sebagai HR (field)', async () => {
  const r = await call('POST', '/auth/register', { body: { name: 'Hacker', email: 'h@x.id', password: 'rahasia123', role: 'field' } });
  assert.equal(r.status, 403);
  assert.equal(fake.db.users.some(u => u.email === 'h@x.id'), false);
});

test('register intern mendapat score 0 walau body mengirim score', async () => {
  const r = await call('POST', '/auth/register', { body: { name: 'Baru', email: 'baru@x.id', password: 'rahasia123', role: 'intern', score: 999 } });
  assert.equal(r.status, 201);
  assert.equal(r.body.user.score, 0);
  assert.equal(r.body.user.password_hash, undefined);
});

test('intern tidak bisa menaikkan role/score/status lewat PUT profil', async () => {
  const r = await call('PUT', '/users/i1', { as: 'i1', body: { name: 'Intern Satu', role: 'field', score: 999, status: 'active', rubric_scores: { '1': 100 } } });
  assert.equal(r.status, 200);
  assert.equal(user('i1').name, 'Intern Satu');
  assert.equal(user('i1').role, 'intern');
  assert.equal(user('i1').score, 50);
  assert.deepEqual(user('i1').rubric_scores, { '1': 80 });
});

test('user non-HR tidak bisa mengubah user lain', async () => {
  assert.equal((await call('PUT', '/users/i2', { as: 'i1', body: { name: 'x' } })).status, 403);
  assert.equal((await call('PUT', '/users/i1', { as: 'dosen', body: { name: 'x' } })).status, 403);
});

test('HR bisa mengubah role user lain', async () => {
  const r = await call('PUT', '/users/dosen2', { as: 'hr', body: { role: 'academic', phone: '08' } });
  assert.equal(r.status, 200);
  assert.equal(user('dosen2').phone, '08');
  assert.equal((await call('PUT', '/users/dosen2', { as: 'hr', body: { role: 'admin' } })).status, 400);
});

test('intern tidak bisa set score sendiri; pembimbing bisa', async () => {
  assert.equal((await call('PATCH', '/users/i1/score', { as: 'i1', body: { score: 100 } })).status, 403);
  assert.equal(user('i1').score, 50);
  assert.equal((await call('PATCH', '/users/i1/score', { as: 'dosen', body: { score: 'abc' } })).status, 400);
});

test('intern hanya melihat dirinya + pembimbing, tanpa password_hash', async () => {
  const r = await call('GET', '/users', { as: 'i1' });
  assert.equal(r.status, 200);
  const ids = r.body.map(u => u.id);
  assert.ok(ids.includes('i1') && ids.includes('dosen') && ids.includes('hr'));
  assert.equal(ids.includes('i2'), false);
  assert.ok(r.body.every(u => u.password_hash === undefined));
  assert.equal((await call('GET', '/users/i2', { as: 'i1' })).status, 403);
});

test('intern tidak bisa membuat / menghapus laporan penilaian', async () => {
  const r = await call('POST', '/reports', { as: 'i1', body: { targetId: 'i1', date: '2026-10-01', type: 'good', description: 'x', pointsImpact: 50 } });
  assert.equal(r.status, 403);
  assert.equal(user('i1').score, 50);
});

test('report pribadi: reporterId dari token, poin masuk lalu kembali persis setelah dihapus', async () => {
  const before = structuredClone(user('i1'));
  const r = await call('POST', '/reports', { as: 'dosen', body: { targetId: 'i1', reporterId: 'hr', date: '2026-10-01', type: 'good', description: 'Bagus', pointsImpact: 5, aspectId: '1' } });
  assert.equal(r.status, 201);
  assert.equal(r.body.reporterId, 'dosen');
  assert.equal(user('i1').score, before.score + 5);
  assert.equal(user('i1').rubric_scores['1'], 85);

  // dosen lain tidak boleh menghapus laporan milik dosen
  assert.equal((await call('DELETE', `/reports/${r.body.id}`, { as: 'dosen2' })).status, 403);
  assert.equal((await call('DELETE', `/reports/${r.body.id}`, { as: 'dosen' })).status, 200);
  assert.equal(user('i1').score, before.score);
  assert.deepEqual(user('i1').rubric_scores, before.rubric_scores);
});

test('report startup mengenai semua anggota & di-revert oleh HR', async () => {
  const s1 = user('i1').score, s2 = user('i2').score;
  const r = await call('POST', '/reports', { as: 'hr', body: { targetId: 'Alpha', targetType: 'startup', date: '2026-10-01', type: 'bad', description: 'Telat', pointsImpact: -3 } });
  assert.equal(r.status, 201);
  assert.equal(user('i1').score, s1 - 3);
  assert.equal(user('i2').score, s2 - 3);

  // intern melihat laporan startup-nya
  const seen = await call('GET', '/reports', { as: 'i2' });
  assert.deepEqual(seen.body.map(x => x.id), [r.body.id]);

  await call('DELETE', `/reports/${r.body.id}`, { as: 'hr' });
  assert.equal(user('i1').score, s1);
  assert.equal(user('i2').score, s2);
});

test('validasi report', async () => {
  const base = { targetId: 'i1', date: '2026-10-01', description: 'x' };
  assert.equal((await call('POST', '/reports', { as: 'hr', body: { ...base, type: 'great' } })).status, 400);
  assert.equal((await call('POST', '/reports', { as: 'hr', body: { ...base, type: 'good', pointsImpact: 'abc' } })).status, 400);
});

test('aktivitas: intern hanya lihat milik sendiri, tidak bisa approve / memalsukan pemilik', async () => {
  const list = await call('GET', '/activities', { as: 'i1' });
  assert.deepEqual(list.body.map(a => a.id), ['a1']);

  const c = await call('POST', '/activities', { as: 'i1', body: { intern_id: 'i2', date: '2026-10-02', type: 'kejadian', title: 'T', description: 'D', status: 'approved' } });
  assert.equal(c.status, 201);
  assert.equal(c.body.intern_id, 'i1');
  assert.equal(c.body.status, 'pending');

  assert.equal((await call('PATCH', '/activities/a1', { as: 'i1', body: { status: 'approved' } })).status, 403);
  assert.equal((await call('DELETE', '/activities/a2', { as: 'i1' })).status, 403);
  assert.equal((await call('PATCH', '/activities/a1', { as: 'hr', body: { status: 'approved' } })).status, 200);
  assert.equal((await call('DELETE', `/activities/${c.body.id}`, { as: 'i1' })).status, 204);
});

test('batch hanya bisa diubah HR', async () => {
  const body = { name: 'Batch 1', date_range: 'Jan-Jun', status: 'active' };
  assert.equal((await call('POST', '/batches', { as: 'i1', body })).status, 403);
  assert.equal((await call('POST', '/batches', { as: 'hr', body: { ...body, status: 'x' } })).status, 400);
  assert.equal((await call('POST', '/batches', { as: 'hr', body })).status, 201);
});

test('token user yang disuspend langsung ditolak', async () => {
  assert.equal((await call('GET', '/auth/me', { as: 'sus' })).status, 403);
});

test('token palsu ditolak', async () => {
  const res = await fetch(base + '/users', { headers: { Authorization: 'Bearer abc.def.ghi' } });
  assert.equal(res.status, 401);
});

test('login: sukses, salah password, lalu rate-limit', async () => {
  assert.equal((await call('POST', '/auth/login', { body: { email: 'hr@x.id', password: 'rahasia123' } })).status, 200);
  let last;
  for (let i = 0; i < 11; i++) {
    last = await call('POST', '/auth/login', { body: { email: 'i2@x.id', password: 'salah' } });
  }
  assert.equal(last.status, 429);
});

test('batas poin per aspek & tanpa aspek ditegakkan', async () => {
  const before = user('i1').score;
  const body = { targetId: 'i1', date: '2026-10-01', type: 'good', description: 'x' };
  const over = await call('POST', '/reports', { as: 'hr', body: { ...body, aspectId: '1', pointsImpact: 11 } });
  assert.equal(over.status, 400);
  assert.match(over.body.error, /±10/);
  assert.equal((await call('POST', '/reports', { as: 'hr', body: { ...body, aspectId: '1', pointsImpact: -11 } })).status, 400);
  assert.equal((await call('POST', '/reports', { as: 'hr', body: { ...body, pointsImpact: 21 } })).status, 400);
  assert.equal((await call('POST', '/reports', { as: 'hr', body: { ...body, aspectId: 'tidak-ada', pointsImpact: 1 } })).status, 400);
  assert.equal(user('i1').score, before);

  const ok = await call('POST', '/reports', { as: 'hr', body: { ...body, aspectId: '1', pointsImpact: 10 } });
  assert.equal(ok.status, 201);
  await call('DELETE', `/reports/${ok.body.id}`, { as: 'hr' });
  assert.equal(user('i1').score, before);
});

test('rubrik: max_points disimpan & divalidasi', async () => {
  const bad = await call('PUT', '/rubrics', { as: 'hr', body: { aspects: [{ id: '1', name: 'Disiplin', weight: 100, max_points: 0 }] } });
  assert.equal(bad.status, 400);
  const ok = await call('PUT', '/rubrics', { as: 'hr', body: { aspects: [{ id: '1', name: 'Disiplin', weight: 100, max_points: 15 }] } });
  assert.equal(ok.status, 200);
  assert.equal(fake.db.rubric_aspects[0].max_points, 15);
  // tanpa max_points → default 20
  await call('PUT', '/rubrics', { as: 'hr', body: { aspects: [{ id: '1', name: 'Disiplin', weight: 100 }] } });
  assert.equal(fake.db.rubric_aspects[0].max_points, 20);
  assert.equal(user('i1').score, 50);
});

test('PATCH score dibatasi 100', async () => {
  const r = await call('PATCH', '/users/i2/score', { as: 'hr', body: { score: 142 } });
  assert.equal(r.status, 200);
  assert.equal(user('i2').score, 100);
});

test('hapus aspek yang masih dipakai wajib dipindah; laporan & nilai ikut pindah', async () => {
  fake.db.rubric_aspects.push({ id: 'Q', name: 'Kualitas', weight: 0, max_points: 20 });
  fake.db.behavior_reports.push({ id: 'rq', target_id: 'i2', target_type: 'intern', reporter_id: 'hr', date: '2026-10-01', type: 'good', description: 'lembur', points_impact: 7, aspect_id: 'Q' });
  user('i2').rubric_scores = { '1': 3, Q: 7 };

  const keep = [{ id: '1', name: 'Disiplin', weight: 100 }];
  const refused = await call('PUT', '/rubrics', { as: 'hr', body: { aspects: keep } });
  assert.equal(refused.status, 400);
  assert.equal(refused.body.code, 'REASSIGN_REQUIRED');
  assert.ok(fake.db.rubric_aspects.some(a => a.id === 'Q'), 'aspek belum boleh terhapus');
  assert.deepEqual(user('i2').rubric_scores, { '1': 3, Q: 7 });

  const bad = await call('PUT', '/rubrics', { as: 'hr', body: { aspects: keep, reassign: { Q: 'tidak-ada' } } });
  assert.equal(bad.status, 400);

  const ok = await call('PUT', '/rubrics', { as: 'hr', body: { aspects: keep, reassign: { Q: '1' } } });
  assert.equal(ok.status, 200);
  assert.equal(fake.db.rubric_aspects.some(a => a.id === 'Q'), false);
  assert.equal(fake.db.behavior_reports.find(r => r.id === 'rq').aspect_id, '1');
  assert.deepEqual(user('i2').rubric_scores, { '1': 10 });
});

test('hapus aspek yang tidak dipakai tidak perlu dipindah', async () => {
  fake.db.rubric_aspects.push({ id: 'X', name: 'Kosong', weight: 0 });
  const r = await call('PUT', '/rubrics', { as: 'hr', body: { aspects: [{ id: '1', name: 'Disiplin', weight: 100 }] } });
  assert.equal(r.status, 200);
  assert.equal(fake.db.rubric_aspects.some(a => a.id === 'X'), false);
});
