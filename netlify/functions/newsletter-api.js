// netlify/functions/newsletter-api.js
// Hírlevél-feliratkozás + elhagyott kosár rögzítés (csak kifejezett hozzájárulással).
// Publikus végpont — csak a szűken definiált műveleteket engedi, email-validálással.
// kv kulcsok: ms_newsletter { email: {ts, source} },
//             ms_abandoned_carts { email: {cart, ts, consent, remindedAt?} }

const { createClient } = require('@supabase/supabase-js');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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
  const email = String(body.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 120) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Érvénytelen email-cím' }) };
  }

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const now = new Date().toISOString();

  const loadKv = async (key) => {
    const { data } = await db.from('kv_store').select('value').eq('key', key).maybeSingle();
    return (data && data.value) || {};
  };
  const saveKv = async (key, value) => {
    const { error } = await db.from('kv_store').upsert({ key, value, updated_at: now });
    if (error) throw error;
  };

  try {
    if (body.op === 'subscribe') {
      const list = await loadKv('ms_newsletter');
      if (Object.keys(list).length > 20000) throw new Error('Lista megtelt');
      if (!list[email]) {
        list[email] = { ts: now, source: String(body.source || 'web').slice(0, 30) };
        await saveKv('ms_newsletter', list);
      }
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    if (body.op === 'abandon') {
      // Elhagyott kosár csak akkor rögzíthető, ha a vevő hozzájárult az értesítéshez
      if (body.consent !== true) {
        return { statusCode: 200, body: JSON.stringify({ ok: true, skipped: 'nincs hozzájárulás' }) };
      }
      const cart = Array.isArray(body.cart) ? body.cart.slice(0, 30).map(i => ({
        name: String(i.name || '').slice(0, 120),
        price: parseInt(i.price, 10) || 0,
        quantity: parseInt(i.quantity, 10) || 1
      })) : [];
      if (cart.length === 0) return { statusCode: 400, body: JSON.stringify({ error: 'Üres kosár' }) };
      const carts = await loadKv('ms_abandoned_carts');
      if (Object.keys(carts).length > 5000) throw new Error('Tároló megtelt');
      carts[email] = { cart, ts: now, consent: true };
      await saveKv('ms_abandoned_carts', carts);
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    if (body.op === 'abandon_clear') {
      const carts = await loadKv('ms_abandoned_carts');
      if (carts[email]) {
        delete carts[email];
        await saveKv('ms_abandoned_carts', carts);
      }
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 400, body: JSON.stringify({ error: 'Ismeretlen művelet' }) };
  } catch (e) {
    console.error('newsletter-api hiba:', e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
