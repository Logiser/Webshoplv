// netlify/functions/argep-feed.js
// ÁrGép.hu termékfeed — platform-stratégiával szűrve:
// csak azok a termékek mennek ki, ahol (1) az árrés fedezi a kattintási díjat
// (>= 500 Ft), ÉS (2) az Árgépen nincs versenytárs VAGY mi vagyunk az olcsóbbak.
// Az Árgép-versenyárak a kv_store ms_argep_prices kulcsából jönnek (az átvilágítás
// tölti fel; amíg nincs adat, csak az árrés-szabály szűr).
// Formátum: Árukereső-kompatibilis XML (az Árgép ezt a struktúrát fogadja).

const { createClient } = require('@supabase/supabase-js');
const PRODUCTS = require('./products-data.json');
// Árgép-versenyárak build-kori pillanatképe ({ ART: minÁr, 0 = nincs fent az Árgépen })
const ARGEP_STATIC = require('./argep-prices.json');
const { isShopLive } = require('./_shop-live');

const CATEGORY_PATHS = {
  munkaruha: 'Munkavédelem > Munkaruházat',
  munkacipo: 'Munkavédelem > Munkavédelmi cipők',
  bakancs: 'Munkavédelem > Munkavédelmi bakancsok',
  kesztyu: 'Munkavédelem > Munkavédelmi kesztyűk',
  kiegeszitok: 'Munkavédelem > Védőfelszerelések'
};

const MIN_MARGIN_FT = 500; // ennyi árrés kell a kattintási díjak kitermeléséhez

const escapeXml = (s) => String(s || '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

async function loadKv(db, key) {
  const { data } = await db.from('kv_store').select('value').eq('key', key).maybeSingle();
  return (data && data.value) || null;
}

exports.handler = async () => {
  try {
    const baseUrl = process.env.URL || 'https://tridentshop.hu';
    const shippingCost = parseInt(process.env.REACT_APP_SHIPPING_COST) || 1290;
    const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

    let overrides = {};
    let argepPrices = Object.keys(ARGEP_STATIC).length ? ARGEP_STATIC : null;
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      try {
        const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        overrides = (await loadKv(db, 'ms_product_overrides')) || {};
        const kvArgep = await loadKv(db, 'ms_argep_prices'); // kv felülírja a statikusat
        if (kvArgep && Object.keys(kvArgep).length) argepPrices = { ...(argepPrices || {}), ...kvArgep };
      } catch (e) { console.error('kv hiba:', e.message); }
    }

    // Indulás előtt üres feed (lásd _shop-live.js)
    const items = (isShopLive() ? PRODUCTS : []).map(p => {
      const o = overrides[p.id] || {};
      const basePrice = (typeof o.price === 'number' && o.price > 0) ? o.price : p.price;
      const salePrice = (o.sale && o.sale.active && o.sale.price > 0) ? o.sale.price : null;
      return {
        ...p,
        price: salePrice !== null ? Math.min(salePrice, basePrice) : basePrice,
        stock: (typeof o.stock === 'number') ? o.stock : p.stock,
        hidden: o.hidden === true
      };
    }).filter(p => {
      if (p.stock <= 0 || p.hidden) return false;
      // Stratégia 1: árrés-padló a kattintási díjhoz
      if (!(p.partnerPrice > 0) || (p.price - p.partnerPrice) < MIN_MARGIN_FT) return false;
      // Stratégia 2: Árgép-versenypozíció (ha van már átvilágítási adat)
      if (argepPrices) {
        const min = argepPrices[(p.articleNo || '').toUpperCase()];
        if (typeof min === 'number' && min > 0 && p.price >= min) return false; // van olcsóbb versenytárs
      }
      return true;
    }).map(p => {
      const imageUrl = (p.image || '').startsWith('http') ? p.image : `${baseUrl}${p.image}`;
      return `
  <product>
    <identifier>${p.articleNo || p.id}</identifier>
    <manufacturer>${escapeXml(p.brand || 'Portwest')}</manufacturer>
    <name>${escapeXml(p.name)}</name>
    <product_url>${baseUrl}/termek/${p.slug}?utm_source=argep&amp;utm_medium=cpc</product_url>
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
