// netlify/functions/arukereso-feed.js
// Árukereső.hu termékfeed (XML) - PPC / ár-összehasonlító integrációhoz
// Endpoint: /arukereso-feed.xml (redirect a netlify.toml-ban)
// Formátum: https://www.arukereso.hu/static/tajekoztato.html szerinti alapmezők

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

exports.handler = async () => {
  try {
    const baseUrl = process.env.URL || 'https://munkavedelmiszaki.hu';
    const shippingCost = parseInt(process.env.REACT_APP_SHIPPING_COST) || 1990;

    const items = PRODUCTS.filter(p => p.stock > 0).map(p => {
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
