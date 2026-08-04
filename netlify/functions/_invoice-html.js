// Szerver-oldali számla-HTML generálás a rendelés-visszaigazoló e-mail
// mellékletéhez. A vevő így azonnal megkapja a számlát, és nem kell utólag
// letöltő felületet fenntartanunk.
//
// Megjegyzés: ez a Trident Shield Group Kft. saját, nyomtatható bizonylata.
// A NAV-os e-számlát a Számlázz.hu integráció állítja ki (place-order.js).

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const ft = (n) => (Number(n) || 0).toLocaleString('hu-HU') + ' Ft';

const CEG = {
  nev: 'Trident Shield Group Kft.',
  marka: 'MunkavédelmiShop',
  szekhely: '4485 Nagyhalász, Jókai utca 18.',
  telephely: '4030 Debrecen, Keleti Ipartelep utca 4.',
  cegjegyzek: '15-09-093902',
  adoszam: '32873537-1-15',
  email: 'iroda@tuz-munkavedelmiszaki.com',
  telefon: '+36 30 272 2571',
  web: 'tridentshop.hu'
};

const AFA_KULCS = 0.27;

function buildInvoiceHTML(order) {
  const {
    orderId, invoiceNumber, customer = {}, items = [], total = 0,
    timestamp, paymentMethod, shipping
  } = order;

  const datum = timestamp ? new Date(timestamp) : new Date();
  const datumStr = datum.toLocaleDateString('hu-HU');
  // Fizetési határidő utalásnál: 8 nap
  const hatarido = new Date(datum.getTime() + 8 * 24 * 60 * 60 * 1000).toLocaleDateString('hu-HU');

  const termekOsszeg = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);
  const szallitas = Math.max(0, (Number(total) || 0) - termekOsszeg);

  const sorok = items.map(i => {
    const brutto = (Number(i.price) || 0) * (Number(i.quantity) || 0);
    const netto = Math.round(brutto / (1 + AFA_KULCS));
    const megnevezes = esc(i.name) + ((i.size || i.color)
      ? ` <span style="color:#777;font-size:11px">(${esc([i.size, i.color].filter(Boolean).join(' · '))})</span>` : '');
    return `<tr>
      <td style="padding:7px 8px;border-bottom:1px solid #eee">${megnevezes}</td>
      <td style="padding:7px 8px;border-bottom:1px solid #eee;text-align:center">${Number(i.quantity) || 0} db</td>
      <td style="padding:7px 8px;border-bottom:1px solid #eee;text-align:right">${ft(i.price)}</td>
      <td style="padding:7px 8px;border-bottom:1px solid #eee;text-align:right">${ft(netto)}</td>
      <td style="padding:7px 8px;border-bottom:1px solid #eee;text-align:right;font-weight:bold">${ft(brutto)}</td>
    </tr>`;
  }).join('');

  const szallitasSor = szallitas > 0 ? `<tr>
      <td style="padding:7px 8px;border-bottom:1px solid #eee">Szállítási díj</td>
      <td style="padding:7px 8px;border-bottom:1px solid #eee;text-align:center">1</td>
      <td style="padding:7px 8px;border-bottom:1px solid #eee;text-align:right">${ft(szallitas)}</td>
      <td style="padding:7px 8px;border-bottom:1px solid #eee;text-align:right">${ft(Math.round(szallitas / (1 + AFA_KULCS)))}</td>
      <td style="padding:7px 8px;border-bottom:1px solid #eee;text-align:right;font-weight:bold">${ft(szallitas)}</td>
    </tr>` : '';

  const vegNetto = Math.round((Number(total) || 0) / (1 + AFA_KULCS));
  const vegAfa = (Number(total) || 0) - vegNetto;

  return `<!DOCTYPE html><html lang="hu"><head><meta charset="utf-8">
<title>Bizonylat ${esc(invoiceNumber || orderId)}</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#222;max-width:800px;margin:0 auto;padding:24px">

  <table style="width:100%;border-bottom:3px solid #C9A961;padding-bottom:14px;margin-bottom:20px">
    <tr>
      <td style="vertical-align:top">
        <div style="font-family:Georgia,serif;font-size:22px;color:#0F2A1D;font-weight:bold">🛡️ ${esc(CEG.marka)}</div>
        <div style="font-size:12px;color:#555;margin-top:6px;line-height:1.6">
          ${esc(CEG.nev)}<br>
          Székhely: ${esc(CEG.szekhely)}<br>
          Telephely: ${esc(CEG.telephely)}<br>
          Cégjegyzékszám: ${esc(CEG.cegjegyzek)}<br>
          Adószám: ${esc(CEG.adoszam)}
        </div>
      </td>
      <td style="vertical-align:top;text-align:right">
        <div style="font-size:19px;font-weight:bold;color:#0F2A1D">BIZONYLAT</div>
        <div style="font-size:12px;color:#555;margin-top:6px;line-height:1.7">
          Sorszám: <strong>${esc(invoiceNumber || orderId)}</strong><br>
          Rendelésazonosító: ${esc(orderId)}<br>
          Kelt: ${esc(datumStr)}<br>
          Teljesítés: ${esc(datumStr)}<br>
          Fizetési mód: ${esc(paymentMethod || 'Utánvét')}
          ${/utal/i.test(paymentMethod || '') ? `<br>Fizetési határidő: ${esc(hatarido)}` : ''}
        </div>
      </td>
    </tr>
  </table>

  <table style="width:100%;margin-bottom:18px">
    <tr>
      <td style="width:50%;vertical-align:top">
        <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px">Szállító</div>
        <div style="font-size:13px;line-height:1.6;margin-top:4px">
          <strong>${esc(CEG.nev)}</strong><br>${esc(CEG.szekhely)}<br>
          ${esc(CEG.email)}<br>${esc(CEG.telefon)}
        </div>
      </td>
      <td style="width:50%;vertical-align:top">
        <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px">Vevő</div>
        <div style="font-size:13px;line-height:1.6;margin-top:4px">
          <strong>${esc(customer.company || customer.name || '')}</strong><br>
          ${customer.company && customer.name ? esc(customer.name) + '<br>' : ''}
          ${esc(customer.address || '')}<br>
          ${esc(customer.zip || '')} ${esc(customer.city || '')}<br>
          ${esc(customer.email || '')}
        </div>
      </td>
    </tr>
  </table>

  <table style="width:100%;border-collapse:collapse;font-size:13px">
    <thead>
      <tr style="background:#0F2A1D;color:#fff">
        <th style="padding:9px 8px;text-align:left">Megnevezés</th>
        <th style="padding:9px 8px;text-align:center">Menny.</th>
        <th style="padding:9px 8px;text-align:right">Egységár</th>
        <th style="padding:9px 8px;text-align:right">Nettó</th>
        <th style="padding:9px 8px;text-align:right">Bruttó</th>
      </tr>
    </thead>
    <tbody>${sorok}${szallitasSor}</tbody>
  </table>

  <table style="width:100%;margin-top:16px">
    <tr><td></td><td style="width:260px">
      <table style="width:100%;font-size:13px">
        <tr><td style="padding:5px 0">Nettó összesen:</td><td style="text-align:right">${ft(vegNetto)}</td></tr>
        <tr><td style="padding:5px 0">ÁFA (27%):</td><td style="text-align:right">${ft(vegAfa)}</td></tr>
        <tr style="border-top:2px solid #0F2A1D">
          <td style="padding:9px 0;font-weight:bold;font-size:15px;color:#0F2A1D">Fizetendő:</td>
          <td style="text-align:right;font-weight:bold;font-size:15px;color:#0F2A1D">${ft(total)}</td>
        </tr>
      </table>
    </td></tr>
  </table>

  ${shipping && shipping.method === 'foxpost' && shipping.foxpostPoint
    ? `<div style="margin-top:18px;padding:10px 12px;background:#f5f7f5;border-left:4px solid #C9A961;font-size:12px">
         <strong>Átvételi pont:</strong> ${esc(shipping.foxpostPoint)}
       </div>` : ''}

  <div style="margin-top:26px;padding-top:14px;border-top:1px solid #ddd;font-size:11px;color:#777;line-height:1.7">
    Ez a bizonylat elektronikusan készült, aláírás és bélyegző nélkül is érvényes.
    A hatályos jogszabályok szerinti áfás számlát külön küldjük meg.<br>
    Elállási jog: a termék átvételétől számított 14 napon belül indoklás nélkül elállhatsz a vásárlástól.<br>
    ${esc(CEG.web)} · ${esc(CEG.email)} · ${esc(CEG.telefon)}
  </div>
</body></html>`;
}

module.exports = { buildInvoiceHTML };
