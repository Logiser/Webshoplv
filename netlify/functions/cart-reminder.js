// netlify/functions/cart-reminder.js
// Kosárelhagyó emlékeztető: naponta fut, a 4-48 órája elhagyott (hozzájárulásos)
// kosarakra EGYSZER küld emlékeztető emailt a Resenddel. Rendelés-egyezésnél töröl.
// Env: SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY, FROM_EMAIL

const { createClient } = require('@supabase/supabase-js');

exports.handler = async () => {
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY, FROM_EMAIL } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !RESEND_API_KEY) {
    return { statusCode: 200, body: JSON.stringify({ skipped: 'hiányzó konfiguráció' }) };
  }
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const now = Date.now();
  const SITE = process.env.URL || 'https://tridentshop.hu';
  const report = { sent: 0, cleared: 0, skipped: 0 };

  try {
    const { data: row } = await db.from('kv_store').select('value')
      .eq('key', 'ms_abandoned_carts').maybeSingle();
    const carts = (row && row.value) || {};
    if (Object.keys(carts).length === 0) {
      return { statusCode: 200, body: JSON.stringify({ ok: true, empty: true }) };
    }

    // Akinek időközben lett rendelése, azt töröljük.
    // FONTOS: az orders táblában minden a `data` JSONB oszlopban van
    // ({ id, data: { customer: { email } } }) — nincs külön `customer` oszlop.
    const { data: orders } = await db.from('orders').select('data').limit(1000);
    const orderedEmails = new Set((orders || [])
      .map(o => (((o.data || {}).customer || {}).email || '').toLowerCase()).filter(Boolean));

    let dirty = false;
    for (const [email, entry] of Object.entries(carts)) {
      const age = now - new Date(entry.ts).getTime();
      if (orderedEmails.has(email)) { delete carts[email]; report.cleared++; dirty = true; continue; }
      if (entry.remindedAt) { // már kapott emlékeztetőt: 7 nap után takarítjuk
        if (age > 7 * 86400e3) { delete carts[email]; dirty = true; }
        continue;
      }
      if (age < 4 * 3600e3 || age > 48 * 3600e3) { report.skipped++; continue; }

      const total = entry.cart.reduce((s, i) => s + i.price * i.quantity, 0);
      const rows = entry.cart.map(i =>
        `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">${i.name}</td>
         <td style="padding:6px 10px;border-bottom:1px solid #eee">${i.quantity} db</td>
         <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${(i.price * i.quantity).toLocaleString('hu-HU')} Ft</td></tr>`).join('');

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM_EMAIL || 'noreply@tuz-munkavedelmiszaki.com',
          to: email,
          subject: 'A kosarad vár rád 🛒 – MunkavédelmiShop',
          html: `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#333">
  <div style="background:#0F2A1D;color:white;padding:18px 24px;border-radius:8px 8px 0 0">
    <h2 style="margin:0;font-family:Georgia,serif">🛡️ MunkavédelmiShop</h2>
  </div>
  <div style="border:1px solid #eee;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <p>Szia!</p>
    <p>Láttuk, hogy összeraktál egy kosarat, de nem fejezted be a rendelést. Itt van, ahogy hagytad:</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
    <p style="text-align:right;font-weight:bold">Összesen: ${total.toLocaleString('hu-HU')} Ft</p>
    <p style="text-align:center;margin:24px 0">
      <a href="${SITE}/?kosar=${encodeURIComponent(Buffer.from(email).toString('base64url'))}" style="background:#C9A961;color:#0F2A1D;padding:12px 28px;border-radius:4px;text-decoration:none;font-weight:bold">Kosár visszaállítása &amp; rendelés</a>
    </p>
    <p style="color:#888;font-size:12px">Ezt az emailt azért kaptad, mert a pénztárnál hozzájárultál az értesítéshez.
    Több emlékeztetőt nem küldünk erről a kosárról.</p>
  </div>
</div>`
        })
      });
      if (res.ok) {
        carts[email].remindedAt = new Date(now).toISOString();
        report.sent++;
        dirty = true;
      }
    }

    if (dirty) {
      await db.from('kv_store').upsert({ key: 'ms_abandoned_carts', value: carts, updated_at: new Date(now).toISOString() });
    }
    console.log('cart-reminder:', JSON.stringify(report));
    return { statusCode: 200, body: JSON.stringify(report) };
  } catch (e) {
    console.error('cart-reminder hiba:', e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
