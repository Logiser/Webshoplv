// netlify/functions/track-visit.js
// Termék-megnyitás követés forrás szerint (PPC statisztikához).
// Napi kötegek a kv_store-ban: ms_ppc_YYYY-MM-DD ->
//   { total, bySource: {source: n}, items: { "<productId>|<source>": n } }
// A kulcsok NEM publikusak (RLS), csak ez a function és az admin-api éri el.
// Env: SUPABASE_URL, SUPABASE_SERVICE_KEY

const { createClient } = require('@supabase/supabase-js');

const VALID_SOURCES = ['arukereso', 'google', 'facebook', 'organikus', 'direkt', 'egyeb'];

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { statusCode: 200, body: JSON.stringify({ ok: false }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Hibás JSON' }) };
  }

  const productId = parseInt(body.productId);
  if (!Number.isInteger(productId)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Hiányzó productId' }) };
  }
  const source = VALID_SOURCES.includes(body.source) ? body.source : 'egyeb';
  const medium = String(body.medium || '').slice(0, 30);

  try {
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const key = `ms_ppc_${new Date().toISOString().slice(0, 10)}`;
    const { data } = await db.from('kv_store').select('value').eq('key', key).maybeSingle();
    const doc = (data && data.value) || { total: 0, bySource: {}, items: {} };

    doc.total = (doc.total || 0) + 1;
    doc.bySource[source] = (doc.bySource[source] || 0) + 1;
    const itemKey = `${productId}|${source}`;
    doc.items[itemKey] = (doc.items[itemKey] || 0) + 1;
    if (medium === 'modal') {
      doc.modalTotal = (doc.modalTotal || 0) + 1;
    }

    await db.from('kv_store').upsert({ key, value: doc, updated_at: new Date().toISOString() });
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error('track-visit hiba:', e.message);
    return { statusCode: 200, body: JSON.stringify({ ok: false }) };
  }
};
