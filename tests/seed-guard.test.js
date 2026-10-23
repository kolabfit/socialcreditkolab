import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeSupabase } from './fakeSupabase.js';

process.env.SUPABASE_URL = 'http://fake';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake';

test('seed tanpa --force menolak jalan di DB yang sudah berisi user', async () => {
  const fake = createFakeSupabase({
    users: [{ id: 'intern_0', name: 'Lama', email: 'muhammad0@gmail.com', role: 'intern', score: 77 }],
    rubric_aspects: [{ id: '1', name: 'Disiplin', weight: 100 }],
    startups: [],
  });
  mock.module(new URL('../server/config/supabase.js', import.meta.url).href, {
    namedExports: { supabase: fake },
  });

  await import('../server/seed.js');
  await new Promise(r => setTimeout(r, 300));

  assert.equal(process.exitCode, 1);
  process.exitCode = 0;
  assert.equal(fake.db.users.length, 1);
  assert.equal(fake.db.startups.length, 0);
  assert.equal(fake.db.rubric_aspects.length, 1);
});
