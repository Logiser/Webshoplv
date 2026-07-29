// netlify/functions/payment-status.js
// A pénztár ezzel kérdezi le, elérhető-e a bankkártyás fizetés.
// Így a kártyás opció csak akkor jelenik meg, ha a SimplePay tényleg be van kötve.

exports.handler = async () => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
  body: JSON.stringify({
    cardEnabled: Boolean(process.env.SIMPLEPAY_MERCHANT && process.env.SIMPLEPAY_SECRET_KEY),
    sandbox: String(process.env.SIMPLEPAY_SANDBOX || '').toLowerCase() === 'true'
  })
});
