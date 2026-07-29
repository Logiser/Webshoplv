// netlify/functions/track-order.js
// Publikus rendeléskövetés: rendelésazonosító + e-mail páros alapján adja vissza
// a rendelés állapotát. Az e-mail-egyezés a védelem — azonosító önmagában kevés,
// így véletlenszerű próbálkozással nem lehet más rendelését megnézni.
// Env: SUPABASE_URL, SUPABASE_SERVICE_KEY

const { createClient } = require('@supabase/supabase-js');

// Vevőnek megmutatható mezők (belső adat — pl. beszerzési ár — soha nem megy ki)
const publicView = (o) => ({
  id: o.id,
  status: o.status,
  createdAt: o.created_at || o.createdAt,
  total: o.total,
  items: (o.items || []).map(i => ({
    name: i.name, quantity: i.quantity, price: i.price, size: i.size, color: i.color
  })),
  shippingMethod: o.shipping_method || (o.data && o.data.shippingMethod) || null,
  pickupPoint: (o.data && o.data.pickupPoint) || null,
  paymentMethod: o.payment_method || (o.data && o.data.paymentMethod) || null,
  trackingNumber: o.tracking_number || (o.data && o.data.trackingNumber) || null,
  invoiceNumber: o.invoice_number || (o.data && o.data.invoiceNumber) || null
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Adatbázis nincs konfigurálva' }) };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch (e) { return { statusCode: 400, body: JSON.stringify({ error: 'Hibás kérés' }) }; }

  const orderId = String(body.orderId || '').trim();
  const email = String(body.email || '').trim().toLowerCase();

  if (!orderId || !email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Add meg a rendelésazonosítót és az e-mail-címet.' }) };
  }

  try {
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data, error } = await db.from('orders').select('*').eq('id', orderId).maybeSingle();
    if (error) throw error;

    // Nem létező rendelés és e-mail-eltérés ugyanazt a választ adja:
    // így nem derül ki, hogy létezik-e egyáltalán az adott azonosító.
    const orderEmail = String(
      (data && (data.email || (data.customer && data.customer.email) || (data.data && data.data.email))) || ''
    ).trim().toLowerCase();

    if (!data || orderEmail !== email) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Nem találtunk ilyen rendelést. Ellenőrizd az azonosítót és az e-mail-címet.' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, order: publicView(data) })
    };
  } catch (e) {
    console.error('track-order hiba:', e);
    return { statusCode: 500, body: JSON.stringify({ error: 'Váratlan hiba. Próbáld újra később.' }) };
  }
};
