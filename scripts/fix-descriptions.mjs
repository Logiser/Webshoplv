// scripts/fix-descriptions.mjs
// Termékleírások tipográfiai javítása a scrape-elésből maradt hibákra.
// Csak biztonságos, mechanikus javításokat végez — a szakmai jelöléseket
// ("D vágási szint", "200 J", "K/N jelzés", "50 x 30 cm") NEM bántja.
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const path = join(ROOT, 'src/data/products.generated.json');
const all = JSON.parse(readFileSync(path, 'utf8'));

// Konkrét, kézzel ellenőrzött szótöredék-javítások (a Depiend HTML-jében
// stílus-tagek törték szét ezeket a szavakat)
const WORD_FIXES = [
  [/\bter vezet t\b/g, 'tervezett'],
  [/\bBiz weld\b/g, 'Bizweld'],
  [/\bFlexi- t\b/g, 'Flexi-t'],
  // helyes magyar egybeírás
  [/\be miatt\b/g, 'emiatt'],
];

const stats = { szoJavitas: 0, szokozJavitas: 0, erintettTermek: 0 };

for (const p of all) {
  const orig = p.description || '';
  if (!orig) continue;
  let d = orig;

  for (const [rx, to] of WORD_FIXES) {
    const before = d;
    d = d.replace(rx, to);
    if (d !== before) stats.szoJavitas++;
  }

  // Felesleges szóköz írásjel ELŐTT ("nadrágok , melyek" -> "nadrágok, melyek")
  const beforeSpace = d;
  d = d.replace(/\s+([,.;:!?])/g, '$1');
  // Hiányzó szóköz írásjel UTÁN ("zsebbel.Zippzáros" -> "zsebbel. Zippzáros")
  d = d.replace(/([,.;:!?])([A-ZÁ-Ű])/g, '$1 $2');
  // Dupla szóközök összevonása
  d = d.replace(/ {2,}/g, ' ').trim();
  if (d !== beforeSpace) stats.szokozJavitas++;

  if (d !== orig) {
    p.description = d;
    stats.erintettTermek++;
  }
}

writeFileSync(path, JSON.stringify(all, null, 1));
console.log('Leírás-javítás kész:', JSON.stringify(stats));
