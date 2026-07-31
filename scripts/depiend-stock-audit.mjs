// scripts/depiend-stock-audit.mjs
// A katalógusban tárolt raktárkészlet-adatok (variants[].stock / variants[].sizeStock)
// eddig egy egyszeri katalógus-generáláskori BECSLÉS voltak, sosem lettek valódi
// Depiend-készlettel összevetve. A Depiend termékoldal viszont — bejelentkezés
// nélkül is — pontosan feltünteti méretenként/színenként, hogy MENNYI van
// Magyarországi raktáron (a lengyel raktár nem számít elérhetőnek nálunk):
//   {depiendUrl}/{színkód kisbetűvel}?detailedview=1
// Ez a script ezt kérdezi le minden termék minden színéhez, és a Magyarországi
// (HU-zászlós) mennyiséggel felülírja a variants[].stock / sizeStock mezőket,
// majd újraszámolja a termékszintű p.stock összeget (= színenkénti stock összege).
//
// Futtatás: node scripts/depiend-stock-audit.mjs
// (Csak olvassa a Depiend nyilvános oldalait, nem igényel bejelentkezést.)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, '..', 'src', 'data', 'products.generated.json');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0';
const CONCURRENCY = 8;
const ROW_RE = /data-id="(\d+)" class="js-detailed-product-card product-details-table__row[^"]*" data-product-id="(\d+)" data-color="([^"]+)" data-size="([^"]*)"/g;

const normSize = (s) => (s || '').toLowerCase().replace(/\s+/g, '').replace(/[éÉ]/g, 'e').replace(/[áÁ]/g, 'a').replace(/[íÍ]/g, 'i').replace(/[óÓöŐőÖ]/g, 'o').replace(/[úÚüŰűÜ]/g, 'u');

async function fetchHtml(url, attempt = 1) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (e) {
    if (attempt < 3) {
      await new Promise(r => setTimeout(r, 500 * attempt));
      return fetchHtml(url, attempt + 1);
    }
    throw e;
  }
}

// Egy szín (variáns) Magyarországi készletét adja vissza:
//   { total: <összes HU db a színben>, bySize: { méretcímke: HU db } | null (ha nincs valódi méret) }
async function fetchColorStock(depiendUrl, colorCode) {
  const url = `${depiendUrl}/${colorCode.toLowerCase()}?detailedview=1`;
  const html = await fetchHtml(url);
  const rows = [...html.matchAll(ROW_RE)];
  if (rows.length === 0) {
    // Nincs részletes tábla — próbáljuk az egyszerű nézet aggregát számát (ritka eset)
    const m = html.match(/Magyarországi raktáron:<\/span>\s*<strong>\s*(\d+)\s*db/);
    if (m) return { total: parseInt(m[1], 10), bySize: null };
    return null;
  }
  const bySize = {};
  let total = 0;
  for (let i = 0; i < rows.length; i++) {
    const start = rows[i].index;
    const end = i + 1 < rows.length ? rows[i + 1].index : html.length;
    const block = html.slice(start, end);
    const hu = block.match(/flag_hu\.webp"[^>]*>\s*([\d]+)\s*db/);
    const qty = hu ? parseInt(hu[1], 10) : 0;
    const sizeLabel = rows[i][4] || '-';
    bySize[sizeLabel] = (bySize[sizeLabel] || 0) + qty;
    total += qty;
  }
  return { total, bySize };
}

async function runPool(items, worker, concurrency) {
  let idx = 0;
  const results = new Array(items.length);
  async function next() {
    while (idx < items.length) {
      const i = idx++;
      try {
        results[i] = await worker(items[i], i);
      } catch (e) {
        results[i] = { error: e.message };
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, next));
  return results;
}

async function main() {
  const products = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const DRY_RUN = process.env.DRY_RUN === '1';
  const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : null;

  const jobs = [];
  for (const p of products) {
    if (!p.depiendUrl) continue;
    for (const v of (p.variants || [])) {
      jobs.push({ product: p, variant: v });
      if (LIMIT && jobs.length >= LIMIT) break;
    }
    if (LIMIT && jobs.length >= LIMIT) break;
  }
  console.log(`Összesen ${products.length} termék, ${jobs.length} szín-variáns lekérdezendő. ${DRY_RUN ? '(DRY RUN — nem ír fájlt)' : ''}`);

  const unmatchedSizes = [];
  const errors = [];
  let changedVariants = 0;
  let done = 0;

  await runPool(jobs, async ({ product: p, variant: v }) => {
    const stock = await fetchColorStock(p.depiendUrl, v.code).catch(e => {
      errors.push({ id: p.id, name: p.name, color: v.code, error: e.message });
      return null;
    });
    done++;
    if (done % 200 === 0) console.log(`… ${done}/${jobs.length}`);
    if (!stock) return;

    const oldStock = v.stock;
    v.stock = stock.total;

    if (stock.bySize && p.sizes && p.sizes.length > 0 && !(p.sizes.length === 1 && p.sizes[0] === '-')) {
      const sizeStock = {};
      for (const ourSize of p.sizes) {
        const match = Object.keys(stock.bySize).find(depSize => normSize(depSize) === normSize(ourSize));
        sizeStock[ourSize] = match ? stock.bySize[match] : 0;
      }
      // Depiend-méretek, amik nem feleltethetők meg egyik ismert méretünknek sem — jelezzük
      for (const depSize of Object.keys(stock.bySize)) {
        if (!p.sizes.some(s => normSize(s) === normSize(depSize))) {
          unmatchedSizes.push({ id: p.id, name: p.name, depSize, ourSizes: p.sizes });
        }
      }
      v.sizeStock = sizeStock;
    }

    if (oldStock !== v.stock) changedVariants++;
  }, CONCURRENCY);

  // Termékszintű összkészlet újraszámolása (színenkénti stock összege)
  for (const p of products) {
    if (!(p.variants || []).length) continue;
    p.stock = p.variants.reduce((s, v) => s + (v.stock || 0), 0);
  }

  if (!DRY_RUN) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(products, null, 2) + '\n');
  }

  console.log(`\nKész. ${changedVariants} szín-variáns készlete változott a valós Magyarországi adatra.`);
  console.log(`Hiba: ${errors.length} lekérdezésnél.`);
  if (errors.length) fs.writeFileSync(path.join(__dirname, 'depiend-stock-audit-errors.json'), JSON.stringify(errors, null, 2));
  if (unmatchedSizes.length) {
    console.log(`Figyelem: ${unmatchedSizes.length} méret-eltérés a Depiend és a saját méretlistánk között (lásd depiend-stock-audit-unmatched.json).`);
    fs.writeFileSync(path.join(__dirname, 'depiend-stock-audit-unmatched.json'), JSON.stringify(unmatchedSizes, null, 2));
  }
}

main().catch(e => { console.error(e); process.exit(1); });
