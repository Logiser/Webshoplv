// netlify/functions/contact-form.js
// Kapcsolat-űrlap: a beküldött üzenetet elküldi az ügyfélszolgálati címre
// (Resend), és eltárolja a kv_store-ban, hogy egy esetleges email-hiba esetén
// se vesszen el. Publikus végpont — szigorú validálás + egyszerű rate limit.
// kv kulcs: ms_contact_messages [{ts, name, email, subject, message}]

const { createClient } = require('@supabase/supabase-js');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const esc = (s) => String(s || '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'POST kell' }) };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Hibás kérés' }) };
  }

  const name = String(body.name || '').trim().slice(0, 100);
  const email = String(body.email || '').trim().toLowerCase().slice(0, 120);
  const subject = String(body.subject || '').trim().slice(0, 150);
  const message = String(body.message || '').trim().slice(0, 4000);
  // Rejtett mező: ha ki van töltve, robot töltötte ki
  const honeypot = String(body.company || '').trim();

  if (!name || !subject || !message) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Minden mező kitöltése kötelező.' }) };
  }
  if (!EMAIL_RE.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Érvénytelen e-mail-cím.' }) };
  }
  if (honeypot) {
    // Csendben "sikeres" — a spambot ne tanuljon belőle
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY } = process.env;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'iroda@tuz-munkavedelmiszaki.com';
  const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@tuz-munkavedelmiszaki.com';
  const now = new Date().toISOString();
  const result = { ok: false, saved: false, mailed: false };

  // 1) Mentés adatbázisba (hogy email-hiba esetén se vesszen el)
  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    try {
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const { data } = await db.from('kv_store').select('value')
        .eq('key', 'ms_contact_messages').maybeSingle();
      const list = Array.isArray(data && data.value) ? data.value : [];
      list.unshift({ ts: now, name, email, subject, message });
      await db.from('kv_store').upsert({
        key: 'ms_contact_messages', value: list.slice(0, 500), updated_at: now
      });
      result.saved = true;
    } catch (e) {
      console.error('contact-form mentési hiba:', e.message);
    }
  }

  // 2) Email az ügyfélszolgálatnak (válasz-címnek a beküldő címe)
  if (RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `MunkavédelmiShop <${FROM_EMAIL}>`,
          to: [ADMIN_EMAIL],
          reply_to: email,
          subject: `Kapcsolatfelvétel: ${subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
              <h2 style="color:#0F2A1D;">Új üzenet a webshop kapcsolat-űrlapjáról</h2>
              <p><strong>Név:</strong> ${esc(name)}<br/>
                 <strong>E-mail:</strong> <a href="mailto:${esc(email)}">${esc(email)}</a><br/>
                 <strong>Tárgy:</strong> ${esc(subject)}</p>
              <div style="background:#f5f5f5;padding:1rem;border-radius:6px;white-space:pre-wrap;">${esc(message)}</div>
              <p style="color:#888;font-size:0.85rem;margin-top:1.5rem;">
                Beérkezett: ${new Date(now).toLocaleString('hu-HU')} · Válaszhoz elég a Válasz gomb.
              </p>
            </div>`
        })
      });
      result.mailed = res.ok;
      if (!res.ok) console.error('Resend hiba:', res.status, await res.text());
    } catch (e) {
      console.error('contact-form email hiba:', e.message);
    }
  }

  // Sikeres, ha legalább az egyik csatorna működött
  result.ok = result.saved || result.mailed;
  return {
    statusCode: result.ok ? 200 : 500,
    body: JSON.stringify(result.ok
      ? { ok: true }
      : { error: 'Az üzenetet most nem tudtuk fogadni. Kérjük, hívj minket: +36 30 272 2571' })
  };
};
