import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, Package, Truck, CheckCircle, Clock, CreditCard, XCircle } from 'lucide-react';

// Publikus rendeléskövetés: azonosító + e-mail páros alapján.
// A szerver (track-order function) csak egyező e-mail esetén ad vissza adatot.

const STEPS = [
  { id: 'pending', label: 'Beérkezett', icon: Clock },
  { id: 'paid', label: 'Fizetve', icon: CreditCard },
  { id: 'packed', label: 'Csomagolva', icon: Package },
  { id: 'shipped', label: 'Feladva', icon: Truck },
  { id: 'delivered', label: 'Kézbesítve', icon: CheckCircle }
];

const OrderTrackingPage = () => {
  const [params] = useSearchParams();
  const [orderId, setOrderId] = useState(params.get('id') || '');
  const [email, setEmail] = useState(params.get('email') || '');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Rendeléskövetés | TridentShop';
  }, []);

  const lookup = async (e) => {
    if (e) e.preventDefault();
    if (!orderId.trim() || !email.trim()) {
      setError('Add meg a rendelésazonosítót és az e-mail-címet.');
      return;
    }
    setLoading(true); setError(''); setOrder(null);
    try {
      const res = await fetch('/.netlify/functions/track-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderId.trim(), email: email.trim() })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Nem sikerült lekérni a rendelést.'); }
      else { setOrder(data.order); }
    } catch (err) {
      setError('Hálózati hiba. Ellenőrizd a kapcsolatot és próbáld újra.');
    } finally {
      setLoading(false);
    }
  };

  // Ha URL-ből jött azonosító + e-mail (pl. az értesítő e-mail linkjéből), induljon magától
  useEffect(() => {
    if (params.get('id') && params.get('email')) lookup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancelled = order && order.status === 'cancelled';
  const activeIdx = order ? STEPS.findIndex(s => s.id === order.status) : -1;

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ backgroundColor: 'white', padding: '1rem 1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderBottom: '3px solid #C9A961' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#0F2A1D', fontFamily: 'Georgia, serif', fontSize: '1.4rem' }}>
            🛡️ TridentShop
          </Link>
          <Link to="/" style={{ color: '#0F2A1D', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ArrowLeft size={18} /> Vissza a webshopra
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: '760px', margin: '2rem auto', padding: '0 1.5rem' }}>
        <h1 style={{ color: '#0F2A1D', fontFamily: 'Georgia, serif', marginBottom: '0.35rem' }}>📦 Rendeléskövetés</h1>
        <p style={{ color: '#666', marginTop: 0 }}>
          Add meg a rendelésazonosítót (a visszaigazoló e-mailben találod) és az e-mail-címet, amivel rendeltél.
        </p>

        <form onSubmit={lookup} style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', color: '#0F2A1D', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                Rendelésazonosító
              </label>
              <input value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="pl. ORD-1784992520497"
                style={{ width: '100%', padding: '0.7rem', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', color: '#0F2A1D', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                E-mail-cím
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com"
                style={{ width: '100%', padding: '0.7rem', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }} />
            </div>
          </div>
          <button type="submit" disabled={loading} style={{
            marginTop: '1rem', backgroundColor: '#0F2A1D', color: 'white', border: 'none',
            padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: loading ? 'default' : 'pointer',
            fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: loading ? 0.6 : 1
          }}>
            <Search size={16} /> {loading ? 'Keresés…' : 'Rendelés lekérdezése'}
          </button>
        </form>

        {error && (
          <div style={{ backgroundColor: '#fdecea', color: '#b3261e', padding: '0.9rem 1rem', borderRadius: '6px', marginTop: '1rem' }}>
            {error}
          </div>
        )}

        {order && (
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ color: '#999', fontSize: '0.8rem' }}>Rendelésazonosító</div>
                <strong style={{ color: '#0F2A1D' }}>{order.id}</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#999', fontSize: '0.8rem' }}>Végösszeg</div>
                <strong style={{ color: '#C9A961', fontSize: '1.1rem' }}>{(order.total || 0).toLocaleString('hu-HU')} Ft</strong>
              </div>
            </div>

            {cancelled ? (
              <div style={{ backgroundColor: '#fdecea', color: '#b3261e', padding: '1rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <XCircle size={20} /> <strong>Ez a rendelés le lett mondva.</strong>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.25rem', margin: '1rem 0 1.5rem 0' }}>
                {STEPS.map((s, i) => {
                  const Icon = s.icon;
                  const done = i <= activeIdx;
                  return (
                    <div key={s.id} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                      {i > 0 && (
                        <div style={{
                          position: 'absolute', top: '18px', right: '50%', width: '100%', height: '3px',
                          backgroundColor: i <= activeIdx ? '#4CAF50' : '#e0e0e0', zIndex: 0
                        }} />
                      )}
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '50%', margin: '0 auto',
                        backgroundColor: done ? '#4CAF50' : '#e0e0e0', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative', zIndex: 1
                      }}>
                        <Icon size={18} />
                      </div>
                      <div style={{ fontSize: '0.75rem', marginTop: '0.4rem', color: done ? '#0F2A1D' : '#999', fontWeight: done ? 'bold' : 'normal' }}>
                        {s.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {order.trackingNumber && (
              <div style={{ backgroundColor: '#f5f7f5', borderLeft: '4px solid #C9A961', padding: '0.9rem 1rem', borderRadius: '4px', marginBottom: '1rem' }}>
                <strong style={{ color: '#0F2A1D' }}>Csomagszám:</strong> {order.trackingNumber}
                <div style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                  Ezzel a számmal a futárszolgálat oldalán is nyomon követheted a csomagot.
                </div>
              </div>
            )}

            <h3 style={{ color: '#0F2A1D', fontSize: '1rem', marginBottom: '0.6rem' }}>Tételek</h3>
            {(order.items || []).map((it, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem' }}>
                <div>
                  {it.name}
                  {(it.size || it.color) && (
                    <span style={{ color: '#888', fontSize: '0.82rem' }}>
                      {' '}({[it.size, it.color].filter(Boolean).join(' · ')})
                    </span>
                  )}
                </div>
                <div style={{ whiteSpace: 'nowrap', color: '#0F2A1D' }}>
                  {it.quantity} × {(it.price || 0).toLocaleString('hu-HU')} Ft
                </div>
              </div>
            ))}

            <div style={{ marginTop: '1.25rem', color: '#666', fontSize: '0.88rem', lineHeight: 1.7 }}>
              {order.shippingMethod && <div><strong>Szállítás:</strong> {order.shippingMethod === 'foxpost' ? 'Foxpost automata' : 'Házhozszállítás'}{order.pickupPoint ? ` — ${order.pickupPoint}` : ''}</div>}
              {order.paymentMethod && <div><strong>Fizetés:</strong> {order.paymentMethod}</div>}
              {order.invoiceNumber && <div><strong>Számlaszám:</strong> {order.invoiceNumber}</div>}
            </div>
          </div>
        )}

        <div style={{ backgroundColor: '#0F2A1D', color: 'white', padding: '1.25rem', borderRadius: '8px', marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ margin: '0 0 0.4rem 0', fontWeight: 'bold' }}>Nem találod a rendelésed?</p>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '0.92rem' }}>
            Hívj minket: <strong style={{ color: '#C9A961' }}>+36 30 272 2571</strong> · iroda@tuz-munkavedelmiszaki.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;
