// netlify/functions/depiend-sync.js
// Depiend beszállítói ár-szinkron: lekéri a termékek aktuális Depiend-árát,
// árrés-szabállyal (DEPIEND_MARGIN, alap 1.35) újraszámolja a webshop-árat,
// és a kv_store override-okba menti a változásokat.
// Futás: naponta ütemezve (netlify.toml) VAGY kézzel az adminból (x-admin-password).
// Env: SUPABASE_URL, SUPABASE_SERVICE_KEY, ADMIN_PASSWORD, DEPIEND_MARGIN (opcionális)

const { createClient } = require('@supabase/supabase-js');
const PRODUCTS = require('./products-data.json');

// Cikkszám -> Depiend termékoldal
const DEPIEND_URLS = {
  'C701': 'https://www.depiend.hu/munkaruha/munkaruha/nadrag/portwest-combat-nadrag-c701',
  'C720': 'https://www.depiend.hu/munkaruha/munkaruha/nadrag/portwest-tradesman-holster-nadrag-c720',
  'CD110': 'https://www.depiend.hu/munkaruha/munkaruha/dzseki-kabat/portwest-wx1-kettonusu-dzseki-cd110',
  'CD871': 'https://www.depiend.hu/munkaruha/munkaruha/dzseki-kabat/portwest-wx2-eco-fleece-cd871',
  'CD864': 'https://www.depiend.hu/munkaruha/munkaruha/dzseki-kabat/portwest-wx2-eco-telikabat-cd864',
  'B303': 'https://www.depiend.hu/munkaruha/munkaruha/jol-lathatosagi-munkaruha/portwest-jol-lathatosagi-pulover-b303',
  'C370': 'https://www.depiend.hu/munkaruha/munkaruha/jol-lathatosagi-munkaruha/portwest-hi-vis-meshair-szellozo-melleny-c370',
  '2802': 'https://www.depiend.hu/munkaruha/munkaruha/overal/portwest-overal-2802',
  'FC08': 'https://www.depiend.hu/munkaruha/munkavedelmi-cipo-vedolabbelik/cipo/portwest-compositelite-eco-runner-munkavedelmi-cipo-s1p-fc08',
  'FT16': 'https://www.depiend.hu/munkaruha/munkavedelmi-cipo-vedolabbelik/cipo/portwest-olymflex-london-s1p-trainer-munkavedelmi-cipo-ft16',
  'FC64': 'https://www.depiend.hu/munkaruha/munkavedelmi-cipo-vedolabbelik/cipo/portwest-compositelite-trekker-munkavedelmi-labbeli-s1-fc64',
  'FD61': 'https://www.depiend.hu/munkaruha/munkavedelmi-cipo-vedolabbelik/cipo/portwest-compositelite-fuzos-munkavedelmi-cipo-s2-fd61',
  'FC19': 'https://www.depiend.hu/munkaruha/munkavedelmi-cipo-vedolabbelik/cipo/portwest-apex-munkavedelmi-felcipo-esd-s3s-hro-sr-sc-fo-fc19',
  'FC10': 'https://www.depiend.hu/munkaruha/munkavedelmi-cipo-vedolabbelik/bakancs/portwest-compositelite-vedobakancs-s1p-fc10',
  'FC11': 'https://www.depiend.hu/munkaruha/munkavedelmi-cipo-vedolabbelik/bakancs/portwest-compositelite-thor-vedobakancs-s3-fc11',
  'FD03': 'https://www.depiend.hu/munkaruha/munkavedelmi-cipo-vedolabbelik/bakancs/portwest-protector-plus-munkavedelmi-bakancs-s3-hro-fd03',
  'FC12': 'https://www.depiend.hu/munkaruha/munkavedelmi-cipo-vedolabbelik/bakancs/portwest-compositelite-szormebeleses-vedobakancs-s3-ci-fc12',
  'FC17': 'https://www.depiend.hu/munkaruha/munkavedelmi-cipo-vedolabbelik/bakancs/portwest-compositelite-montana-hiker-munkavedelmi-bakancs-s3-fc17',
  'A100': 'https://www.depiend.hu/munkaruha/munkavedelmi-kesztyu-latex-kesztyu-nitril-kesztyu/vedokesztyu/portwest-martott-latex-vedokesztyu-a100',
  'A120': 'https://www.depiend.hu/munkaruha/munkavedelmi-kesztyu-latex-kesztyu-nitril-kesztyu/vedokesztyu/portwest-nylon-vedokesztyu-pu-tenyermartott-a120',
  'A140': 'https://www.depiend.hu/munkaruha/munkavedelmi-kesztyu-latex-kesztyu-nitril-kesztyu/vedokesztyu/portwest-martott-latex-vedokesztyu-teli-kivitel-a140',
  'A146': 'https://www.depiend.hu/munkaruha/munkavedelmi-kesztyu-latex-kesztyu-nitril-kesztyu/vedokesztyu/portwest-arctic-teli-vedokesztyu-a146',
  'PS55': 'https://www.depiend.hu/munkaruha/sisak-arcvedo-sapka/sisak/portwest-endurance-vedosisak-ps55',
  'PR01': 'https://www.depiend.hu/munkaruha/vedoszemuveg/hagyomanyos/portwest-anthracite-wraparound-vedoszemuveg-pr01',
  'B013': 'https://www.depiend.hu/munkaruha/sisak-arcvedo-sapka/sapka/portwest-kotott-sapka-insulatex-belessel-b013'
};

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0';

