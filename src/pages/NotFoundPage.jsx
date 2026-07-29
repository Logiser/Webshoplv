import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';

// 404 oldal — ismeretlen URL esetén. Nem hagyjuk üresen a látogatót:
// visszavezetjük a kategóriákhoz és a keresőhöz.
const NotFoundPage = () => {
  useEffect(() => {
    document.title = 'A keresett oldal nem található | MunkavédelmiShop';
    // A keresők ne indexeljék a 404-eket
    let tag = document.querySelector('meta[name="robots"][data-404]');
    if (!tag) {
      tag = document.createElement('meta');
      tag.name = 'robots';
      tag.setAttribute('data-404', 'true');
      document.head.appendChild(tag);
    }
    tag.content = 'noindex, follow';
    return () => { if (tag && tag.parentNode) tag.parentNode.removeChild(tag); };
  }, []);

  const linkStyle = {
    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.85rem 1.5rem', borderRadius: '6px', textDecoration: 'none',
    fontWeight: 'bold', fontSize: '1rem'
  };

  return (
    <div style={{
      backgroundColor: '#fafaf8', minHeight: '100vh', fontFamily: 'Arial, sans-serif',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem'
    }}>
      <div style={{ maxWidth: '560px', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>🛡️</div>
        <h1 style={{
          color: '#0F2A1D', fontFamily: 'Georgia, serif', fontSize: '2.2rem', margin: '0 0 0.75rem 0'
        }}>
          Ez az oldal nincs meg
        </h1>
        <p style={{ color: '#666', fontSize: '1.05rem', lineHeight: 1.6, margin: '0 0 2rem 0' }}>
          Lehet, hogy elírtad a címet, vagy a keresett termék már nem elérhető.
          A teljes kínálatunk — több mint 1 800 munkavédelmi termék — egy kattintásra van.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" style={{ ...linkStyle, backgroundColor: '#0F2A1D', color: 'white' }}>
            <Home size={18} /> Vissza a webshopba
          </Link>
          <Link to="/#kategoriak" style={{
            ...linkStyle, backgroundColor: 'white', color: '#0F2A1D', border: '2px solid #0F2A1D'
          }}>
            <Search size={18} /> Kategóriák böngészése
          </Link>
        </div>

        <div style={{
          marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e0e0e0',
          color: '#888', fontSize: '0.9rem'
        }}>
          <p style={{ margin: '0 0 0.5rem 0' }}>Segítsünk megtalálni, amit keresel?</p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: '#C9A961' }}>+36 30 272 2571</strong>
            {' · '}
            <a href="mailto:iroda@tuz-munkavedelmiszaki.hu" style={{ color: '#0F2A1D' }}>
              iroda@tuz-munkavedelmiszaki.hu
            </a>
          </p>
          <p style={{ marginTop: '1rem' }}>
            <Link to="/gyik" style={{ color: '#666', fontSize: '0.85rem' }}>
              <ArrowLeft size={12} style={{ verticalAlign: 'middle' }} /> Gyakori kérdések
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
