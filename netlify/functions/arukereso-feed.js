// netlify/functions/arukereso-feed.js
// Árukereső.hu termékfeed (XML) - PPC / ár-összehasonlító integrációhoz
// Endpoint: /arukereso-feed.xml (redirect a netlify.toml-ban)
// DINAMIKUS: kérésenként ráolvassa az adatbázis friss ár/készlet-módosításait
// (a napi Depiend ár-szinkron ide írja a változásokat), így a PPC-oldalak
// mindig az aktuális árat kapják. 1 órás cache.

const { createClient } = require('@supabase/supabase-js');
const PRODUCTS = require('./products-data.json');

const CATEGORY_PATHS = {
  munkaruha: 'Munkavédelem > Munkaruházat',
  munkacipo: 'Munkavédelem > Munkavédelmi cipő',
  bakancs: 'Munkavédelem > Munkavédelmi bakancs',
  kesztyu: 'Munkavédelem > Munkavédelmi kesztyű',
  kiegeszitok: 'Munkavédelem > Védőfelszerelés'
};

const escapeXml = (s) => String(s || '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

// Adatbázis-módosítások (ár, készlet, rejtés) rávetítése az alapkatalógusra
async function applyLiveOverrides(products) {
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return products;
  try {
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data } = await db.from('kv_store').select('value')
      .eq('key', 'ms_product_overrides').maybeSingle();
    const overrides = (data && data.value) || {};
    return products.map(p => {
      const o = overrides[p.id];
      if (!o) return p;
      return {
        ...p,
        price: (typeof o.price === 'number' && o.price > 0) ? o.price : p.price,
        stock: (typeof o.stock === 'number') ? o.stock : p.stock,
        hidden: o.hidden === true
      };
    });
  } catch (e) {
    console.error('Override betöltési hiba (alapkatalógus megy ki):', e.message);
    return products;
  }
}

exports.handler = async () => {
  try {
    const baseUrl = process.env.URL || 'https://munkavedelmiszaki.hu';
    const shippingCost = parseInt(process.env.REACT_APP_SHIPPING_COST) || 1990;

    const products = await applyLiveOverrides(PRODUCTS);

    const items = products.filter(p => p.stock > 0 && !p.hidden).map(p => {
      const imageUrl = (p.image || '').startsWith('http') ? p.image : `${baseUrl}${p.image}`;
      return `
  <product>
    <identifier>${p.articleNo || p.id}</identifier>
    <manufacturer>${escapeXml(p.brand || 'Portwest')}</manufacturer>
    <name>${escapeXml(p.name)}</name>
    <product_url>${baseUrl}/termek/${p.slug}</product_url>
    <price>${p.price}</price>
    <category>${escapeXml(CATEGORY_PATHS[p.categoryId] || 'Munkavédelem')}</category>
    <image_url>${escapeXml(imageUrl)}</image_url>
    <description>${escapeXml(p.description || p.name)}</description>
    <delivery_time>2-3 munkanap</delivery_time>
    <delivery_cost>${shippingCost}</delivery_cost>
  </product>`;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<products>${items}
</products>`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      },
      body: xml
    };
  } catch (e) {
    return { statusCode: 500, body: `Error: ${e.message}` };
  }
};
