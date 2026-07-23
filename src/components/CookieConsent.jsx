import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getCookieConsent, setCookieConsent, initAnalytics } from '../utils/analytics';

// GDPR cookie hozzájárulás banner
// Az analytics (GA4 + FB Pixel) csak az "Elfogadom" után töltődik be.
const CookieConsent = () => {
  const [visible, setVisible] = useState(() => !getCookieConsent());

  if (!visible) return null;

  const acceptAll = () => {
    setCookieConsent('all');
    setVisible(false);
    initAnalytics();
  };

  const acceptNecessary = () => {
    setCookieConsent('necessary');
    setVisible(false);
  };

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 2000,
      backgroundColor: '#0a1f19', color: '#eee', padding: '1rem 1.5rem',
      boxShadow: '0 -4px 16px rgba(0,0,0,0.3)', fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px', margin: '0 auto', display: 'flex',
        alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap'
      }}>
        <p style={{ margin: 0, flex: '1 1 300px', fontSize: '0.9rem', lineHeight: 1.5 }}>
          🍪 Weboldalunk sütiket használ a működéshez, valamint — hozzájárulásod esetén —
          statisztikai és marketing célokra (Google Analytics, Facebook Pixel). Részletek az{' '}
          <Link to="/privacy" style={{ color: '#C9A961', textDecoration: 'underline' }}>
            Adatvédelmi tájékoztatóban
          </Link>.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={acceptNecessary} style={{
            padding: '0.6rem 1.2rem', backgroundColor: 'transparent', color: '#ccc',
            border: '1px solid #666', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem'
          }}>
            Csak a szükségesek
          </button>
          <button onClick={acceptAll} style={{
            padding: '0.6rem 1.2rem', backgroundColor: '#C9A961', color: '#0F2A1D',
            border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem'
          }}>
            Elfogadom
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
