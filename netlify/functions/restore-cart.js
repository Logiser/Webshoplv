// netlify/functions/restore-cart.js
// Kosár visszaállítása az emlékeztető e-mail linkjéből.
// A link egy base64url-kódolt e-mail-címet tartalmaz; csak az ahhoz tartozó,
// korábban MENTETT kosarat adjuk vissza (semmi mást), és csak akkor, ha az
// adott e-mailhez tényleg van elmentett kosár.
// Megjegyzés: ez nem hitelesítés — a kosár tartalma nem érzékeny adat, és a
// felhasználó a saját postafiókjából érkezik. Személyes adatot NEM adunk vissza.

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { statusCode: 200, body: JSON.stringify({ cart: [] }) };
  }

  const token = (event.queryStringParameters || {}).t || '';
  if (!token) return { statusCode: 400, body: JSON.stringify({ error: 'Hiányzó azonosító' }) };

  let email;
  try {
    email = Buffer.from(token, 'base64url').toString('utf8').trim().toLowerCase();
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Érvénytelen azonosító' }) };
  }
  if (!email || !email.includes('@')) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Érvénytelen azonosító' }) };
  }

  try {
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data } = await db.from('kv_store').select('value')
      .eq('key', 'ms_abandoned_carts').maybeSingle();
    const carts = (data && data.value) || {};
    const entry = carts[email];
    if (!entry || !Array.isArray(entry.cart)) {
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cart: [] }) };
    }
    // Csak a kosártételek mennek vissza — se e-mail, se cím, se egyéb személyes adat
    const cart = entry.cart.map(i => ({
      id: i.id, name: i.name, price: i.price, quantity: i.quantity,
      size: i.size || null, color: i.color || null, image: i.image || null, slug: i.slug || null
    }));
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart })
    };
  } catch (e) {
    console.error('restore-cart hiba:', e);
    return { statusCode: 200, body: JSON.stringify({ cart: [] }) };
  }
};
