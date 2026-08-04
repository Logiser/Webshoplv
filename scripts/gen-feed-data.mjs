// Build előtt fut (npm prebuild): a products.generated.json-ból pillanatképet
// készít a Netlify Functions számára + sitemap.xml-t generál.
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const _root = join(dirname(fileURLToPath(import.meta.url)), '..');
const products = JSON.parse(readFileSync(join(_root, 'src', 'data', 'products.generated.json'), 'utf8'));

const slugify = (text) => (text || '')
  .toLowerCase()
  .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
  .replace(/ó/g, 'o').replace(/ö/g, 'o').replace(/ő/g, 'o')
  .replace(/ú/g, 'u').replace(/ü/g, 'u').replace(/ű/g, 'u')
  .replace(/[^a-z0-9 -]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

const snapshot = products.map(p => ({
  id: p.id,
  articleNo: p.articleNo || '',
  name: p.name,
  slug: p.slug || slugify(p.name),
  description: p.description || '',
  price: p.price,
  partnerPrice: p.partnerPrice,
  priceSource: p.priceSource || 'keplet',
  image: p.image,
  stock: p.stock,
  brand: p.brand || '',
  categoryId: p.categoryId,
  depiendUrl: p.depiendUrl || ''
}));

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
writeFileSync(join(root, 'netlify', 'functions', 'products-data.json'), JSON.stringify(snapshot, null, 2));
console.log(`✅ products-data.json generálva (${snapshot.length} termék)`);

// ============ sitemap.xml generálás ============
const SITE = 'https://tridentshop.hu';
const today = new Date().toISOString().split('T')[0];
const staticUrls = [
  { loc: '/', freq: 'daily', pri: '1.0' },
  { loc: '/about', freq: 'monthly', pri: '0.7' },
  { loc: '/shipping', freq: 'monthly', pri: '0.6' },
  { loc: '/contact', freq: 'monthly', pri: '0.6' },
  { loc: '/blog', freq: 'weekly', pri: '0.8' },
  { loc: '/gyik', freq: 'monthly', pri: '0.7' },
  { loc: '/terms', freq: 'yearly', pri: '0.3' },
  { loc: '/privacy', freq: 'yearly', pri: '0.3' },
  { loc: '/impressum', freq: 'yearly', pri: '0.3' }
];
// A blog-slugeket a storage.js-ből olvassuk ki szövegesen (nem importáljuk a
// modult, mert az böngésző-API-kat — localStorage stb. — használ, ami Node
// build-scriptben elhasalna). Ez korábban kézzel karbantartott, statikus lista
// volt: minden új blogcikknél el kellett felejteni frissíteni, és tényleg el is
// felejtettük — 6 cikk (EN ISO 21420, S1/SRC cipő, vendéglátás, építőipar, FFP
// maszk, hallásvédelem) így sosem került be a sitemap.xml-be. A regex-alapú
// kiolvasás strukturálisan kizárja, hogy ez újra megtörténjen.
const storageSrc = readFileSync(join(_root, 'src', 'data', 'storage.js'), 'utf8');
const blogBlockMatch = storageSrc.match(/const defaultBlogPosts = \[([\s\S]*?)\n\];/);
if (!blogBlockMatch) throw new Error('defaultBlogPosts tömb nem található a storage.js-ben — sitemap blog-URL-ek nélkül maradnának');
const blogSlugs = [...blogBlockMatch[1].matchAll(/slug: '([^']+)'/g)].map(m => m[1]);
if (blogSlugs.length === 0) throw new Error('Nulla blog-slug lett kiolvasva a storage.js-ből — ellenőrizd a regex mintát');
const urlXml = (loc, freq, pri, lastmod) =>
  `  <url>\n    <loc>${SITE}${loc}</loc>\n${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ''}    <changefreq>${freq}</changefreq>\n    <priority>${pri}</priority>\n  </url>`;
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[
  ...staticUrls.map(u => urlXml(u.loc, u.freq, u.pri, u.loc === '/' ? today : null)),
  ...blogSlugs.map(s => urlXml(`/blog/${s}`, 'monthly', '0.7', null)),
  ...snapshot.map(p => urlXml(`/termek/${p.slug}`, 'weekly', '0.8', today))
].join('\n')}\n</urlset>\n`;
writeFileSync(join(root, 'public', 'sitemap.xml'), sitemap);
console.log(`✅ sitemap.xml generálva (${staticUrls.length + blogSlugs.length + snapshot.length} URL)`);

// ============ llms-full.txt: teljes katalógus AI-keresőknek (GEO) ============
const catNames = {
  munkaruha: 'Munkaruházat', munkacipo: 'Munkavédelmi cipők',
  bakancs: 'Bakancsok és csizmák', kesztyu: 'Munkavédelmi kesztyűk',
  kiegeszitok: 'Kiegészítők és védőfelszerelés'
};
const byCat = {};
snapshot.forEach(p => { (byCat[p.categoryId] = byCat[p.categoryId] || []).push(p); });
const llmsFull = `# TridentShop - Teljes termékkatalógus
# Frissítve: ${today} | Árak bruttó Ft-ban | Minden termék eredeti Portwest, CE minősítéssel
# Üzemeltető: Trident Shield Group Kft., 4030 Debrecen, Keleti Ipartelep utca 4.
# Rendelés: ${SITE} | +36 30 272 2571 | iroda@tuz-munkavedelmiszaki.com
# Szállítás: 2-3 munkanap, 1290 Ft (30 000 Ft felett ingyenes)

${Object.entries(byCat).map(([cat, items]) => `## ${catNames[cat] || cat}

${items.map(p => `- ${p.name} (${p.articleNo}) — ${p.price.toLocaleString('hu-HU')} Ft — ${SITE}/termek/${p.slug}`).join('\n')}`).join('\n\n')}
`;
writeFileSync(join(root, 'public', 'llms-full.txt'), llmsFull);
console.log(`✅ llms-full.txt generálva (${snapshot.length} termék)`);
