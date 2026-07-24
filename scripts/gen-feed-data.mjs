// Build előtt fut (npm prebuild): a productData.js-ből JSON pillanatképet
// készít a Netlify Functions számára (a runtime nem tud ESM-et require-olni).
import { products } from '../src/data/productData.js';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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
  image: p.image,
  stock: p.stock,
  brand: p.brand || '',
  categoryId: p.categoryId
}));

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'netlify', 'functions', 'products-data.json');
writeFileSync(out, JSON.stringify(snapshot, null, 2));
console.log(`✅ products-data.json generálva (${snapshot.length} termék)`);
