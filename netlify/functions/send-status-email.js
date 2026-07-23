// netlify/functions/send-status-email.js
// Rendelés státusz változás emailek:
// - shipped → "Feladva" értesítés
// - delivered → "Kézbesítve" értesítés + 30 perc múlva értékelő email
// - cancelled → "Lemondva" értesítés

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const SITE_URL = process.env.SITE_URL || process.env.URL || 'https://munkavedelmiszaki.hu';

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY hiányzik!');
    return { statusCode: 500, body: JSON.stringify({ error: 'Email szolgáltatás nincs konfigurálva' }) };
  }

  try {
    const data = JSON.parse(event.body);
    const { orderId, customer, items, total, status, trackingNumber, note } = data;

    if (!customer?.email) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Hiányzó vevő email' }) };
    }

    const customerName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() 
      || customer.name || 'Kedves Vevőnk';

    // Tételek HTML listája (újrafelhasználható)
    const itemsHTML = (items || []).map(item => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 8px; font-size: 0.9rem;">
          <strong>${item.name}</strong>
          ${item.size ? `<br><span style="color: #999; font-size: 0.85rem;">Méret: ${item.size}</span>` : ''}
        </td>
        <td style="padding: 8px; text-align: right; font-size: 0.9rem; color: #666;">${item.quantity} db</td>
        <td style="padding: 8px; text-align: right; font-weight: bold; color: #C9A961;">${(item.price * item.quantity).toLocaleString('hu-HU')} Ft</td>
      </tr>`).join('');

    let subject = '';
    let html = '';
    let scheduledFollowup = null;

    // ============ SHIPPED - "Feladva" ============
    if (status === 'shipped') {
      subject = `🚚 A csomagod úton van! - ${orderId}`;
      html = `<!DOCTYPE html><html lang="hu"><head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; color: #333; background-color: #f5f5f5; margin: 0; padding: 20px;">
<div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #00897B, #00695C); color: white; padding: 32px 24px; text-align: center;">
    <h1 style="margin: 0; font-size: 1.8rem;">🚚 A csomagod úton van!</h1>
    <p style="margin: 16px 0 0 0; opacity: 0.95;">A rendelésed feladva — hamarosan megérkezik</p>
  </div>

  <div style="padding: 24px;">
    <p>Kedves <strong>${customerName}</strong>!</p>
    <p>Örömmel értesítünk, hogy a <strong>${orderId}</strong> azonosítójú rendelésed elindult feléd!</p>

    ${trackingNumber ? `
    <div style="margin: 24px 0; padding: 20px; background: linear-gradient(135deg, #fff9e6, #fff5d5); border-left: 4px solid #C9A961; border-radius: 4px;">
      <p style="margin: 0; font-size: 1rem;">📦 <strong>Csomagszám / Tracking:</strong></p>
      <p style="margin: 8px 0 0 0; font-family: monospace; font-size: 1.2rem; font-weight: bold; color: #0F2A1D;">${trackingNumber}</p>
      <p style="margin: 12px 0 0 0; font-size: 0.85rem; color: #666;">
        Ezzel az azonosítóval követheted a csomagod a futárszolgálat oldalán.
      </p>
    </div>` : ''}

    <h3 style="color: #0F2A1D;">📋 Megrendelt termékek</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
      <tbody>${itemsHTML}</tbody>
    </table>

    <div style="padding: 16px; background: #0F2A1D; color: white; border-radius: 4px; text-align: right;">
      <strong style="font-size: 1.2rem;">Összesen: <span style="color: #C9A961;">${(total || 0).toLocaleString('hu-HU')} Ft</span></strong>
    </div>

    <h3 style="color: #0F2A1D; margin-top: 24px;">📍 Mi történik most?</h3>
    <ul style="line-height: 1.8; color: #555;">
      <li>A futárszolgálat 1-3 munkanapon belül érkezik</li>
      <li>Tartsd készenlétben a telefonod, mert hívni fognak</li>
      <li>Ha problémád van a csomaggal, jelezd nekünk: <a href="mailto:iroda@tuz-munkavedelmiszaki.hu" style="color: #0F2A1D;">iroda@tuz-munkavedelmiszaki.hu</a></li>
    </ul>

    ${note ? `<div style="margin-top: 20px; padding: 12px; background: #f5f5f5; border-radius: 4px; font-size: 0.9rem;"><strong>Üzenet tőlünk:</strong> ${note}</div>` : ''}
  </div>

  <div style="background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 0.85rem;">
    <p style="margin: 0;"><strong>Trident Shield Group Kft.</strong> | Szentes | +36 30 272 2571</p>
    <p style="margin: 8px 0 0 0;"><a href="${SITE_URL}" style="color: #0F2A1D;">www.munkavedelmiszaki.hu</a></p>
  </div>
</div></body></html>`;
    }

    // ============ DELIVERED - "Kézbesítve" + 30 perces értékelő ============
    else if (status === 'delivered') {
      subject = `✅ Megérkezett a csomagod! - ${orderId}`;
      html = `<!DOCTYPE html><html lang="hu"><head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; color: #333; background-color: #f5f5f5; margin: 0; padding: 20px;">
<div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #4CAF50, #388E3C); color: white; padding: 32px 24px; text-align: center;">
    <h1 style="margin: 0; font-size: 1.8rem;">✅ Megérkezett a csomagod!</h1>
    <p style="margin: 16px 0 0 0; opacity: 0.95;">Köszönjük, hogy minket választottál</p>
  </div>

  <div style="padding: 24px;">
    <p>Kedves <strong>${customerName}</strong>!</p>
    <p>Visszaigazoltuk, hogy a <strong>${orderId}</strong> azonosítójú rendelésed sikeresen kézbesítésre került. 🎉</p>

    <h3 style="color: #0F2A1D;">📋 Mit kaptál meg</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
      <tbody>${itemsHTML}</tbody>
    </table>

    <div style="margin: 24px 0; padding: 20px; background: linear-gradient(135deg, #fff9e6, #fff5d5); border-left: 4px solid #C9A961; border-radius: 4px;">
      <p style="margin: 0; font-size: 1rem;">⭐ <strong>Hamarosan kapsz tőlünk egy rövid kérdőívet</strong></p>
      <p style="margin: 8px 0 0 0; font-size: 0.9rem; color: #666;">
        30 perc múlva küldünk neked egy értékelő emailt — segíts megosztani a véleményed a vásárlásról!
      </p>
    </div>

    <h3 style="color: #0F2A1D;">💡 Mi a következő?</h3>
    <ul style="line-height: 1.8; color: #555;">
      <li>Próbáld ki a megvásárolt termékeket</li>
      <li>14 napos visszavásárlási garancia van minden termékre</li>
      <li>Ha bármi probléma van, írj nekünk: <a href="mailto:iroda@tuz-munkavedelmiszaki.hu" style="color: #0F2A1D;">iroda@tuz-munkavedelmiszaki.hu</a></li>
    </ul>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${SITE_URL}" style="display: inline-block; padding: 12px 32px; background: #C9A961; color: #0F2A1D; text-decoration: none; border-radius: 4px; font-weight: bold;">
        🛒 Vásárolj tovább
      </a>
    </div>
  </div>

  <div style="background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 0.85rem;">
    <p style="margin: 0;"><strong>Trident Shield Group Kft.</strong> | Szentes | +36 30 272 2571</p>
  </div>
</div></body></html>`;

      // 30 perc múlva értékelő email
      scheduledFollowup = {
        subject: `⭐ Hogyan tetszett a vásárlás? - ${orderId}`,
        scheduled_at: 'in 30 min',
        html: `<!DOCTYPE html><html lang="hu"><head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; color: #333; background-color: #f5f5f5; margin: 0; padding: 20px;">
<div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #C9A961, #b3934e); color: #0F2A1D; padding: 32px 24px; text-align: center;">
    <h1 style="margin: 0; font-size: 1.8rem;">⭐ Hogyan tetszett a vásárlás?</h1>
    <p style="margin: 16px 0 0 0;">A véleményed nagyon fontos nekünk!</p>
  </div>

  <div style="padding: 24px;">
    <p>Kedves <strong>${customerName}</strong>!</p>
    <p>Reméljük, hogy elégedett vagy a vásárlásoddal a MunkavédelmiShop webshopjában.</p>
    <p>Kérünk, szánj egy percet és <strong>értékeld a tapasztalataidat</strong> — ez nekünk hatalmas segítség!</p>

    <h3 style="color: #0F2A1D; text-align: center; margin-top: 24px;">Mennyire vagy elégedett?</h3>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${SITE_URL}/contact?rating=5&order=${orderId}" style="display: inline-block; margin: 4px; padding: 12px 16px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">⭐⭐⭐⭐⭐ Kiváló</a>
      <a href="${SITE_URL}/contact?rating=4&order=${orderId}" style="display: inline-block; margin: 4px; padding: 12px 16px; background: #8BC34A; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">⭐⭐⭐⭐ Jó</a>
      <br>
      <a href="${SITE_URL}/contact?rating=3&order=${orderId}" style="display: inline-block; margin: 4px; padding: 12px 16px; background: #FFC107; color: #333; text-decoration: none; border-radius: 4px; font-weight: bold;">⭐⭐⭐ Közepes</a>
      <a href="${SITE_URL}/contact?rating=2&order=${orderId}" style="display: inline-block; margin: 4px; padding: 12px 16px; background: #FF9800; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">⭐⭐ Gyenge</a>
      <a href="${SITE_URL}/contact?rating=1&order=${orderId}" style="display: inline-block; margin: 4px; padding: 12px 16px; background: #f44336; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">⭐ Rossz</a>
    </div>

    <div style="margin: 24px 0; padding: 16px; background: #f9f9f9; border-radius: 4px;">
      <p style="margin: 0; font-size: 0.9rem; color: #666;">
        💬 Bármilyen visszajelzést szívesen fogadunk — pozitívat és negatívat egyaránt. Csak így tudunk fejlődni!
      </p>
    </div>

    <p style="margin-top: 24px; color: #666; font-size: 0.9rem;">
      Köszönjük, hogy időt szánsz ránk! 🙏<br>
      <strong>MunkavédelmiShop csapata</strong>
    </p>
  </div>

  <div style="background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 0.85rem;">
    <p style="margin: 0;"><strong>Trident Shield Group Kft.</strong> | Szentes | +36 30 272 2571</p>
  </div>
</div></body></html>`
      };
    }

    // ============ CANCELLED - "Lemondva" ============
    else if (status === 'cancelled') {
      subject = `❌ Rendelés lemondva - ${orderId}`;
      html = `<!DOCTYPE html><html lang="hu"><head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; color: #333; background-color: #f5f5f5; margin: 0; padding: 20px;">
<div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #d32f2f, #b71c1c); color: white; padding: 32px 24px; text-align: center;">
    <h1 style="margin: 0; font-size: 1.8rem;">❌ Rendelés lemondva</h1>
    <p style="margin: 16px 0 0 0; opacity: 0.95;">Sajnálattal értesítünk a változásról</p>
  </div>

  <div style="padding: 24px;">
    <p>Kedves <strong>${customerName}</strong>!</p>
    <p>Sajnálattal értesítünk, hogy a <strong>${orderId}</strong> azonosítójú rendelésed lemondásra került.</p>

    ${note ? `
    <div style="margin: 20px 0; padding: 16px; background: #fff5f5; border-left: 4px solid #d32f2f; border-radius: 4px;">
      <p style="margin: 0; font-size: 1rem;"><strong>📝 Indoklás:</strong></p>
      <p style="margin: 8px 0 0 0;">${note}</p>
    </div>` : ''}

    <h3 style="color: #0F2A1D;">📋 Lemondott tételek</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
      <tbody>${itemsHTML}</tbody>
    </table>

    <div style="padding: 16px; background: #f5f5f5; color: #333; border-radius: 4px; text-align: right;">
      <strong style="font-size: 1.1rem;">Lemondott összeg: ${(total || 0).toLocaleString('hu-HU')} Ft</strong>
    </div>

    <h3 style="color: #0F2A1D; margin-top: 24px;">💡 Mi a teendő?</h3>
    <ul style="line-height: 1.8; color: #555;">
      <li>Ha már fizettél, a visszautalás 3-5 munkanapon belül megérkezik</li>
      <li>Ha kérdésed van a lemondás okáról, írj nekünk</li>
      <li>Esetleg más terméket szeretnél? Nézz körül újra a webshopunkban!</li>
    </ul>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${SITE_URL}" style="display: inline-block; padding: 12px 32px; background: #C9A961; color: #0F2A1D; text-decoration: none; border-radius: 4px; font-weight: bold;">
        🛒 Vissza a webshopra
      </a>
    </div>

    <p style="font-size: 0.9rem; color: #666;">
      Elérhetőségünk: <a href="mailto:iroda@tuz-munkavedelmiszaki.hu" style="color: #0F2A1D;">iroda@tuz-munkavedelmiszaki.hu</a> | +36 30 272 2571
    </p>
  </div>

  <div style="background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 0.85rem;">
    <p style="margin: 0;"><strong>Trident Shield Group Kft.</strong> | Szentes</p>
  </div>
</div></body></html>`;
    }

    // Egyéb státusznak nincs email
    else {
      return {
        statusCode: 200,
        body: JSON.stringify({ skipped: true, reason: `No email for status: ${status}` })
      };
    }

    // ============ Resend API hívás ============
    const sendEmail = async (to, subject, html, scheduled_at = null) => {
      const body = {
        from: FROM_EMAIL,
        to: [to],
        subject,
        html
      };
      if (scheduled_at) body.scheduled_at = scheduled_at;

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('Resend hiba:', data);
        throw new Error(data.message || 'Email küldés nem sikerült');
      }
      return data;
    };

    // Fő email küldése
    let mainResult = null;
    try {
      mainResult = await sendEmail(customer.email, subject, html);
    } catch (e) {
      console.error('Fő email küldési hiba:', e);
    }

    // 30 perces follow-up küldése (csak delivered esetén)
    let followupResult = null;
    if (scheduledFollowup) {
      try {
        followupResult = await sendEmail(
          customer.email,
          scheduledFollowup.subject,
          scheduledFollowup.html,
          scheduledFollowup.scheduled_at
        );
      } catch (e) {
        console.error('Értékelő email scheduling hiba:', e);
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        status,
        sent: !!mainResult,
        followupScheduled: !!followupResult
      })
    };
  } catch (error) {
    console.error('Status email hiba:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Email hiba', details: error.message })
    };
  }
};
