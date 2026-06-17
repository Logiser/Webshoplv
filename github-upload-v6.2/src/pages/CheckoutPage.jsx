import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, AlertCircle } from 'lucide-react';
import { saveOrder } from '../data/storage';
import { openInvoice } from '../utils/invoice';
import { trackBeginCheckout, trackPurchase } from '../utils/analytics';

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart = [], total = 0 } = location.state || {};

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    zipCode: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Begin checkout tracking - GA4 + FB Pixel
  useEffect(() => {
    if (cart.length > 0 && total > 0) {
      trackBeginCheckout(cart, total);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validáció
    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      setError('Kérjük, töltsd ki az összes kötelező mezőt!');
      setLoading(false);
      return;
    }

    if (cart.length === 0) {
      setError('A kosár üres!');
      setLoading(false);
      return;
    }

    try {
      // Rendelés mentése localStorage-ba (FIFO csökkentés automatikus)
      const savedOrder = saveOrder({
        customerName: `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
        customer: formData,
        cart: cart,
        items: cart,
        total: total,
        timestamp: new Date().toISOString()
      });

      // Email küldés a backend-re (Netlify Function) - nem blokkoló
      const orderData = {
        orderId: savedOrder.id,
        customer: formData,
        items: cart,
        total: total,
        timestamp: new Date().toISOString()
      };

      try {
        await fetch('/.netlify/functions/send-order-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });
      } catch (emailErr) {
        console.warn('Email küldés hiba (nem blokkoló):', emailErr);
      }

      setSuccess(true);
      
      // Purchase tracking - GA4 + FB Pixel
      trackPurchase(savedOrder.id, cart, total);
      
      // Automatikus számla nyitása új ablakban
      setTimeout(() => {
        try {
          openInvoice(savedOrder);
        } catch (e) {
          console.warn('Számla generálás hiba:', e);
        }
      }, 500);
      
      setTimeout(() => {
        navigate('/');
      }, 5000);
    } catch (err) {
      setError('Hiba történt a rendelés feldolgozásakor. Kérjük, próbálj később!');
      console.error('Order error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0 && !success) {
    return (
      <div style={{ backgroundColor: '#fafaf8', minHeight: '100vh', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', paddingTop: '3rem' }}>
          <AlertCircle size={48} style={{ color: '#d32f2f', margin: '0 auto 1rem' }} />
          <h1 style={{ color: '#0F2A1D' }}>A kosár üres!</h1>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Add hozzá termékeket a kosárhoz a rendelhetsz.
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              backgroundColor: '#0F2A1D',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem'
            }}
          >
            Vissza a termékkatalógushoz
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ backgroundColor: '#fafaf8', minHeight: '100vh', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', paddingTop: '3rem' }}>
          <Check size={64} style={{ color: '#4CAF50', margin: '0 auto 1rem' }} />
          <h1 style={{ color: '#0F2A1D' }}>Rendelés sikeresen elküldve!</h1>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            Köszönjük a rendelésedért! Az iroda@tuz-munkavedelmiszaki.hu email címre elküldtük a rendelés részleteit.
          </p>
          <p style={{ color: '#999', marginBottom: '2rem' }}>
            Rövid időn belül felveszik veled a kapcsolatot.
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              backgroundColor: '#0F2A1D',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem'
            }}
          >
            Vissza a főoldalra
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#fafaf8', minHeight: '100vh', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ color: '#0F2A1D', marginTop: 0, fontSize: '2.5rem', fontFamily: 'Georgia, serif' }}>
          Rendelés Lezárása
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          {/* Rendelés összesítő */}
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', height: 'fit-content' }}>
            <h2 style={{ color: '#0F2A1D', marginTop: 0 }}>Rendelési Összesítő</h2>

            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #ddd' }}>
              {cart.map((item, idx) => (
                <div key={idx} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 0.25rem 0', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        {item.name}
                      </p>
                      {item.size && (
                        <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: '#999' }}>
                          Méret: {item.size}
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span>{item.quantity} × {item.price.toLocaleString('hu-HU')} Ft</span>
                    <span style={{ fontWeight: 'bold', color: '#C9A961' }}>
                      {(item.quantity * item.price).toLocaleString('hu-HU')} Ft
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ backgroundColor: '#f0f0ec', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Termékek összesen:</span>
                <span style={{ fontWeight: 'bold' }}>{(total - 1990).toLocaleString('hu-HU')} Ft</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Szállítás:</span>
                <span style={{ fontWeight: 'bold', color: '#C9A961' }}>1.990 Ft</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.3rem',
                fontWeight: 'bold',
                paddingTop: '1rem',
                borderTop: '1px solid #ddd',
                color: '#0F2A1D'
              }}>
                <span>Végösszesen:</span>
                <span style={{ color: '#C9A961' }}>{total.toLocaleString('hu-HU')} Ft</span>
              </div>
            </div>
          </div>

          {/* Rendelési forma */}
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px' }}>
            <h2 style={{ color: '#0F2A1D', marginTop: 0 }}>Szállítási Adatok</h2>

            {error && (
              <div style={{
                backgroundColor: '#ffebee',
                color: '#c62828',
                padding: '1rem',
                borderRadius: '4px',
                marginBottom: '1rem',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'start'
              }}>
                <AlertCircle size={20} style={{ marginTop: '0.25rem', flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#0F2A1D' }}>
                  Név *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Teljes neved"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#0F2A1D' }}>
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#0F2A1D' }}>
                  Telefon *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+36 30 123 4567"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#0F2A1D' }}>
                  Cég/Szervezet
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Cég neve (opcionális)"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#0F2A1D' }}>
                  Szállítási cím *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Utca, házszám"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#0F2A1D' }}>
                    Város *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Város"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#0F2A1D' }}>
                    Irányítószám *
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    placeholder="1000"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#0F2A1D' }}>
                  Megjegyzések (opcionális)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Speciális utasítások, kívánságok..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    minHeight: '80px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  backgroundColor: loading ? '#ccc' : '#0F2A1D',
                  color: 'white',
                  padding: '1rem',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  transition: 'background-color 0.3s'
                }}
              >
                {loading ? 'Feldolgozás...' : 'Rendelés Elküldése'}
              </button>
            </form>

            <p style={{ color: '#999', fontSize: '0.85rem', marginTop: '1rem', textAlign: 'center' }}>
              💳 Fizetés: A rendelés után e-mailben fogjuk küldeni a fizetési adatokat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
