import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';

// A SimplePay ide irányítja vissza a vásárlót a fizetés után.
// A rendelés tényleges állapotát a szerver-szerver IPN (payment-callback) írja —
// ez az oldal csak visszajelzést ad, nem dönt a fizetésről.

const RESULTS = {
  success: {
    icon: CheckCircle, color: '#4CAF50', title: 'Sikeres fizetés',
    text: 'Köszönjük! A fizetés megérkezett, a rendelésedet feldolgozzuk. A visszaigazolást e-mailben küldjük.'
  },
  fail: {
    icon: XCircle, color: '#d32f2f', title: 'Sikertelen fizetés',
    text: 'A tranzakció nem ment végbe. Ellenőrizd a kártyaadatokat és az egyenleget, majd próbáld újra — a rendelésedet megőriztük.'
  },
  cancel: {
    icon: XCircle, color: '#FF9800', title: 'Megszakított fizetés',
    text: 'Megszakítottad a fizetést. A rendelésed rögzítve maradt, bármikor befejezheted, vagy válaszd az utánvétet.'
  },
  timeout: {
    icon: Clock, color: '#FF9800', title: 'Időtúllépés',
    text: 'A fizetési idő lejárt. A rendelésed rögzítve maradt — indíts új fizetést, vagy válaszd az utánvétet.'
  }
};

const PaymentResultPage = () => {
  const [params] = useSearchParams();
  const status = params.get('status') || 'fail';
  const orderId = params.get('order') || '';
  const r = RESULTS[status] || RESULTS.fail;
  const Icon = r.icon;

  useEffect(() => { document.title = `${r.title} | TridentShop`; }, [r.title]);

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ backgroundColor: 'white', padding: '1rem 1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderBottom: '3px solid #C9A961' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#0F2A1D', fontFamily: 'Georgia, serif', fontSize: '1.4rem' }}>
            🛡️ TridentShop
          </Link>
          <Link to="/" style={{ color: '#0F2A1D', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ArrowLeft size={18} /> Vissza a webshopra
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: '600px', margin: '3rem auto', padding: '0 1.5rem' }}>
        <div style={{ backgroundColor: 'white', padding: '2.5rem 2rem', borderRadius: '10px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <Icon size={64} color={r.color} style={{ marginBottom: '1rem' }} />
          <h1 style={{ color: '#0F2A1D', fontFamily: 'Georgia, serif', margin: '0 0 0.75rem 0' }}>{r.title}</h1>
          <p style={{ color: '#555', lineHeight: 1.7, margin: '0 0 1.5rem 0' }}>{r.text}</p>

          {orderId && (
            <div style={{ backgroundColor: '#f5f7f5', padding: '0.85rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
              <span style={{ color: '#888', fontSize: '0.85rem' }}>Rendelésazonosító</span><br />
              <strong style={{ color: '#0F2A1D' }}>{orderId}</strong>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {orderId && (
              <Link to={`/rendeles-kovetes?id=${encodeURIComponent(orderId)}`} style={{
                backgroundColor: '#0F2A1D', color: 'white', padding: '0.75rem 1.5rem',
                borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold'
              }}>
                📦 Rendelés követése
              </Link>
            )}
            <Link to="/" style={{
              backgroundColor: '#C9A961', color: '#0F2A1D', padding: '0.75rem 1.5rem',
              borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold'
            }}>
              Vissza a webshopra
            </Link>
          </div>

          <p style={{ color: '#888', fontSize: '0.87rem', marginTop: '1.75rem', marginBottom: 0 }}>
            Kérdés esetén: <strong>+36 30 272 2571</strong> · iroda@tuz-munkavedelmiszaki.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentResultPage;
