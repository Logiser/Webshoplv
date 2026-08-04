// netlify/functions/admin-api.js
// Admin műveletek: jelszó-ellenőrzés után service_role kulccsal ír/olvas.
// Az admin jelszó így NEM kerül bele a kliens JS bundle-be.
// Env: SUPABASE_URL, SUPABASE_SERVICE_KEY, ADMIN_PASSWORD, ADMIN_PASSWORD_OFFICE (opcionális)
//
// Két szerepkör: 'admin' (teljes hozzáférés) és 'office' (iroda/ügyfélszolgálat —
// mindent lát/csinál, ami a napi működéshez kell, de nem módosíthat árat/árrést,
// és a kliens UI nem mutat neki bevétel-adatot). Az árvédelem itt, szerver-oldalon
// is érvényesül (ld. assertNoPriceChange), nem csak a felületen van elrejtve.

const { createClient } = require('@supabase/supabase-js');

// Csak ezeket a kulcsokat írhatja az admin
const WRITABLE_KEYS = [
  'ms_product_overrides',
  'ms_custom_products',
  'ms_stock_history',
  'ms_blog_posts',
  'ms_argep_prices',
  'ms_reviews',
  'ms_newsletter',
  'ms_abandoned_carts',
  'ms_contact_messages',
  'ms_supplier_notifications',
  'ms_coupons',
  'ms_pricing',
  'ms_homepage_content'
];

// Ezekhez a kulcsokhoz az 'office' szerepkör egyáltalán nem írhat: globális árrés/
// árazás (ms_pricing), új termék felvétele (ms_custom_products), kuponok (árazási/
// kedvezmény-döntés), valamint a webshop SZERKEZETÉT érintő tartalom (főoldal
// szövegek/banner-sorrend, blogcikkek) — ezek a felhasználói felületen sincsenek
// office-nak elérhető fülön, ez a szerver-oldali lezárás direkt API-hívás ellen véd.
const ADMIN_ONLY_KEYS = ['ms_pricing', 'ms_custom_products', 'ms_coupons', 'ms_homepage_content', 'ms_blog_posts'];

// ms_product_overrides-nál csak az ár-jellegű mezők védettek office szerepkörnél —
// készlet, láthatóság stb. továbbra is szabadon szerkeszthető.
const PRICE_FIELDS = ['price', 'sale', 'priceManual'];

const hasPriceFieldChange = (oldOverrides, newOverrides) => {
  const oldObj = oldOverrides || {};
  const newObj = newOverrides || {};
  return Object.keys(newObj).some(id => {
    const oldP = oldObj[id] || {};
    const newP = newObj[id] || {};
    return PRICE_FIELDS.some(f => JSON.stringify(oldP[f]) !== JSON.stringify(newP[f]));
  });
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_KEY, ADMIN_PASSWORD, ADMIN_PASSWORD_OFFICE } = process.env;
  if (!ADMIN_PASSWORD) {
    return { statusCode: 500, body: JSON.stringify({ error: 'ADMIN_PASSWORD nincs beállítva' }) };
  }

  const given = event.headers['x-admin-password'] || '';
  let role = null;
  if (given === ADMIN_PASSWORD) role = 'admin';
  else if (ADMIN_PASSWORD_OFFICE && given === ADMIN_PASSWORD_OFFICE) role = 'office';
  if (!role) {
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
    return { statusCode: 200, body: JSON.stringify({ ok: true, role }) };
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
        if (role === 'office') {
          if (ADMIN_ONLY_KEYS.includes(body.key)) {
            return { statusCode: 403, body: JSON.stringify({ error: 'Ehhez a művelethez admin jogosultság szükséges' }) };
          }
          if (body.key === 'ms_product_overrides') {
            const { data: existing, error: readErr } = await db.from('kv_store').select('value').eq('key', body.key).single();
            if (readErr && readErr.code !== 'PGRST116') throw readErr;
            if (hasPriceFieldChange(existing && existing.value, body.value)) {
              return { statusCode: 403, body: JSON.stringify({ error: 'Iroda szerepkörrel nem módosítható az ár' }) };
            }
          }
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

      case 'ppc_stats': {
        // Napi PPC-kötegek beolvasása az elmúlt N napra (alap: 30)
        const days = Math.min(365, Math.max(1, parseInt(body.days) || 30));
        const keys = [];
        for (let i = 0; i < days; i++) {
          const d = new Date(Date.now() - i * 86400000);
          keys.push(`ms_ppc_${d.toISOString().slice(0, 10)}`);
        }
        const { data, error } = await db.from('kv_store').select('key, value').in('key', keys);
        if (error) throw error;
        const daily = {};
        (data || []).forEach(r => { daily[r.key.replace('ms_ppc_', '')] = r.value; });
        return { statusCode: 200, body: JSON.stringify({ daily }) };
      }

      default:
        return { statusCode: 400, body: JSON.stringify({ error: `Ismeretlen op: ${body.op}` }) };
    }
  } catch (e) {
    console.error('admin-api hiba:', e);
    return { statusCode: 500, body: JSON.stringify({ error: 'Adatbázis hiba' }) };
  }
};
