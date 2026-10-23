import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeSupabase } from './fakeSupabase.js';

process.env.SUPABASE_URL = 'http://fake';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake';
process.argv.push('--force');

test('seed --force tidak menimpa score, rubrik, maupun startup yang sudah ada', async () => {
  const fake = createFakeSupabase({
    users: [{ id: 'intern_0', name: 'Lama', email: 'muhammad0@gmail.com', role: 'intern', score: 77, rubric_scores: { '1': 90 }, password_hash: 'x' }],
    rubric_aspects: [{ id: '1', name: 'Disiplin', weight: 55 }],
    startups: [{ id: 's1', name: 'Kroombox', description: 'lama' }],
  });
  mock.module(new URL('../server/config/supabase.js', import.meta.url).href, {
    namedExports: { supabase: fake },
  });

  await import('../server/seed.js');
  // seed() jalan async saat import; tunggu sampai user baru masuk
  for (let i = 0; i < 100 && fake.db.users.length < 2; i++) await new Promise(r => setTimeout(r, 50));
  await new Promise(r => setTimeout(r, 50));

  assert.ok(fake.db.users.length > 1, 'seed harus menambah user baru');
  const existing = fake.db.users.find(u => u.id === 'intern_0');
  assert.equal(existing.score, 77);
  assert.deepEqual(existing.rubric_scores, { '1': 90 });
  assert.equal(existing.name, 'Lama');
  assert.equal(fake.db.rubric_aspects.find(r => r.id === '1').weight, 55);
  assert.equal(fake.db.startups.find(s => s.id === 's1').description, 'lama');
});
