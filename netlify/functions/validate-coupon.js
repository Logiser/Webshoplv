// netlify/functions/validate-coupon.js
// Kupon ellenőrzés szerver-oldalon: a kuponkódok nem publikusak,
// a vevő csak egy konkrét kódot tud ellenőrizni.
// Env: SUPABASE_URL, SUPABASE_SERVICE_KEY

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ valid: false, error: 'Supabase nincs konfigurálva' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ valid: false, error: 'Hibás JSON' }) };
  }

  const code = (body.code || '').trim().toUpperCase();
  const total = Math.max(0, parseInt(body.total) || 0);
  if (!code) {
    return { statusCode: 200, body: JSON.stringify({ valid: false, error: 'Hiányzó kuponkód' }) };
  }

  try {
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data, error } = await db.from('kv_store').select('value').eq('key', 'ms_coupons').maybeSingle();
    if (error) throw error;
    const coupons = (data && data.value) || [];

    // Ugyanaz a logika, mint a kliens evaluateCoupon-ja
    const c = coupons.find(x => x.code === code);
    if (!c) return { statusCode: 200, body: JSON.stringify({ valid: false, error: 'Ismeretlen kuponkód' }) };
    if (c.active === false) return { statusCode: 200, body: JSON.stringify({ valid: false, error: 'A kupon már nem aktív' }) };
    if (c.expiry && c.expiry < new Date().toISOString().split('T')[0]) {
      return { statusCode: 200, body: JSON.stringify({ valid: false, error: 'A kupon lejárt' }) };
    }
    if (c.minOrder && total < c.minOrder) {
      return { statusCode: 200, body: JSON.stringify({ valid: false, error: `A kupon ${c.minOrder.toLocaleString('hu-HU')} Ft feletti rendelésre érvényes` }) };
    }
    const discount = c.type === 'percent'
      ? Math.round(total * c.value / 100)
      : Math.min(Math.round(c.value), total);

    return { statusCode: 200, body: JSON.stringify({ valid: true, code: c.code, discount, type: c.type, value: c.value }) };
  } catch (e) {
    console.error('validate-coupon hiba:', e);
    return { statusCode: 500, body: JSON.stringify({ valid: false, error: 'Kupon-ellenőrzési hiba' }) };
  }
};
