// Netlify Function: Google Shopping XML feed generálása
// Endpoint: /.netlify/functions/google-shopping-feed
// Vagy redirect-tel: /google-shopping-feed.xml

// Megj.: a termékadatok build-kor generált JSON pillanatképből jönnek
// (scripts/gen-feed-data.mjs, npm prebuild) — a runtime nem tud ESM-et betölteni.
// DINAMIKUS: kérésenként ráolvassa az adatbázis friss ár/készlet-módosításait,
// így a napi Depiend ár-szinkron eredménye azonnal megjelenik a feedben.

const { createClient } = require('@supabase/supabase-js');
const PRODUCTS = require('./products-data.json');

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
      // Akciós ár: a feedben is az effektív (akciós) ár megy ki
      const basePrice = (typeof o.price === 'number' && o.price > 0) ? o.price : p.price;
      const salePrice = (o.sale && o.sale.active && o.sale.price > 0) ? o.sale.price : null;
      return {
        ...p,
        price: salePrice !== null ? Math.min(salePrice, basePrice) : basePrice,
        stock: (typeof o.stock === 'number') ? o.stock : p.stock,
        hidden: o.hidden === true
      };
    });
  } catch (e) {
    console.error('Override betöltési hiba (alapkatalógus megy ki):', e.message);
    return products;
  }
}

const slugify = (text) => {
  return (text || '').toLowerCase()
    .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
    .replace(/ó/g, 'o').replace(/ö/g, 'o').replace(/ő/g, 'o')
    .replace(/ú/g, 'u').replace(/ü/g, 'u').replace(/ű/g, 'u')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-').replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

exports.handler = async (event, context) => {
  try {
    const baseUrl = process.env.URL || 'https://tridentshop.hu';
    const products = await applyLiveOverrides(PRODUCTS || []);

    const items = products.filter(p => p.stock > 0 && !p.hidden).map(p => {
      const slug = p.slug || slugify(p.name);
      // Relatív képútvonal (pl. /images/products/...) abszolúttá alakítása
      const imageUrl = (p.image || '').startsWith('http') ? p.image : `${baseUrl}${p.image}`;
      return `
    <item>
      <g:id>${p.id}</g:id>
      <g:title><![CDATA[${p.name}]]></g:title>
      <g:description><![CDATA[${p.description || p.name}]]></g:description>
      <g:link>${baseUrl}/termek/${slug}?utm_source=google&amp;utm_medium=cpc</g:link>
      <g:image_link>${imageUrl}</g:image_link>
      <g:availability>${p.stock > 0 ? 'in stock' : 'out of stock'}</g:availability>
      <g:price>${p.price}.00 HUF</g:price>
      <g:brand><![CDATA[${p.brand || 'MunkavédelmiShop'}]]></g:brand>
      <g:condition>new</g:condition>
      <g:product_type><![CDATA[${p.categoryId}]]></g:product_type>
      <g:google_product_category>Apparel &amp; Accessories</g:google_product_category>
    </item>`;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>MunkavédelmiShop - Google Shopping Feed</title>
    <link>${baseUrl}</link>
    <description>Munkavédelmi termékek webshopja - Trident Shield Group Kft.</description>
    ${items}
  </channel>
</rss>`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      },
      body: xml
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: `Error: ${e.message}`
    };
  }
};
