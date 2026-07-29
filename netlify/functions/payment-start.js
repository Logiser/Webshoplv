// netlify/functions/payment-start.js
// SimplePay (OTP Mobil) v2 tranzakció indítása.
//
// ÁLLAPOT: váz — a szerződés megkötése és a kulcsok beállítása után élesedik.
// Amíg a SIMPLEPAY_MERCHANT / SIMPLEPAY_SECRET_KEY env hiányzik, a function
// 503-at ad, és a pénztárban meg sem jelenik a bankkártyás fizetés.
//
// Env:
//   SIMPLEPAY_MERCHANT     — kereskedői azonosító (a szerződésből)
//   SIMPLEPAY_SECRET_KEY   — titkos kulcs a HMAC aláíráshoz
//   SIMPLEPAY_SANDBOX      — "true" esetén a teszt-környezetbe megy
//
// Dokumentáció: https://simplepartner.hu/PaymentService/Fizetesi_tajekoztato.pdf

const crypto = require('crypto');

const LIVE_URL = 'https://secure.simplepay.hu/payment/v2/start';
const SANDBOX_URL = 'https://sandbox.simplepay.hu/payment/v2/start';

const isConfigured = () =>
  Boolean(process.env.SIMPLEPAY_MERCHANT && process.env.SIMPLEPAY_SECRET_KEY);

// A SimplePay HMAC-SHA384 aláírást vár a nyers JSON body-ra, base64-ben
const sign = (body, secret) =>
  crypto.createHmac('sha384', secret).update(body, 'utf8').digest('base64');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!isConfigured()) {
    return {
      statusCode: 503,
      body: JSON.stringify({
        error: 'A bankkártyás fizetés még nincs aktiválva.',
        hint: 'SIMPLEPAY_MERCHANT és SIMPLEPAY_SECRET_KEY beállítása szükséges.'
      })
    };
  }

  const MERCHANT = process.env.SIMPLEPAY_MERCHANT;
  const SECRET = process.env.SIMPLEPAY_SECRET_KEY;
  const SANDBOX = String(process.env.SIMPLEPAY_SANDBOX || '').toLowerCase() === 'true';
  const SITE = process.env.SITE_URL || process.env.URL || 'https://tridentshop.hu';

  let input;
  try { input = JSON.parse(event.body || '{}'); }
  catch (e) { return { statusCode: 400, body: JSON.stringify({ error: 'Hibás kérés' }) }; }

  const { orderId, total, customer = {} } = input;
  const amount = Math.round(Number(total) || 0);

  if (!orderId || amount <= 0 || !customer.email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Hiányzó rendelési adat' }) };
  }

  // A tranzakció adatai. FONTOS: az összeget a SZERVER küldi, a kliens nem
  // tudja felülírni — a rendelés végösszege az adatbázisból/rendelésből jön.
  const payload = {
    salt: crypto.randomBytes(16).toString('hex'),
    merchant: MERCHANT,
    orderRef: String(orderId),
    currency: 'HUF',
    customerEmail: customer.email,
    language: 'HU',
    sdkVersion: 'MunkavedelmiShop_1.0',
    methods: ['CARD'],
    total: amount,
    timeout: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    url: `${SITE}/.netlify/functions/payment-callback`,
    urls: {
      success: `${SITE}/fizetes-eredmeny?status=success&order=${encodeURIComponent(orderId)}`,
      fail: `${SITE}/fizetes-eredmeny?status=fail&order=${encodeURIComponent(orderId)}`,
      cancel: `${SITE}/fizetes-eredmeny?status=cancel&order=${encodeURIComponent(orderId)}`,
      timeout: `${SITE}/fizetes-eredmeny?status=timeout&order=${encodeURIComponent(orderId)}`
    },
    invoice: {
      name: customer.name || '',
      company: customer.company || '',
      country: 'hu',
      state: customer.city || '',
      city: customer.city || '',
      zip: customer.zip || '',
      address: customer.address || ''
    }
  };

  const body = JSON.stringify(payload);
  const signature = sign(body, SECRET);

  try {
    const res = await fetch(SANDBOX ? SANDBOX_URL : LIVE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Signature': signature },
      body
    });
    const data = await res.json();

    if (!res.ok || data.errorCodes) {
      console.error('SimplePay start hiba:', data);
      return { statusCode: 502, body: JSON.stringify({ error: 'A fizetés indítása nem sikerült.', codes: data.errorCodes }) };
    }

    // paymentUrl: ide kell átirányítani a vásárlót
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, paymentUrl: data.paymentUrl, transactionId: data.transactionId })
    };
  } catch (e) {
    console.error('payment-start hiba:', e);
    return { statusCode: 500, body: JSON.stringify({ error: 'Váratlan hiba a fizetés indításakor.' }) };
  }
};

module.exports.isConfigured = isConfigured;
