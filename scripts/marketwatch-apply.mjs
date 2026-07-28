// scripts/marketwatch-apply.mjs
// A piacfigyelés (data/marketwatch/) eredményeinek alkalmazása:
// 1) Árgép-árak -> netlify/functions/argep-prices.json (a feed versenyszűrője)
// 2) Árukereső-árak -> átárazás a products.generated.json-ban (legolcsóbb-10,
//    padló +5%, plafon 2.2x — azonos a bevált sémával)
// Futtatás: node scripts/marketwatch-apply.mjs  (utána: npm run build + commit + push)
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIN_MARGIN = 1.05, MAX_MARGIN = 2.2;

// --- 1) Árgép ---
const argep = JSON.parse(readFileSync(join(ROOT, 'data/marketwatch/argep_prices.json'), 'utf8'));
writeFileSync(join(ROOT, 'netlify/functions/argep-prices.json'), JSON.stringify(argep));
const argepVals = Object.values(argep);
console.log(`Árgép: ${argepVals.length} termék adata beépítve a feedbe (${argepVals.filter(v => v === 0).length} nincs fent, ${argepVals.filter(v => v > 0).length} listázott)`);

// --- 2) Árukereső átárazás ---
const aru = JSON.parse(readFileSync(join(ROOT, 'data/marketwatch/arukereso_prices.json'), 'utf8'));
const prodPath = join(ROOT, 'src/data/products.generated.json');
const all = JSON.parse(readFileSync(prodPath, 'utf8'));
const stats = { atarazva: 0, padlo: 0, plafon: 0, valtozott: 0 };
for (const p of all) {
  const comp = aru[p.articleNo];
  if (!(comp > 0) || !(p.partnerPrice > 0)) continue;
  const floorP = Math.ceil((p.partnerPrice * MIN_MARGIN) / 10) * 10;
  const capP = Math.round((p.partnerPrice * MAX_MARGIN) / 10) * 10;
  let target = Math.floor(comp / 10) * 10;
  if (target >= comp) target -= 10;
  let price;
  if (target < floorP) { price = floorP; stats.padlo++; }
  else if (target > capP) { price = capP; stats.plafon++; }
  else price = target;
  if (price !== p.price) { stats.valtozott++; }
  p.price = price;
  p.priceSource = 'arukereso';
  p.competitorPrice = comp;
  stats.atarazva++;
}
writeFileSync(prodPath, JSON.stringify(all, null, 1));
console.log('Árukereső átárazás:', JSON.stringify(stats));
console.log('KÖVETKEZŐ LÉPÉS: npm run build && git commit && git push (auto-deploy)');
