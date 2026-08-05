import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
// A WorkwearShop marad eager import: ez a leggyakrabban elért belépési pont
// (fő- és kategória-oldalak), a lazy-loading itt csak felesleges késleltető
// kört adna hozzá az első betöltéshez. Minden más route lazy — korábban az
// egész app (admin panel is!) egyetlen ~610 kB-os JS-bundle-ben ment ki
// MINDEN látogatónak, ami feleslegesen lassítja a betöltést (Core Web Vitals).
import WorkwearShop from './components/WorkwearShop';
import CookieConsent from './components/CookieConsent';
import { LanguageProvider } from './i18n/LanguageContext';
import { Lock } from 'lucide-react';
import { initAnalytics, trackPageView } from './utils/analytics';
import { initStorage } from './data/storage';
import { isSupabaseEnabled, adminApi, setAdminPassword, setAdminRole, clearAdminRole } from './data/supabaseClient';

const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const FaqPage = lazy(() => import('./pages/FaqPage'));
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage'));
const PaymentResultPage = lazy(() => import('./pages/PaymentResultPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
// A StaticPages.jsx névvel exportál (nem default), ezért a lazy()-nek magunk
// csomagoljuk { default } alakúra importáláskor.
const TermsPage = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.PrivacyPage })));
const ImpressumPage = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.ImpressumPage })));
const ShippingPage = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.ShippingPage })));
const ContactPage = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.ContactPage })));
const AboutPage = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.AboutPage })));

// Suspense fallback route-váltáskor - rövid, márkázott betöltő, nem üres villanás
const RouteLoading = () => (
  <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', color: '#0F2A1D', fontFamily: 'Arial, sans-serif' }}>
    <div style={{ fontSize: '1.5rem' }}>🛡️</div>
  </div>
);

// Route változás követése GA4 + FB Pixel számára
const RouteTracker = () => {
  const location = useLocation();
  React.useEffect(() => {
    trackPageView(location.pathname);
  }, [location]);
  return null;
};

function App() {
  const [passwordInput, setPasswordInput] = React.useState('');
  const [loggingIn, setLoggingIn] = React.useState(false);
  const [storageReady, setStorageReady] = React.useState(!isSupabaseEnabled);

  React.useEffect(() => {
    // Analytics indítás
    initAnalytics();
    // Supabase módban: adatok betöltése a memória-cache-be render előtt
    if (isSupabaseEnabled) {
      initStorage().finally(() => setStorageReady(true));
    }
  }, []);

  // Admin bejelentkezés: Supabase módban szerver-oldali jelszó-ellenőrzés
  // (a jelszó nincs benne a kliens bundle-ben), localStorage módban a régi env-összevetés
  const handleLogin = async () => {
    if (loggingIn) return;
    setLoggingIn(true);
    const localCheck = () => {
      const localPw = process.env.REACT_APP_ADMIN_PASSWORD || 'admin123';
      if (passwordInput !== localPw) throw new Error('Hibás jelszó');
    };
    try {
      if (isSupabaseEnabled) {
        setAdminPassword(passwordInput);
        try {
          const res = await adminApi('login');
          setAdminRole(res.role || 'admin');
        } catch (e) {
          // 401 = rossz jelszó; egyéb (pl. lokális dev, nincs function) → helyi ellenőrzés
          if ((e.message || '').includes('401') || (e.message || '').includes('Hibás jelszó')) throw e;
          localCheck();
          setAdminRole('admin');
        }
      } else {
        localCheck();
        setAdminRole('admin');
      }
      sessionStorage.setItem('admin_logged_in', 'true');
      window.location.href = '/admin';
    } catch (e) {
      setAdminPassword('');
      clearAdminRole();
      alert('Hibás jelszó!');
      setPasswordInput('');
      setLoggingIn(false);
    }
  };

  if (!storageReady) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafaf8', fontFamily: 'Arial, sans-serif', color: '#0F2A1D' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛡️</div>
          <div>Betöltés...</div>
        </div>
      </div>
    );
  }

  return (
    <LanguageProvider>
    <BrowserRouter>
      <RouteTracker />
      <CookieConsent />
      <Suspense fallback={<RouteLoading />}>
      <Routes>
        {/* Admin Login */}
        <Route path="/admin-login" element={
          <div style={{
            backgroundColor: '#fafaf8',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <h1 style={{
                color: '#0F2A1D',
                textAlign: 'center',
                marginTop: 0,
                fontSize: '1.5rem'
              }}>
                <Lock style={{ display: 'inline', marginRight: '0.5rem' }} />
                Admin Bejelentkezés
              </h1>

              <input
                type="password"
                placeholder="Jelszó"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleLogin();
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  marginBottom: '1rem',
                  boxSizing: 'border-box'
                }}
              />

              <button
                onClick={handleLogin}
                disabled={loggingIn}
                style={{
                  width: '100%',
                  backgroundColor: '#0F2A1D',
                  color: 'white',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              >
                Bejelentkezés
              </button>

              <p style={{
                textAlign: 'center',
                color: '#666',
                fontSize: '0.9rem',
                marginTop: '1rem'
              }}>
                <Link to="/" style={{ color: '#0F2A1D', textDecoration: 'none' }}>
                  ← Vissza a főoldalra
                </Link>
              </p>
            </div>
          </div>
        } />

        {/* Admin Panel */}
        <Route path="/admin" element={<AdminPanel />} />

        {/* Checkout */}
        <Route path="/checkout" element={<CheckoutPage />} />

        {/* Statikus oldalak */}
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/impressum" element={<ImpressumPage />} />
        <Route path="/shipping" element={<ShippingPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/gyik" element={<FaqPage />} />
        <Route path="/rendeles-kovetes" element={<OrderTrackingPage />} />
        <Route path="/fizetes-eredmeny" element={<PaymentResultPage />} />
        <Route path="/fiok" element={<AccountPage />} />

        {/* Új v6.0 route-ok */}
        <Route path="/termek/:slug" element={<ProductDetailPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />

        {/* Kategória-oldalak — ugyanazt a WorkwearShop komponenst renderelik, mint a
            főoldal, de valódi, saját canonical URL-lel/címmel (SEO: korábban a
            kategória-szűrés csak kliens-oldali state volt, nem lehetett indexelni) */}
        <Route path="/kategoria/:catSlug" element={<WorkwearShop />} />
        <Route path="/kategoria/:catSlug/:subSlug" element={<WorkwearShop />} />

        {/* Főoldal */}
        <Route path="/" element={<WorkwearShop />} />

        {/* Ismeretlen URL — minden más útvonal után! */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
