// Netlify Function: Google Shopping XML feed generálása
// Endpoint: /.netlify/functions/google-shopping-feed
// Vagy redirect-tel: /google-shopping-feed.xml

// Megj.: a termékadatok build-kor generált JSON pillanatképből jönnek
// (scripts/gen-feed-data.mjs, npm prebuild) — a runtime nem tud ESM-et betölteni.

const PRODUCTS = require('./products-data.json');

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
    const baseUrl = process.env.URL || 'https://munkavedelmiszaki.hu';
    const products = PRODUCTS || [];

    const items = products.filter(p => p.stock > 0).map(p => {
      const slug = p.slug || slugify(p.name);
      // Relatív képútvonal (pl. /images/products/...) abszolúttá alakítása
      const imageUrl = (p.image || '').startsWith('http') ? p.image : `${baseUrl}${p.image}`;
      return `
    <item>
      <g:id>${p.id}</g:id>
      <g:title><![CDATA[${p.name}]]></g:title>
      <g:description><![CDATA[${p.description || p.name}]]></g:description>
      <g:link>${baseUrl}/termek/${slug}</g:link>
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
