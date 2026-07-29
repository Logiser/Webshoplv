// netlify/functions/payment-callback.js
// SimplePay IPN (szerver-szerver értesítés) fogadása.
//
// A SimplePay ide küldi a fizetés végeredményét. A hitelesség ellenőrzése
// KÖTELEZŐ: az aláírást a saját titkos kulcsunkkal újraszámoljuk, és csak
// egyezés esetén fogadjuk el — enélkül bárki „kifizetettre" állíthatná
// más rendelését.
//
// A SimplePay elvárja, hogy visszaigazoljuk a feldolgozást: a válasz body-ja
// egy base64-kódolt JSON { receiveDate }, aláírva ugyanazzal a kulccsal.

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const sign = (body, secret) =>
  crypto.createHmac('sha384', secret).update(body, 'utf8').digest('base64');

// Időzítés-független összehasonlítás (nem szivárogtat információt)
const safeEqual = (a, b) => {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};

exports.handler = async (event) => {
  const SECRET = process.env.SIMPLEPAY_SECRET_KEY;
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

  if (!SECRET) {
    return { statusCode: 503, body: 'A fizetés nincs konfigurálva' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const raw = event.body || '';
  const received = (event.headers && (event.headers.signature || event.headers.Signature)) || '';
  const expected = sign(raw, SECRET);

  if (!received || !safeEqual(received.trim(), expected)) {
    console.error('SimplePay IPN: érvénytelen aláírás — elutasítva');
    return { statusCode: 401, body: 'Invalid signature' };
  }

  let ipn;
  try { ipn = JSON.parse(raw); }
  catch (e) { return { statusCode: 400, body: 'Invalid JSON' }; }

  const orderRef = ipn.orderRef;
  const status = String(ipn.status || '').toUpperCase();

  try {
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY && orderRef) {
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const { data: row } = await db.from('orders').select('id, data').eq('id', orderRef).maybeSingle();
      if (row) {
        const order = { ...(row.data || {}) };
        // Csak a sikeres/véglegesített tranzakció állítja "Fizetve"-re
        if (status === 'FINISHED') {
          order.status = 'paid';
          order.paidAt = new Date().toISOString();
        } else if (status === 'CANCELLED' || status === 'FAIL' || status === 'TIMEOUT') {
          order.paymentFailed = status;
        }
        order.simplePayTransactionId = ipn.transactionId || null;
        await db.from('orders').update({ data: order }).eq('id', orderRef);
      } else {
        console.error('SimplePay IPN: ismeretlen rendelés', orderRef);
      }
    }
  } catch (e) {
    // Az IPN-t akkor is vissza kell igazolni, ha a mentés hibázott — különben
    // a SimplePay újraküldi. A hibát naplózzuk, kézzel pótolható.
    console.error('payment-callback mentési hiba:', e);
  }

  // Visszaigazolás a SimplePay felé
  const confirm = JSON.stringify({ ...ipn, receiveDate: new Date().toISOString() });
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Signature': sign(confirm, SECRET)
    },
    body: Buffer.from(confirm, 'utf8').toString('base64')
  };
};
