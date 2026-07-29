// netlify/functions/my-orders.js
// A bejelentkezett vásárló saját rendelései.
//
// BIZTONSÁG: a kliens csak a Supabase access tokenjét küldi. A tokenből a
// SZERVER állapítja meg, ki a felhasználó (supabase.auth.getUser), és kizárólag
// az ő e-mail-címéhez tartozó rendeléseket adja vissza. A kliens nem tudja
// megmondani, kinek a rendeléseit kéri.

const { createClient } = require('@supabase/supabase-js');

// Csak a vevőnek szánt mezők (beszerzési ár, belső jelölések soha nem mennek ki)
const publicView = (id, o) => ({
  id,
  status: o.status || 'pending',
  createdAt: o.timestamp || null,
  total: o.total,
  items: (o.items || []).map(i => ({
    name: i.name, quantity: i.quantity, price: i.price, size: i.size, color: i.color
  })),
  paymentMethod: o.paymentMethod || null,
  shippingMethod: (o.shipping && o.shipping.method) || null,
  trackingNumber: o.trackingNumber || null,
  invoiceNumber: o.invoiceNumber || null
});

exports.handler = async (event) => {
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY, REACT_APP_SUPABASE_ANON_KEY } = process.env;
  const ANON = process.env.SUPABASE_ANON_KEY || REACT_APP_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !ANON) {
    return { statusCode: 503, body: JSON.stringify({ error: 'A fiókok jelenleg nem érhetők el.' }) };
  }

  const auth = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Bejelentkezés szükséges.' }) };
  }

  try {
    // 1) A token érvényesítése — ez adja meg, KI a felhasználó
    const authClient = createClient(SUPABASE_URL, ANON);
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !userData || !userData.user) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Érvénytelen vagy lejárt bejelentkezés.' }) };
    }
    const email = String(userData.user.email || '').trim().toLowerCase();
    if (!email) {
      return { statusCode: 401, body: JSON.stringify({ error: 'A fiókhoz nem tartozik e-mail-cím.' }) };
    }

    // 2) A rendelések kiolvasása service kulccsal, majd szűrés a felhasználó e-mailjére
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: rows, error } = await db.from('orders').select('id, data').limit(2000);
    if (error) throw error;

    const mine = (rows || [])
      .filter(r => String((((r.data || {}).customer) || {}).email || '').trim().toLowerCase() === email)
      .map(r => publicView(r.id, r.data || {}))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ ok: true, orders: mine })
    };
  } catch (e) {
    console.error('my-orders hiba:', e);
    return { statusCode: 500, body: JSON.stringify({ error: 'Váratlan hiba a rendelések lekérésekor.' }) };
  }
};
