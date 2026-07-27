// netlify/functions/depiend-sync.js
// Depiend beszállítói ár-szinkron a TÖMEGES kereses-ajax végponttal:
// 4 kéréssel lekéri MIND a ~2000 Portwest termék aktuális listaárát,
// majd árrés-szabállyal újraszámolja a webshop-árakat a kv_store override-okba.
// (A korábbi, termékoldalankénti verzió 278 terméknél ~15 mp volt; ~2000-nél
// túllépné a Netlify function-limitet — a bulk végpont ~5 mp alatt végez.)
// Futás: óránként ütemezve (netlify.toml) VAGY kézzel az adminból (x-admin-password).
// Env: SUPABASE_URL, SUPABASE_SERVICE_KEY, ADMIN_PASSWORD, DEPIEND_MARGIN, DEPIEND_PARTNER_RATIO

const { createClient } = require('@supabase/supabase-js');
const PRODUCTS = require('./products-data.json');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0';
const SEARCH_PAGE = 'https://www.depiend.hu/kereses/portwest';
const AJAX_URL = 'https://www.depiend.hu/kereses-ajax';

// Cikkszám a Depiend-találat címéből: "Portwest FC06 FX2 Eco ..." -> FC06
const artOf = (title) => {
  const m = (title || '').match(/^Portwest\s+([A-Z0-9]{2,7})\b/i);
  return m ? m[1].toUpperCase() : null;
};

// Az összes Portwest listaár lehúzása: cookie+CSRF a keresőoldalról, majd lapozás
async function fetchAllListPrices() {
  const pageRes = await fetch(SEARCH_PAGE, { headers: { 'User-Agent': UA } });
  if (!pageRes.ok) throw new Error(`Depiend keresőoldal: HTTP ${pageRes.status}`);
  const cookies = (pageRes.headers.getSetCookie ? pageRes.headers.getSetCookie() : [pageRes.headers.get('set-cookie')].filter(Boolean))
    .map(c => c.split(';')[0]).join('; ');
  const html = await pageRes.text();
  const csrfM = html.match(/name="csrf-token" content="([^"]+)"/);
  if (!csrfM) throw new Error('CSRF token nem található');

  const prices = {}; // articleNo -> bruttó listaár
  let total = Infinity;
  for (let skip = 0; skip < total && skip < 5000; skip += 500) {
    const qs = new URLSearchParams({
      limit: '500', skip: String(skip), order: 'score', _csrf: csrfM[1]
    });
    qs.append('brand[]', 'Portwest');
    const res = await fetch(`${AJAX_URL}?${qs}`, {
      headers: {
        'User-Agent': UA, 'Cookie': cookies, 'Referer': SEARCH_PAGE,
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    if (!res.ok) throw new Error(`kereses-ajax: HTTP ${res.status}`);
    const data = await res.json();
    total = parseInt(data.total) || 0;
    for (const p of (data.products || [])) {
      const art = artOf(p.title);
      if (!art) continue;
      const price = parseInt(String(p.price || '').replace(/[^0-9]/g, ''), 10);
      if (price && price >= 50 && !prices[art]) prices[art] = price;
    }
  }
  return prices;
}

exports.handler = async (event) => {
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY, ADMIN_PASSWORD } = process.env;
  // Alapértékek env-ből; az adminban mentett ms_pricing (kv) felülírja őket
  let margin = parseFloat(process.env.DEPIEND_MARGIN) || 1.3;
  // Viszonteladói kedvezmény a publikus listaárhoz képest (2026-07: egységes 23.9%)
  let partnerRatio = parseFloat(process.env.DEPIEND_PARTNER_RATIO) || 0.7608;

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

    // Adminban beállított árazás (kézzel állítható árrés) — felülírja az env-et
    const { data: prRow } = await db.from('kv_store').select('value')
      .eq('key', 'ms_pricing').maybeSingle();
    if (prRow && prRow.value) {
      if (parseFloat(prRow.value.margin) > 0) margin = parseFloat(prRow.value.margin);
      if (parseFloat(prRow.value.partnerRatio) > 0) partnerRatio = parseFloat(prRow.value.partnerRatio);
    }

    const listPrices = await fetchAllListPrices();
    report.bulkCount = Object.keys(listPrices).length;

    for (const p of PRODUCTS) {
      // Kézi áras termék: az admin által rögzített árat a szinkron NEM írja felül
      if (overrides[p.id] && overrides[p.id].priceManual === true) {
        report.manualSkipped = (report.manualSkipped || 0) + 1;
        continue;
      }
      const listPrice = listPrices[(p.articleNo || '').toUpperCase()];
      if (!listPrice) {
        report.unavailable.push({ articleNo: p.articleNo });
        continue;
      }
      report.checked++;
      const partnerPrice = Math.round(listPrice * partnerRatio);
      const currentPrice = (overrides[p.id] && overrides[p.id].price) || p.price;

      // Versenyár-alapú (Árukereső) termék: az árat békén hagyjuk, KIVÉVE ha a
      // beszerzési ár úgy megnőtt, hogy a jelenlegi ár 5% árrés alá esne —
      // ilyenkor a padló-árra emelünk (veszteség-védelem)
      if (p.priceSource === 'arukereso') {
        const floorPrice = Math.ceil((partnerPrice * 1.05) / 10) * 10;
        if (currentPrice < floorPrice) {
          overrides[p.id] = { ...(overrides[p.id] || {}), price: floorPrice };
          report.changed.push({
            articleNo: p.articleNo, name: p.name, ok: 'padlo-emeles',
            listPrice, partnerPrice, oldPrice: currentPrice, newPrice: floorPrice
          });
        }
        continue;
      }

      // Képlet-áras termék: partnerár × árrés
      const newPrice = Math.round(partnerPrice * margin / 10) * 10;
      if (newPrice !== currentPrice) {
        overrides[p.id] = { ...(overrides[p.id] || {}), price: newPrice };
        report.changed.push({
          articleNo: p.articleNo, name: p.name,
          listPrice, partnerPrice, oldPrice: currentPrice, newPrice
        });
      }
    }

    const now = new Date().toISOString();
    const upserts = [
      { key: 'ms_depiend_sync', value: { lastRun: now, margin, ...report, changed: report.changed.slice(0, 200) }, updated_at: now }
    ];
    if (report.changed.length > 0) {
      upserts.push({ key: 'ms_product_overrides', value: overrides, updated_at: now });
    }
    const { error: upErr } = await db.from('kv_store').upsert(upserts);
    if (upErr) throw upErr;

    console.log(`Depiend szinkron kész: ${report.checked} ellenőrizve (bulk: ${report.bulkCount}), ${report.changed.length} árváltozás`);
    return { statusCode: 200, body: JSON.stringify({ ...report, changed: report.changed.slice(0, 50) }) };
  } catch (e) {
    console.error('depiend-sync hiba:', e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message, report }) };
  }
};
