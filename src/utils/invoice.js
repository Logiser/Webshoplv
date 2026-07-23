// Számla generálás - HTML alapú, böngészőből nyomtatható (PDF mentés Ctrl+P)

export const generateInvoiceHTML = (order) => {
  const items = order.cart || order.items || [];
  const subtotal = items.reduce((s, i) => s + (i.price * i.quantity), 0);
  const shipping = order.total - subtotal;
  const vat = Math.round(subtotal * 0.27 / 1.27); // 27% ÁFA tartalmaz
  const net = subtotal - vat;
  const date = new Date(order.date).toLocaleDateString('hu-HU');
  const customer = order.customer || {};

  return `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="UTF-8">
<title>Számla ${order.invoiceNumber || order.id}</title>
<style>
  @media print {
    body { margin: 0; }
    .no-print { display: none; }
  }
  body {
    font-family: 'Arial', sans-serif;
    max-width: 800px;
    margin: 2rem auto;
    padding: 2rem;
    color: #333;
    line-height: 1.5;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 3px solid #C9A961;
    padding-bottom: 1.5rem;
    margin-bottom: 2rem;
  }
  .logo {
    font-size: 2rem;
    color: #0F2A1D;
    font-family: Georgia, serif;
    margin: 0;
  }
  .seller {
    font-size: 0.9rem;
    color: #666;
    margin-top: 0.5rem;
  }
  .invoice-info {
    text-align: right;
  }
  .invoice-info h2 {
    color: #0F2A1D;
    margin: 0 0 0.5rem 0;
  }
  .parties {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 2rem;
  }
  .party h3 {
    color: #0F2A1D;
    font-size: 0.9rem;
    text-transform: uppercase;
    margin-bottom: 0.5rem;
    border-bottom: 1px solid #ddd;
    padding-bottom: 0.25rem;
  }
  .party p { margin: 0.25rem 0; font-size: 0.95rem; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 2rem;
  }
  thead { background-color: #0F2A1D; color: white; }
  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #eee;
  }
  th.right, td.right { text-align: right; }
  th.center, td.center { text-align: center; }
  .totals {
    margin-left: auto;
    width: 350px;
  }
  .totals table { margin: 0; }
  .totals td { border: none; padding: 0.4rem 0.75rem; }
  .total-final {
    background-color: #0F2A1D;
    color: white;
    font-size: 1.2rem;
    font-weight: bold;
  }
  .total-final td { padding: 0.75rem; }
  .footer {
    margin-top: 3rem;
    padding-top: 1rem;
    border-top: 1px solid #ddd;
    font-size: 0.85rem;
    color: #666;
    text-align: center;
  }
  .stamp {
    margin-top: 2rem;
    padding: 1rem;
    background: #f9f9f9;
    border: 2px dashed #C9A961;
    text-align: center;
    color: #666;
  }
  .actions {
    text-align: center;
    margin-bottom: 2rem;
  }
  .actions button {
    padding: 0.75rem 1.5rem;
    background: #0F2A1D;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    margin: 0 0.5rem;
  }
</style>
</head>
<body>

<div class="actions no-print">
  <button onclick="window.print()">🖨️ Nyomtatás / PDF mentés</button>
  <button onclick="window.close()">✕ Bezárás</button>
</div>

<div class="header">
  <div>
    <h1 class="logo">🛡️ MunkavédelmiShop</h1>
    <div class="seller">
      Trident Shield Group Kft.<br>
      6600 Szentes, Magyarország<br>
      Adószám: 12345678-2-06<br>
      Cégjegyzékszám: 06-09-024xyz<br>
      Bankszámla: 12345678-12345678-12345678
    </div>
  </div>
  <div class="invoice-info">
    <h2>SZÁMLA</h2>
    <p><strong>Sorszám:</strong> ${order.invoiceNumber || order.id}</p>
    <p><strong>Kelt:</strong> ${date}</p>
    <p><strong>Teljesítés:</strong> ${date}</p>
    <p><strong>Fizetési mód:</strong> ${order.paymentMethod || 'Banki átutalás'}</p>
    <p><strong>Fiz. határidő:</strong> ${new Date(new Date(order.date).getTime() + 8 * 24 * 60 * 60 * 1000).toLocaleDateString('hu-HU')}</p>
  </div>
</div>

<div class="parties">
  <div class="party">
    <h3>Eladó</h3>
    <p><strong>Trident Shield Group Kft.</strong></p>
    <p>6600 Szentes, Magyarország</p>
    <p>Adószám: 12345678-2-06</p>
    <p>Email: iroda@tuz-munkavedelmiszaki.hu</p>
    <p>Tel: +36 30 272 2571</p>
  </div>
  <div class="party">
    <h3>Vevő</h3>
    <p><strong>${customer.firstName || ''} ${customer.lastName || customer.name || ''}</strong></p>
    <p>${customer.address || customer.zip || ''} ${customer.city || ''}</p>
    <p>${customer.address || ''}</p>
    <p>Email: ${customer.email || '-'}</p>
    <p>Tel: ${customer.phone || '-'}</p>
    ${customer.taxNumber ? `<p>Adószám: ${customer.taxNumber}</p>` : ''}
  </div>
</div>

<table>
  <thead>
    <tr>
      <th>#</th>
      <th>Megnevezés</th>
      <th class="center">Méret</th>
      <th class="right">Menny.</th>
      <th class="right">Nettó</th>
      <th class="right">ÁFA (27%)</th>
      <th class="right">Bruttó</th>
    </tr>
  </thead>
  <tbody>
    ${items.map((item, i) => {
      const lineBrutto = item.price * item.quantity;
      const lineVat = Math.round(lineBrutto * 0.27 / 1.27);
      const lineNet = lineBrutto - lineVat;
      return `
    <tr>
      <td>${i + 1}</td>
      <td>${item.name}</td>
      <td class="center">${item.size || '-'}</td>
      <td class="right">${item.quantity} db</td>
      <td class="right">${lineNet.toLocaleString('hu-HU')} Ft</td>
      <td class="right">${lineVat.toLocaleString('hu-HU')} Ft</td>
      <td class="right">${lineBrutto.toLocaleString('hu-HU')} Ft</td>
    </tr>`;
    }).join('')}
  </tbody>
</table>

<div class="totals">
  <table>
    <tr>
      <td>Termékek összesen (nettó):</td>
      <td class="right">${net.toLocaleString('hu-HU')} Ft</td>
    </tr>
    <tr>
      <td>ÁFA (27%):</td>
      <td class="right">${vat.toLocaleString('hu-HU')} Ft</td>
    </tr>
    <tr>
      <td>Termékek bruttó:</td>
      <td class="right">${subtotal.toLocaleString('hu-HU')} Ft</td>
    </tr>
    ${shipping > 0 ? `
    <tr>
      <td>Szállítási költség:</td>
      <td class="right">${shipping.toLocaleString('hu-HU')} Ft</td>
    </tr>` : ''}
    <tr class="total-final">
      <td>VÉGÖSSZEG:</td>
      <td class="right">${(order.total || subtotal).toLocaleString('hu-HU')} Ft</td>
    </tr>
  </table>
</div>

<div style="clear: both;"></div>

<div class="stamp">
  <p>📎 A számla elektronikusan készült, aláírás és bélyegző nélkül is érvényes.</p>
  <p style="font-size: 0.85rem; margin-top: 0.5rem;">
    NAV-felhasználói tájékoztató: ezt a számlát kérjük 8 évig megőrizni.
  </p>
</div>

<div class="footer">
  <p><strong>Köszönjük a megrendelést!</strong></p>
  <p>Kapcsolat: iroda@tuz-munkavedelmiszaki.hu | +36 30 272 2571 | www.tuz-munkavedelmiszaki.hu</p>
  <p style="margin-top: 0.5rem; font-size: 0.75rem;">
    Az ÁSZF letölthető a webshopon. A számla a 2007. évi CXXVII. törvény szerint került kiállításra.
  </p>
</div>

</body>
</html>`;
};

export const openInvoice = (order) => {
  const html = generateInvoiceHTML(order);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank');
  if (w) {
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  return url;
};
