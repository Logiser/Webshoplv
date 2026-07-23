// netlify/functions/send-order-email.js
// Resend.com email küldés - 3.000 email/hó ingyen
// Setup: Netlify Environment Variables → RESEND_API_KEY = re_xxxxx

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'iroda@tuz-munkavedelmiszaki.hu';
  const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  // Megjegyzés: amíg nincs igazolt saját domain, FROM_EMAIL = onboarding@resend.dev
  // Saját domain után: FROM_EMAIL = noreply@tuz-munkavedelmiszaki.hu

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY hiányzik!');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Email szolgáltatás nincs konfigurálva' })
    };
  }

  try {
    const orderData = JSON.parse(event.body);
    const { orderId, customer, items, total, timestamp } = orderData;
    const customerName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() 
      || customer.name || 'Vevő';

    const subtotal = (items || []).reduce((s, i) => s + (i.price * i.quantity), 0);
    const shipping = (total || 0) - subtotal;
    const dateStr = new Date(timestamp || Date.now()).toLocaleString('hu-HU');

    // ============ HTML email - ADMIN ============
    const adminHTML = `<!DOCTYPE html>
<html lang="hu">
<head><meta charset="UTF-8"><title>Új rendelés</title></head>
<body style="font-family: Arial, sans-serif; color: #333; background-color: #f5f5f5; margin: 0; padding: 20px;">
<div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
  <div style="background: #0F2A1D; color: white; padding: 24px; text-align: center;">
    <h1 style="margin: 0; font-size: 1.5rem;">🛡️ Új rendelés érkezett</h1>
    <p style="margin: 8px 0 0 0; opacity: 0.9;">${orderId || 'ORD-' + Date.now()}</p>
  </div>

  <div style="padding: 24px;">
    <h2 style="color: #0F2A1D; font-size: 1.1rem; border-bottom: 2px solid #C9A961; padding-bottom: 8px;">Vevő adatai</h2>
    <p style="margin: 4px 0;"><strong>Név:</strong> ${customerName}</p>
    <p style="margin: 4px 0;"><strong>Email:</strong> ${customer.email || '-'}</p>
    <p style="margin: 4px 0;"><strong>Telefon:</strong> ${customer.phone || '-'}</p>
    ${customer.company ? `<p style="margin: 4px 0;"><strong>Cég:</strong> ${customer.company}</p>` : ''}
    <p style="margin: 4px 0;"><strong>Cím:</strong> ${customer.address || ''}, ${customer.zip || customer.zipCode || ''} ${customer.city || ''}</p>
    ${customer.notes ? `<p style="margin: 4px 0;"><strong>Megjegyzés:</strong> ${customer.notes}</p>` : ''}

    <h2 style="color: #0F2A1D; font-size: 1.1rem; border-bottom: 2px solid #C9A961; padding-bottom: 8px; margin-top: 24px;">Tételek</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #f5f5f5;">
          <th style="padding: 8px; text-align: left; font-size: 0.85rem;">Termék</th>
          <th style="padding: 8px; text-align: center; font-size: 0.85rem;">Méret</th>
          <th style="padding: 8px; text-align: right; font-size: 0.85rem;">Db</th>
          <th style="padding: 8px; text-align: right; font-size: 0.85rem;">Egységár</th>
          <th style="padding: 8px; text-align: right; font-size: 0.85rem;">Összesen</th>
        </tr>
      </thead>
      <tbody>
        ${(items || []).map(item => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px; font-size: 0.9rem;">${item.name}</td>
          <td style="padding: 8px; text-align: center; font-size: 0.9rem;">${item.size || '-'}</td>
          <td style="padding: 8px; text-align: right; font-size: 0.9rem;">${item.quantity}</td>
          <td style="padding: 8px; text-align: right; font-size: 0.9rem;">${item.price.toLocaleString('hu-HU')} Ft</td>
          <td style="padding: 8px; text-align: right; font-weight: bold; color: #C9A961;">${(item.price * item.quantity).toLocaleString('hu-HU')} Ft</td>
        </tr>`).join('')}
      </tbody>
    </table>

    <div style="margin-top: 16px; padding: 16px; background: #0F2A1D; color: white; border-radius: 4px;">
      <table style="width: 100%; color: white;">
        <tr><td>Termékek:</td><td style="text-align: right;">${subtotal.toLocaleString('hu-HU')} Ft</td></tr>
        <tr><td>Szállítás:</td><td style="text-align: right;">${shipping.toLocaleString('hu-HU')} Ft</td></tr>
        <tr style="font-size: 1.2rem; font-weight: bold;"><td>VÉGÖSSZEG:</td><td style="text-align: right; color: #C9A961;">${(total || 0).toLocaleString('hu-HU')} Ft</td></tr>
      </table>
    </div>

    <p style="margin-top: 24px; color: #666; font-size: 0.85rem;">
      <strong>Időpont:</strong> ${dateStr}<br>
      <strong>Rendelési azonosító:</strong> ${orderId}
    </p>

    <div style="margin-top: 24px; padding: 16px; background: #fff9e6; border-left: 4px solid #FF9800; border-radius: 4px;">
      <p style="margin: 0; font-size: 0.9rem;">
        💡 <strong>Tipp:</strong> A teljes rendelés-kezelés és számla nyomtatás az admin oldalon érhető el.
      </p>
    </div>
  </div>

  <div style="background: #f5f5f5; padding: 16px; text-align: center; color: #999; font-size: 0.85rem;">
    Automatikus értesítés a MunkavédelmiShop rendszerből
  </div>
