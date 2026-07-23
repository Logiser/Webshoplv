// netlify/functions/admin-api.js
// Admin műveletek: jelszó-ellenőrzés után service_role kulccsal ír/olvas.
// Az admin jelszó így NEM kerül bele a kliens JS bundle-be.
// Env: SUPABASE_URL, SUPABASE_SERVICE_KEY, ADMIN_PASSWORD

const { createClient } = require('@supabase/supabase-js');

// Csak ezeket a kulcsokat írhatja az admin
const WRITABLE_KEYS = [
  'ms_product_overrides',
  'ms_custom_products',
  'ms_stock_history',
  'ms_blog_posts',
  'ms_supplier_notifications'
];

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_KEY, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_PASSWORD) {
    return { statusCode: 500, body: JSON.stringify({ error: 'ADMIN_PASSWORD nincs beállítva' }) };
  }

  const given = event.headers['x-admin-password'] || '';
  if (given !== ADMIN_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Hibás jelszó' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Hibás JSON' }) };
  }

  // Bejelentkezés-ellenőrzés DB nélkül is működik
  if (body.op === 'login') {
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Supabase nincs konfigurálva' }) };
  }
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    switch (body.op) {
      case 'get_all': {
        const [kvRes, ordersRes] = await Promise.all([
          db.from('kv_store').select('key, value'),
          db.from('orders').select('data').order('created_at', { ascending: false })
        ]);
        if (kvRes.error) throw kvRes.error;
        if (ordersRes.error) throw ordersRes.error;
        const kv = {};
        (kvRes.data || []).forEach(r => { kv[r.key] = r.value; });
        const orders = (ordersRes.data || []).map(r => r.data);
        return { statusCode: 200, body: JSON.stringify({ kv, orders }) };
      }

      case 'set_kv': {
        if (!WRITABLE_KEYS.includes(body.key)) {
          return { statusCode: 400, body: JSON.stringify({ error: `Nem írható kulcs: ${body.key}` }) };
        }
        const { error } = await db.from('kv_store').upsert({
          key: body.key,
          value: body.value,
          updated_at: new Date().toISOString()
        });
        if (error) throw error;
        return { statusCode: 200, body: JSON.stringify({ ok: true }) };
      }

      case 'update_order': {
        if (!body.id || !body.data) {
          return { statusCode: 400, body: JSON.stringify({ error: 'Hiányzó id vagy data' }) };
        }
        const { error } = await db.from('orders').update({ data: body.data }).eq('id', body.id);
        if (error) throw error;
        return { statusCode: 200, body: JSON.stringify({ ok: true }) };
      }

      default:
        return { statusCode: 400, body: JSON.stringify({ error: `Ismeretlen op: ${body.op}` }) };
    }
  } catch (e) {
    console.error('admin-api hiba:', e);
    return { statusCode: 500, body: JSON.stringify({ error: 'Adatbázis hiba' }) };
  }
};