exports.handler = async (event) => {
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY, ADMIN_PASSWORD } = process.env;
  const margin = parseFloat(process.env.DEPIEND_MARGIN) || 1.35;

  // Jogosultság: ütemezett hívás (next_run a body-ban) VAGY admin jelszó
  let isScheduled = false;
  try {
    const body = JSON.parse(event.body || '{}');
    isScheduled = Boolean(body.next_run);
  } catch (e) {}
  const givenPw = (event.headers && event.headers['x-admin-password']) || '';
  if (!isScheduled && (!ADMIN_PASSWORD || givenPw !== ADMIN_PASSWORD)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Jogosultság szükséges' }) };
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Supabase nincs konfigurálva' }) };
  }
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const report = { checked: 0, changed: [], unavailable: [], errors: [] };

  try {
    const { data: ovRow, error: ovErr } = await db
      .from('kv_store').select('value').eq('key', 'ms_product_overrides').maybeSingle();
    if (ovErr) throw ovErr;
    const overrides = (ovRow && ovRow.value) || {};

    for (const p of PRODUCTS) {
      const url = DEPIEND_URLS[p.articleNo];
      if (!url) continue;
      report.checked++;
      try {
        const res = await fetch(url, { headers: { 'User-Agent': UA } });
        if (!res.ok) {
          report.unavailable.push({ articleNo: p.articleNo, status: res.status });
          continue;
        }
        const html = await res.text();
        const m = html.match(/class="price">([\d\s ]+)Ft/);
        if (!m) {
          report.errors.push({ articleNo: p.articleNo, error: 'Ár nem található az oldalon' });
          continue;
        }
        const supplierPrice = parseInt(m[1].replace(/[\s ]/g, ''), 10);
        if (!supplierPrice || supplierPrice < 50) {
          report.errors.push({ articleNo: p.articleNo, error: `Gyanús ár: ${m[1]}` });
          continue;
        }
        const newPrice = Math.round(supplierPrice * margin / 10) * 10;
        const currentPrice = (overrides[p.id] && overrides[p.id].price) || p.price;
        if (newPrice !== currentPrice) {
          overrides[p.id] = { ...(overrides[p.id] || {}), price: newPrice };
          report.changed.push({
            articleNo: p.articleNo, name: p.name,
            supplierPrice, oldPrice: currentPrice, newPrice
          });
        }
      } catch (e) {
        report.errors.push({ articleNo: p.articleNo, error: e.message });
      }
    }

    const now = new Date().toISOString();
    const upserts = [
      { key: 'ms_depiend_sync', value: { lastRun: now, margin, ...report }, updated_at: now }
    ];
    if (report.changed.length > 0) {
      upserts.push({ key: 'ms_product_overrides', value: overrides, updated_at: now });
    }
    const { error: upErr } = await db.from('kv_store').upsert(upserts);
    if (upErr) throw upErr;

    console.log(`Depiend szinkron kész: ${report.checked} ellenőrizve, ${report.changed.length} árváltozás`);
    return { statusCode: 200, body: JSON.stringify(report) };
  } catch (e) {
    console.error('depiend-sync hiba:', e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message, report }) };
  }
};
