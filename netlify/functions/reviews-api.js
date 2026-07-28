// netlify/functions/reviews-api.js
// Valódi vásárlói értékelések: beküldés (moderálásra vár) + jóváhagyottak listázása.
// kv kulcs: ms_reviews { productId: [{name, stars, text, ts, approved}] }
// Moderálás: az admin a set_kv művelettel (admin-api) hagyja jóvá (approved: true).

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'POST kell' }) };
  }
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Nincs konfigurálva' }) };
  }
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Hibás kérés' }) };
  }
  const productId = parseInt(body.productId, 10);
  if (!productId) return { statusCode: 400, body: JSON.stringify({ error: 'Hiányzó productId' }) };

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: row } = await db.from('kv_store').select('value').eq('key', 'ms_reviews').maybeSingle();
  const all = (row && row.value) || {};

  try {
    if (body.op === 'list') {
      const approved = (all[productId] || []).filter(r => r.approved === true)
        .map(r => ({ name: r.name, stars: r.stars, text: r.text, ts: r.ts }));
      return { statusCode: 200, body: JSON.stringify({ reviews: approved }) };
    }

    if (body.op === 'submit') {
      const name = String(body.name || '').trim().slice(0, 60);
      const text = String(body.text || '').trim().slice(0, 1500);
      const stars = Math.min(5, Math.max(1, parseInt(body.stars, 10) || 0));
      if (!name || !text || !stars) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Név, csillag és szöveg is kell' }) };
      }
      const list = all[productId] || [];
      if (list.length > 200) return { statusCode: 429, body: JSON.stringify({ error: 'Túl sok értékelés' }) };
      list.push({ name, stars, text, ts: new Date().toISOString(), approved: false });
      all[productId] = list;
      const { error } = await db.from('kv_store').upsert({
        key: 'ms_reviews', value: all, updated_at: new Date().toISOString()
      });
      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify({ ok: true, moderated: true }) };
    }

    return { statusCode: 400, body: JSON.stringify({ error: 'Ismeretlen művelet' }) };
  } catch (e) {
    console.error('reviews-api hiba:', e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
