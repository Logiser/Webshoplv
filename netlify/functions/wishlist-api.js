// netlify/functions/wishlist-api.js
// Email-címhez kötött kedvencek mentése/betöltése — így bármely gépről elérhető.
// Kulcs: kv_store 'ms_wishlist_<email>' (az RLS publikus olvasása NEM fedi le,
// csak ezen a function-ön keresztül érhető el).
// Env: SUPABASE_URL, SUPABASE_SERVICE_KEY

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Supabase nincs konfigurálva' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Hibás JSON' }) };
  }

  const email = (body.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Érvénytelen email cím' }) };
  }
  const key = `ms_wishlist_${email}`;

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    if (body.op === 'save') {
      const items = Array.isArray(body.items) ? body.items.filter(i => Number.isInteger(i)).slice(0, 200) : [];
      const { error } = await db.from('kv_store').upsert({
        key,
        value: { email, items, updated: new Date().toISOString() },
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify({ ok: true, count: items.length }) };
    }

    if (body.op === 'load') {
      const { data, error } = await db.from('kv_store').select('value').eq('key', key).maybeSingle();
      if (error) throw error;
      const items = (data && data.value && data.value.items) || [];
      return { statusCode: 200, body: JSON.stringify({ ok: true, items }) };
    }

    return { statusCode: 400, body: JSON.stringify({ error: `Ismeretlen op: ${body.op}` }) };
  } catch (e) {
    console.error('wishlist-api hiba:', e);
    return { statusCode: 500, body: JSON.stringify({ error: 'Adatbázis hiba' }) };
  }
};
