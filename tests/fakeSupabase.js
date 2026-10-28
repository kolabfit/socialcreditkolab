// In-memory pengganti supabase-js untuk test. Hanya mendukung method yang dipakai routes.
export function createFakeSupabase(tables) {
  const db = structuredClone(tables);

  function from(table) {
    db[table] ??= [];
    let op = 'select';
    let payload;
    let upsertOpts = {};
    let single = false;
    let countOnly = false;
    const filters = [];

    const match = (row) => filters.every(f => f(row));
    const builder = {
      select(cols, opts = {}) { countOnly = !!opts.head; return builder; },
      order() { return builder; },
      eq(col, val) { filters.push(r => r[col] === val); return builder; },
      // ilike tanpa wildcard = sama persis, abaikan huruf besar/kecil
      ilike(col, val) { filters.push(r => String(r[col]).toLowerCase() === String(val).toLowerCase()); return builder; },
      in(col, vals) { filters.push(r => vals.includes(r[col])); return builder; },
      not(col, opr, val) { filters.push(r => !(opr === 'is' && val === null && r[col] == null)); return builder; },
      single() { single = true; return builder; },
      insert(rows) { op = 'insert'; payload = [].concat(rows); return builder; },
      upsert(rows, opts = {}) { op = 'upsert'; payload = [].concat(rows); upsertOpts = opts; return builder; },
      update(values) { op = 'update'; payload = values; return builder; },
      delete() { op = 'delete'; return builder; },
      then(resolve, reject) {
        try { resolve(run()); } catch (e) { reject(e); }
      },
    };

    function run() {
      let data;
      if (op === 'select') {
        data = db[table].filter(match);
        if (countOnly) return { data: null, count: data.length, error: null };
      } else if (op === 'insert') {
        for (const row of payload) {
          if (table === 'users' && db.users.some(u => u.email === row.email)) {
            return { data: null, error: { code: '23505', message: 'duplicate' } };
          }
        }
        db[table].push(...structuredClone(payload));
        data = structuredClone(payload);
      } else if (op === 'upsert') {
        data = [];
        for (const row of payload) {
          const i = db[table].findIndex(r => r.id === row.id);
          if (i === -1) db[table].push({ ...row });
          else if (!upsertOpts.ignoreDuplicates) db[table][i] = { ...db[table][i], ...row };
          data.push(row);
        }
      } else if (op === 'update') {
        data = [];
        db[table].forEach((r, i) => {
          if (match(r)) { db[table][i] = { ...r, ...structuredClone(payload) }; data.push(db[table][i]); }
        });
      } else if (op === 'delete') {
        data = db[table].filter(match);
        db[table] = db[table].filter(r => !match(r));
      }
      data = structuredClone(data);
      if (single) {
        return data.length === 1 ? { data: data[0], error: null } : { data: null, error: { code: 'PGRST116' } };
      }
      return { data, error: null };
    }

    return builder;
  }

  return { from, db };
}