</div>
</body></html>`;

    // ============ HTML email - VEVŐ ============
    const customerHTML = `<!DOCTYPE html>
<html lang="hu">
<head><meta charset="UTF-8"><title>Rendelés visszaigazolás</title></head>
<body style="font-family: Arial, sans-serif; color: #333; background-color: #f5f5f5; margin: 0; padding: 20px;">
<div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #0F2A1D, #1a3f33); color: white; padding: 32px 24px; text-align: center;">
    <h1 style="margin: 0; font-size: 1.5rem;">🛡️ MunkavédelmiShop</h1>
    <p style="margin: 16px 0 0 0; font-size: 1.1rem;">✅ Rendelésed sikeresen beérkezett!</p>
  </div>

  <div style="padding: 24px;">
    <p>Kedves <strong>${customerName}</strong>!</p>
    <p>Köszönjük a rendelésedet! Az alábbi tételek sikeresen rögzítésre kerültek a rendszerünkben.</p>

    <h2 style="color: #0F2A1D; font-size: 1.1rem; border-bottom: 2px solid #C9A961; padding-bottom: 8px; margin-top: 24px;">Rendelés részletei</h2>
    <p style="margin: 4px 0;"><strong>Azonosító:</strong> ${orderId}</p>
    <p style="margin: 4px 0;"><strong>Időpont:</strong> ${dateStr}</p>

    <h3 style="color: #0F2A1D; font-size: 1rem; margin-top: 20px;">Megrendelt termékek</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tbody>
        ${(items || []).map(item => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px; font-size: 0.9rem;">
            <strong>${item.name}</strong>
            ${item.size ? `<br><span style="color: #999; font-size: 0.85rem;">Méret: ${item.size}</span>` : ''}
          </td>
          <td style="padding: 8px; text-align: right; font-size: 0.9rem; color: #666;">${item.quantity} db</td>
          <td style="padding: 8px; text-align: right; font-weight: bold; color: #C9A961;">${(item.price * item.quantity).toLocaleString('hu-HU')} Ft</td>
        </tr>`).join('')}
      </tbody>
    </table>

    <div style="margin-top: 16px; padding: 16px; background: #0F2A1D; color: white; border-radius: 4px;">
      <table style="width: 100%; color: white;">
        <tr style="font-size: 1.3rem; font-weight: bold;">
          <td>Fizetendő:</td>
          <td style="text-align: right; color: #C9A961;">${(total || 0).toLocaleString('hu-HU')} Ft</td>
        </tr>
      </table>
    </div>

    <h2 style="color: #0F2A1D; font-size: 1.1rem; border-bottom: 2px solid #C9A961; padding-bottom: 8px; margin-top: 24px;">Mi történik most?</h2>
    <ol style="line-height: 1.8;">
      <li>Hamarosan felvesszük veled a kapcsolatot az alábbi elérhetőségeken:
        <br>📞 ${customer.phone || '-'}
        <br>✉️ ${customer.email}
      </li>
      <li>Egyeztetjük a fizetési módot (átutalás / utánvét)</li>
      <li>Feldolgozzuk a rendelésed és csomagoljuk</li>
      <li>Postázzuk az alábbi címre:
        <br>${customer.address || ''}<br>
        ${customer.zip || customer.zipCode || ''} ${customer.city || ''}
      </li>
    </ol>

    <div style="margin-top: 24px; padding: 16px; background: #fff9e6; border-left: 4px solid #FF9800; border-radius: 4px;">
      <p style="margin: 0; font-size: 0.9rem;">
        💡 <strong>Kérdésed van?</strong> Bátran írj nekünk: 
        <a href="mailto:iroda@tuz-munkavedelmiszaki.hu" style="color: #0F2A1D;">iroda@tuz-munkavedelmiszaki.hu</a>
        vagy hívj: +36 30 272 2571
      </p>
    </div>
  </div>

  <div style="background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 0.85rem;">
    <p style="margin: 0;">Köszönjük, hogy minket választottál! 🙏</p>
    <p style="margin: 8px 0 0 0;">
      <strong>Trident Shield Group Kft.</strong> | Szentes, Magyarország<br>
      <a href="https://munkavedelmiszaki.hu" style="color: #0F2A1D;">www.munkavedelmiszaki.hu</a>
    </p>
  </div>
</div>
</body></html>`;

    // ============ Resend API hívás ============
    const sendEmail = async (to, subject, html) => {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [to],
          subject,
          html
        })
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('Resend hiba:', data);
        throw new Error(data.message || 'Email küldés nem sikerült');
      }
      return data;
    };

    // 1. email: az adminnak
    let adminResult = null;
    try {
      adminResult = await sendEmail(
        ADMIN_EMAIL,
        `🛒 Új rendelés: ${orderId} (${(total || 0).toLocaleString('hu-HU')} Ft)`,
        adminHTML
      );
    } catch (e) {
      console.error('Admin email hiba:', e);
    }

    // 2. email: a vevőnek (csak ha van email cím)
    let customerResult = null;
    if (customer.email) {
      try {
        customerResult = await sendEmail(
          customer.email,
          `✅ Rendelés visszaigazolás - MunkavédelmiShop (${orderId})`,
          customerHTML
        );
      } catch (e) {
        console.error('Vevő email hiba:', e);
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        adminSent: !!adminResult,
        customerSent: !!customerResult,
        orderId
      })
    };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Email küldési hiba',
        details: error.message
      })
    };
  }
};
