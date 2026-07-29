// netlify/functions/wishlist-api.js
// Email-címhez kötött kedvencek mentése/betöltése — így bármely gépről elérhető.
// Kulcs: kv_store 'ms_wishlist_<email>' (az RLS publikus olvasása NEM fedi le,
// csak ezen a function-ön keresztül érhető el).
// Env: SUPABASE_URL, SUPABASE_SERVICE_KEY

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// A listát egy PIN véd: e-mail-cím ismeretében önmagában NEM tölthető be.
// A PIN-t sózott hash-ként tároljuk, sosem nyílt szövegként.
const hashPin = (email, pin) =>
  crypto.createHash('sha256').update(`${email}::${pin}::ms-wishlist-v1`).digest('hex');

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

  const pin = String(body.pin || '').trim();
  if (!/^\d{4,8}$/.test(pin)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'A PIN 4-8 számjegy legyen.' }) };
  }
  const pinHash = hashPin(email, pin);

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { data: existing } = await db.from('kv_store').select('value').eq('key', key).maybeSingle();
    const stored = (existing && existing.value) || null;

    if (body.op === 'save') {
      // Ha már van mentés, csak a helyes PIN-nel írható felül
      if (stored && stored.pinHash && stored.pinHash !== pinHash) {
        return { statusCode: 403, body: JSON.stringify({ error: 'Ehhez az e-mail-címhez más PIN tartozik.' }) };
      }
      const items = Array.isArray(body.items) ? body.items.filter(i => Number.isInteger(i)).slice(0, 200) : [];
      const { error } = await db.from('kv_store').upsert({
        key,
        value: { email, items, pinHash, updated: new Date().toISOString() },
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify({ ok: true, count: items.length }) };
    }

    if (body.op === 'load') {
      if (!stored) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Ehhez az e-mail-címhez nincs mentett lista.' }) };
      }
      // Régi, PIN nélkül mentett listák: az első betöltéskor rögzítjük a PIN-t
      if (stored.pinHash && stored.pinHash !== pinHash) {
        return { statusCode: 403, body: JSON.stringify({ error: 'Hibás PIN.' }) };
      }
      if (!stored.pinHash) {
        await db.from('kv_store').upsert({
          key, value: { ...stored, pinHash, updated: new Date().toISOString() },
          updated_at: new Date().toISOString()
        });
      }
      return { statusCode: 200, body: JSON.stringify({ ok: true, items: stored.items || [] }) };
    }

    return { statusCode: 400, body: JSON.stringify({ error: `Ismeretlen op: ${body.op}` }) };
  } catch (e) {
    console.error('wishlist-api hiba:', e);
    return { statusCode: 500, body: JSON.stringify({ error: 'Adatbázis hiba' }) };
  }
};
