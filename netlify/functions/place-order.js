// netlify/functions/place-order.js
// Rendelés rögzítése szerver-oldalon: order insert + FIFO készletcsökkentés +
// számlaszám generálás + alacsony készlet esetén beszállító értesítés.
// A vevő böngészője NEM ír közvetlenül az adatbázisba.
// Env: SUPABASE_URL, SUPABASE_SERVICE_KEY

const { createClient } = require('@supabase/supabase-js');

const KV = {
  OVERRIDES: 'ms_product_overrides',
  CUSTOM: 'ms_custom_products',
  STOCK_HISTORY: 'ms_stock_history',
  SUPPLIER_NOTIF: 'ms_supplier_notifications',
  COUPONS: 'ms_coupons'
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Supabase nincs konfigurálva' }) };
  }

  let order;
  try {
    order = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Hibás JSON' }) };
  }
  if (!order || !Array.isArray(order.cart) || order.cart.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Üres kosár' }) };
  }

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // KV dokumentumok beolvasása
    const { data: kvRows, error: kvErr } = await db
      .from('kv_store')
      .select('key, value')
      .in('key', Object.values(KV));
    if (kvErr) throw kvErr;

    const kv = {};
    (kvRows || []).forEach(r => { kv[r.key] = r.value; });
    const overrides = kv[KV.OVERRIDES] || {};
    const custom = kv[KV.CUSTOM] || [];
    const stockHistory = kv[KV.STOCK_HISTORY] || [];
    const supplierNotifs = kv[KV.SUPPLIER_NOTIF] || [];

    // Számlaszám: eddigi rendelések száma + 1
    const { count, error: cntErr } = await db
      .from('orders')
      .select('id', { count: 'exact', head: true });
    if (cntErr) throw cntErr;

    const now = new Date().toISOString();
    const orderId = 'ORD-' + Date.now();
    const newOrder = {
      ...order,
      id: orderId,
      invoiceNumber: `INV-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(5, '0')}`,
      date: now,
      status: 'pending',
      statusHistory: [{ status: 'pending', date: now, note: 'Rendelés rögzítve' }],
      trackingNumber: null
    };

    // FIFO készletcsökkentés tételenként (a storage.js removeStockFIFO logikája)
    for (const item of order.cart) {
      const qty = parseInt(item.quantity) || 0;
      if (qty <= 0) continue;

      let toRemove = qty;
      let totalCost = 0;
      stockHistory
        .filter(h => h.productId === item.id && h.type === 'IN' && h.remaining > 0)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .forEach(entry => {
          if (toRemove <= 0) return;
          const takeFrom = Math.min(entry.remaining, toRemove);
          entry.remaining -= takeFrom;
          toRemove -= takeFrom;
          totalCost += takeFrom * (entry.unitCost || 0);
        });

      stockHistory.push({
        id: Date.now() + Math.random(),
        productId: item.id,
        productName: item.name,
        type: 'OUT',
        quantity: qty,
        reason: `Rendelés: ${orderId}`,
        totalCost,
        date: now
      });

      // Készlet frissítése: custom terméknél a listában, alapterméknél override-ban
      const customIdx = custom.findIndex(p => p.id === item.id);
      if (customIdx >= 0) {
        const newStock = Math.max(0, (custom[customIdx].stock || 0) - qty);
        custom[customIdx].stock = newStock;
        maybeAddSupplierNotif(supplierNotifs, item, newStock, now);
      } else {
        const prevStock = (overrides[item.id] && typeof overrides[item.id].stock === 'number')
          ? overrides[item.id].stock
          : (typeof item.baseStock === 'number' ? item.baseStock : null);
        // Ha nem ismerjük az alapkészletet, a kliens által küldött stock mezőre hagyatkozunk
        const startStock = prevStock !== null ? prevStock : (parseInt(item.stock) || 0);
        const newStock = Math.max(0, startStock - qty);
        overrides[item.id] = { ...(overrides[item.id] || {}), stock: newStock };

        // Variáns (szín) készlet csökkentése
        if (item.colorCode) {
          const prevVS = overrides[item.id].variantStock || {};
          const startVS = prevVS[item.colorCode] !== undefined
            ? prevVS[item.colorCode]
            : (parseInt(item.variantStock) || 0);
          overrides[item.id].variantStock = {
            ...prevVS,
            [item.colorCode]: Math.max(0, startVS - qty)
          };
        }
        maybeAddSupplierNotif(supplierNotifs, item, newStock, now);
      }
    }

    // Kupon használat-számláló növelése
    const coupons = kv[KV.COUPONS] || [];
    if (order.coupon && order.coupon.code) {
      const ci = coupons.findIndex(c => c.code === order.coupon.code);
      if (ci >= 0) coupons[ci].usedCount = (coupons[ci].usedCount || 0) + 1;
    }

    // Mentés: order sor + KV dokumentumok
    const { error: insErr } = await db.from('orders').insert({ id: orderId, data: newOrder });
    if (insErr) throw insErr;

    const upserts = [
      { key: KV.OVERRIDES, value: overrides, updated_at: now },
      { key: KV.CUSTOM, value: custom, updated_at: now },
      { key: KV.STOCK_HISTORY, value: stockHistory, updated_at: now },
      { key: KV.SUPPLIER_NOTIF, value: supplierNotifs, updated_at: now },
      { key: KV.COUPONS, value: coupons, updated_at: now }
    ];
    const { error: upErr } = await db.from('kv_store').upsert(upserts);
    if (upErr) throw upErr;

    return { statusCode: 200, body: JSON.stringify({ order: newOrder }) };
  } catch (e) {
    console.error('place-order hiba:', e);
    return { statusCode: 500, body: JSON.stringify({ error: 'Rendelés mentési hiba' }) };
  }
};

function maybeAddSupplierNotif(notifs, item, newStock, now) {
  if (newStock >= 10) return;
  if (notifs.some(n => n.productId === item.id && !n.resolved)) return;
  notifs.push({
    id: Date.now() + Math.random(),
    productId: item.id,
    productName: item.name,
    currentStock: newStock,
    suggestedOrder: Math.max(50, Math.floor(newStock * 5)),
    date: now,
    resolved: false
  });
}
