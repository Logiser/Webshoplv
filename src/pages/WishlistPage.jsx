import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, X, ArrowLeft, UploadCloud, DownloadCloud } from 'lucide-react';
import { productCategories } from '../data/productData';
import { getWishlist, toggleWishlist, getAllProducts, saveWishlistToCloud, loadWishlistFromCloud } from '../data/storage';
import { isSupabaseEnabled } from '../data/supabaseClient';

const WishlistPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [syncEmail, setSyncEmail] = useState(() => localStorage.getItem('ms_wishlist_email') || '');
  const [syncMsg, setSyncMsg] = useState(null);   // {type: 'ok'|'err', text}
  const [syncBusy, setSyncBusy] = useState(false);

  const handleSync = async (op) => {
    const email = syncEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSyncMsg({ type: 'err', text: 'Adj meg érvényes email címet!' });
      return;
    }
    setSyncBusy(true);
    setSyncMsg(null);
    try {
      localStorage.setItem('ms_wishlist_email', email);
      if (op === 'save') {
        const r = await saveWishlistToCloud(email);
        setSyncMsg({ type: 'ok', text: `✅ ${r.count} kedvenc elmentve ehhez: ${email}` });
      } else {
        const items = await loadWishlistFromCloud(email);
        setRefresh(r => r + 1);
        setSyncMsg({ type: 'ok', text: `✅ ${items.length} kedvenc betöltve` });
      }
    } catch (e) {
      setSyncMsg({ type: 'err', text: e.message || 'Hiba történt, próbáld újra!' });
    } finally {
      setSyncBusy(false);
    }
  };

  useEffect(() => {
    document.title = 'Kedvencek - MunkavédelmiShop';
    const wishlistIds = getWishlist();
    const all = getAllProducts();
    setProducts(all.filter(p => wishlistIds.includes(p.id) && !p.hidden));
  }, [refresh]);

  const handleRemove = (id) => {
    toggleWishlist(id);
    setRefresh(r => r + 1);
  };

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <header style={{
        backgroundColor: 'white', padding: '1rem 1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderBottom: '3px solid #C9A961'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#0F2A1D', fontFamily: 'Georgia, serif', fontSize: '1.5rem' }}>
            🛡️ MunkavédelmiShop
          </Link>
          <Link to="/" style={{ color: '#0F2A1D', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={18} /> Vissza a webshopra
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1.5rem' }}>
        <h1 style={{ color: '#0F2A1D', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Heart size={32} fill="#d32f2f" color="#d32f2f" /> Kedvenceim
        </h1>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
          {products.length} mentett termék
        </p>

        {isSupabaseEnabled && (
          <div style={{ backgroundColor: 'white', padding: '1rem 1.5rem', borderRadius: '8px', marginBottom: '2rem', borderLeft: '4px solid #C9A961' }}>
            <p style={{ margin: '0 0 0.75rem 0', color: '#0F2A1D', fontWeight: 'bold', fontSize: '0.95rem' }}>
              ☁️ Kedvencek mentése email-címhez — így bármelyik eszközödről elérheted
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="email"
                value={syncEmail}
                onChange={(e) => { setSyncEmail(e.target.value); setSyncMsg(null); }}
                placeholder="email@cimed.hu"
                style={{ flex: '1 1 220px', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              <button onClick={() => handleSync('save')} disabled={syncBusy} style={{
                padding: '0.6rem 1rem', backgroundColor: '#0F2A1D', color: 'white', border: 'none',
                borderRadius: '4px', cursor: syncBusy ? 'wait' : 'pointer', fontWeight: 'bold',
                display: 'flex', alignItems: 'center', gap: '0.4rem'
              }}>
                <UploadCloud size={16} /> Mentés
              </button>
              <button onClick={() => handleSync('load')} disabled={syncBusy} style={{
                padding: '0.6rem 1rem', backgroundColor: 'white', color: '#0F2A1D', border: '2px solid #0F2A1D',
                borderRadius: '4px', cursor: syncBusy ? 'wait' : 'pointer', fontWeight: 'bold',
                display: 'flex', alignItems: 'center', gap: '0.4rem'
              }}>
                <DownloadCloud size={16} /> Betöltés
              </button>
            </div>
            {syncMsg && (
              <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.85rem', fontWeight: 'bold', color: syncMsg.type === 'ok' ? '#4CAF50' : '#d32f2f' }}>
                {syncMsg.text}
              </p>
            )}
          </div>
        )}

        {products.length === 0 ? (
          <div style={{ backgroundColor: 'white', padding: '4rem 2rem', borderRadius: '8px', textAlign: 'center' }}>
            <Heart size={64} color="#ddd" style={{ marginBottom: '1rem' }} />
            <h3 style={{ color: '#666' }}>Nincs még kedvenced</h3>
            <p style={{ color: '#999', marginBottom: '1.5rem' }}>
              A termékkártyán a ❤️ ikonra kattintva mentheted el a kedvenceidet!
            </p>
            <button onClick={() => navigate('/')} style={{
              padding: '0.75rem 1.5rem', backgroundColor: '#0F2A1D', color: 'white',
              border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
            }}>
              Vissza a termékekhez
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1.5rem'
          }}>
            {products.map(p => {
              const price = (p.sale && p.sale.active) ? p.sale.price : p.price;
              return (
                <div key={p.id} style={{
                  backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)', position: 'relative'
                }}>
                  <button
                    onClick={() => handleRemove(p.id)}
                    style={{
                      position: 'absolute', top: '0.5rem', right: '0.5rem', zIndex: 2,
                      backgroundColor: 'white', border: 'none', borderRadius: '50%',
                      width: '32px', height: '32px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <X size={16} color="#666" />
                  </button>

                  <Link to={`/termek/${p.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ backgroundColor: '#f9f9f9', padding: '1rem' }}>
                      <img src={p.image} alt={p.name} style={{ width: '100%', height: '180px', objectFit: 'contain' }} />
                    </div>
                    <div style={{ padding: '1rem' }}>
                      <p style={{ color: '#999', fontSize: '0.75rem', margin: 0, textTransform: 'uppercase' }}>
                        {productCategories.find(c => c.id === p.categoryId)?.name}
                      </p>
                      <h3 style={{ color: '#0F2A1D', fontSize: '0.95rem', minHeight: '2.6em', margin: '0.5rem 0' }}>
                        {p.name}
                      </h3>
                      {p.sale && p.sale.active ? (
                        <div>
                          <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.9rem', marginRight: '0.5rem' }}>
                            {p.price.toLocaleString('hu-HU')} Ft
                          </span>
                          <span style={{ color: '#d32f2f', fontSize: '1.3rem', fontWeight: 'bold' }}>
                            {price.toLocaleString('hu-HU')} Ft
                          </span>
                        </div>
                      ) : (
                        <p style={{ color: '#C9A961', fontSize: '1.3rem', fontWeight: 'bold', margin: 0 }}>
                          {price.toLocaleString('hu-HU')} Ft
                        </p>
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
